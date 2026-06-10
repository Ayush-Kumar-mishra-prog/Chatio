import { useCallback, useEffect, useRef, useState } from "react";
import SideBar from "../components/SideBar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import ProfileEditorPanel from "../components/ProfileEditorPanel";
import CreateGroupPanel from "../components/CreateGroupPanel";
import {
  addGroupMembers,
  createDirectChat,
  createGroupChat,
  getCallLogs,
  deleteGroupChat,
  getChatSidebar,
  getStatuses,
  removeGroupMember,
  toggleBlockChat,
  toggleFavoriteChat,
} from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useCall } from "../context/CallContext";
import { useLoading } from "../context/LoadingContext";
import { asId } from "../lib/utils";
import { toast } from "react-toastify";

const ChatPage = () => {
  const [slectedUser, setSlectedUser] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarPanel, setSidebarPanel] = useState("chats");
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [callLogs, setCallLogs] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);
  const { socket, user } = useAuth();
  const { startCall } = useCall();
  const { setLoading, isLoading } = useLoading();
  const selectedUserIdRef = useRef(slectedUser?._id);
  selectedUserIdRef.current = slectedUser?._id;

  const normalizeConversation = (conversation) => ({
    ...conversation,
    fullName: conversation.fullName || conversation.name || "Chat",
    profilePic: conversation.profilePic || conversation.image,
  });

  const upsertConversation = useCallback((conversation) => {
    if (!conversation?._id) return;
    const normalized = normalizeConversation(conversation);
    setConversations((current) => {
      const exists = current.some(
        (item) => asId(item._id) === asId(normalized._id),
      );
      const next = exists
        ? current.map((item) =>
            asId(item._id) === asId(normalized._id)
              ? { ...item, ...normalized }
              : item,
          )
        : [normalized, ...current];
      return next.sort(
        (a, b) =>
          new Date(b.updatedAt || b.lastMessage?.createdAt || 0) -
          new Date(a.updatedAt || a.lastMessage?.createdAt || 0),
      );
    });
    setSlectedUser((current) =>
      asId(current?._id) === asId(normalized._id)
        ? { ...current, ...normalized }
        : current,
    );
  }, []);

  const loadSidebar = useCallback(async () => {
    try {
      setIsSidebarLoading(true);
      const { data } = await getChatSidebar();
      setContacts(data.users || []);
      setConversations((data.conversations || []).map(normalizeConversation));
      setUnseenMessages(data.unseenMessages || {});
      getCallLogs()
        .then((result) => setCallLogs(result.data.calls || []))
        .catch(() => setCallLogs([]));
      getStatuses()
        .then((result) => setStatuses(result.data.statuses || []))
        .catch(() => setStatuses([]));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chats");
    } finally {
      setIsSidebarLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(loadSidebar);
  }, [loadSidebar]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleConversationUpdated = (conversation) => {
      console.log("Conversation updated:", conversation);
      return upsertConversation(conversation);
    };

    const handleConversationDeleted = (conversationId) => {
      console.log("Conversation deleted:", conversationId);
      const id = asId(conversationId);
      setConversations((current) =>
        current.filter((item) => asId(item._id) !== id),
      );
      setSlectedUser((current) =>
        asId(current?._id) === id ? null : current,
      );
    };

    const handleNewMessage = (message) => {
      if (!message?.conversationId) return;
      const conversationId = asId(message.conversationId);
      setConversations((current) =>
        current
          .map((conversation) =>
            asId(conversation._id) === conversationId
              ? {
                  ...conversation,
                  lastMessage: message,
                  updatedAt: message.createdAt,
                }
              : conversation,
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt || b.lastMessage?.createdAt || 0) -
              new Date(a.updatedAt || a.lastMessage?.createdAt || 0),
          ),
      );
      setUnseenMessages((current) => {
        if (
          asId(selectedUserIdRef.current) === conversationId ||
          asId(message.senderId) === asId(user?._id)
        )
          return current;
        return {
          ...current,
          [conversationId]: (current[conversationId] || 0) + 1,
        };
      });
    };

    const handleMessagesSeen = ({ conversationId, messageIds = [] }) => {
      const id = asId(conversationId);
      setUnseenMessages((current) => {
        if (current[id] && current[id] > 0) {
          return {
            ...current,
            [id]: Math.max(0, current[id] - messageIds.length),
          };
        }
        return current;
      });
    };

    const handleStatusNew = (status) => {
      setStatuses((current) => {
        const exists = current.some((item) => asId(item._id) === asId(status._id));
        if (exists) return current;
        return [...current, status];
      });
    };

    const handleStatusViewed = (status) => {
      setStatuses((current) =>
        current.map((item) =>
          asId(item._id) === asId(status._id) ? status : item,
        ),
      );
    };

    socket.on("conversationUpdated", handleConversationUpdated);
    socket.on("conversationDeleted", handleConversationDeleted);
    socket.on("newMessage", handleNewMessage);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("status:new", handleStatusNew);
    socket.on("status:viewed", handleStatusViewed);

    return () => {
      socket.off("conversationUpdated", handleConversationUpdated);
      socket.off("conversationDeleted", handleConversationDeleted);
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("status:new", handleStatusNew);
      socket.off("status:viewed", handleStatusViewed);
    };
  }, [socket, upsertConversation, user?._id]);

  const handleSelectUser = (user) => {
    setSlectedUser(user);
    setShowProfile(false);
    setSidebarPanel("chats");
    setUnseenMessages((current) => ({ ...current, [asId(user._id)]: 0 }));
  };

  const handleStartDirectChat = async (contact) => {
    try {
      const { data } = await createDirectChat(contact._id);
      const conversation = normalizeConversation(data.conversation);
      upsertConversation(conversation);
      handleSelectUser(conversation);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start chat");
    }
  };

  const handleCreateGroup = async (group) => {
    try {
      const { data } = await createGroupChat(group);
      const conversation = normalizeConversation(data.conversation);
      upsertConversation(conversation);
      handleSelectUser(conversation);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
    }
  };

  const handleToggleFavorite = async (conversationId) => {
    try {
      setLoading(`favorite_${conversationId}`, true);
      const { data } = await toggleFavoriteChat(conversationId);
      upsertConversation(data.conversation);
      toast.success(
        data.conversation.isFavorite
          ? "Added to favorites"
          : "Removed from favorites",
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle favorite");
    } finally {
      setLoading(`favorite_${conversationId}`, false);
    }
  };

  const handleToggleBlock = async (conversationId) => {
    try {
      setLoading(`block_${conversationId}`, true);
      const { data } = await toggleBlockChat(conversationId);
      upsertConversation(data.conversation);
      toast.success(
        data.conversation.isBlocked ? "Chat blocked" : "Chat unblocked",
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle block");
    } finally {
      setLoading(`block_${conversationId}`, false);
    }
  };

  const handleDeleteGroup = async (conversationId) => {
    try {
      setLoading(`delete_${conversationId}`, true);
      await deleteGroupChat(conversationId);
      setConversations((current) =>
        current.filter((item) => item._id !== conversationId),
      );
      setSlectedUser(null);
      setShowProfile(false);
      toast.success("Group deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete group");
    } finally {
      setLoading(`delete_${conversationId}`, false);
    }
  };

  const handleRemoveMember = async (conversationId, memberId) => {
    try {
      setLoading(`remove_${conversationId}_${memberId}`, true);
      const { data } = await removeGroupMember(conversationId, memberId);
      upsertConversation(data.conversation);
      toast.success("Member removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    } finally {
      setLoading(`remove_${conversationId}_${memberId}`, false);
    }
  };

  const handleAddMembers = async (conversationId, members) => {
    try {
      setLoading(`add_members_${conversationId}`, true);
      const { data } = await addGroupMembers(conversationId, members);
      upsertConversation(data.conversation);
      toast.success("Members added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add members");
    } finally {
      setLoading(`add_members_${conversationId}`, false);
    }
  };

  const handleStatusCreated = useCallback((status) => {
    if (!status) return;
    setStatuses((current) => {
      const exists = current.some((item) => asId(item._id) === asId(status._id));
      if (exists) return current;
      return [...current, status];
    });
  }, []);

  const handleStatusUpdated = useCallback((status) => {
    if (!status) return;
    setStatuses((current) =>
      current.map((item) => (asId(item._id) === asId(status._id) ? status : item)),
    );
  }, []);

  const handleBackToChats = () => {
    setSlectedUser(null);
    setShowProfile(false);
  };
  return (
    <div className="w-full h-screen bg-[#e8f3ef]/80">
      <div
        className={`h-full grid grid-cols-1 overflow-hidden bg-[#f7fbf9]/90 shadow-2xl shadow-emerald-950/10 relative
    ${slectedUser ? "md:grid-cols-[360px_minmax(0,1fr)_320px] xl:grid-cols-[400px_minmax(0,1fr)_360px]" : "md:grid-cols-[380px_minmax(0,1fr)]"}`}
      >
        {sidebarPanel === "profile" ? (
          <ProfileEditorPanel onBack={() => setSidebarPanel("chats")} />
        ) : sidebarPanel === "group" ? (
          <CreateGroupPanel
            onBack={() => setSidebarPanel("chats")}
            contacts={contacts}
            onCreate={handleCreateGroup}
          />
        ) : (
          <SideBar
            slectedUser={slectedUser}
            setSlectedUser={handleSelectUser}
            contacts={contacts}
            conversations={conversations}
            unseenMessages={unseenMessages}
            isLoading={isSidebarLoading}
            onStartDirectChat={handleStartDirectChat}
            onEditProfile={() => setSidebarPanel("profile")}
            onCreateGroup={() => setSidebarPanel("group")}
            statuses={statuses}
            callLogs={callLogs}
            onStartCall={startCall}
            currentUserId={user?._id}
            onStatusCreated={handleStatusCreated}
            onStatusUpdated={handleStatusUpdated}
          />
        )}
        <ChatContainer
          slectedUser={slectedUser}
          setSlectedUser={handleBackToChats}
          showProfile={showProfile}
          onShowProfile={() => setShowProfile(true)}
          onEditProfile={() => setSidebarPanel("profile")}
          onConversationUpdated={upsertConversation}
          onStartCall={startCall}
        />
        <RightSidebar
          slectedUser={slectedUser}
          showProfile={showProfile}
          onBackToChat={() => setShowProfile(false)}
          onToggleFavorite={handleToggleFavorite}
          onToggleBlock={handleToggleBlock}
          onDeleteGroup={handleDeleteGroup}
          onRemoveMember={handleRemoveMember}
          onAddMembers={handleAddMembers}
          contacts={contacts}
          onStartCall={startCall}
          isLoadingFavorite={isLoading(`favorite_${slectedUser?._id}`)}
          isLoadingBlock={isLoading(`block_${slectedUser?._id}`)}
          isLoadingDelete={isLoading(`delete_${slectedUser?._id}`)}
          isLoadingRemove={(memberId) =>
            isLoading(`remove_${slectedUser?._id}_${memberId}`)
          }
          isLoadingAddMembers={isLoading(`add_members_${slectedUser?._id}`)}
        />
      </div>
    </div>
  );
};

export default ChatPage;
