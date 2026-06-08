import { useCallback, useEffect, useState } from 'react'
import SideBar from '../components/SideBar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import ProfileEditorPanel from '../components/ProfileEditorPanel'
import CreateGroupPanel from '../components/CreateGroupPanel'
import { createDirectChat, createGroupChat, deleteGroupChat, getChatSidebar, removeGroupMember, toggleBlockChat, toggleFavoriteChat } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

const ChatPage = () => {
    const [slectedUser,setSlectedUser] = useState(false)
    const [showProfile, setShowProfile] = useState(false)
    const [sidebarPanel, setSidebarPanel] = useState("chats")
    const [contacts, setContacts] = useState([])
    const [conversations, setConversations] = useState([])
    const [unseenMessages, setUnseenMessages] = useState({})
    const [isSidebarLoading, setIsSidebarLoading] = useState(false)
    const { socket } = useAuth()

    const normalizeConversation = (conversation) => ({
      ...conversation,
      fullName: conversation.fullName || conversation.name || "Chat",
      profilePic: conversation.profilePic || conversation.image,
    })

    const upsertConversation = useCallback((conversation) => {
      if (!conversation?._id) return
      const normalized = normalizeConversation(conversation)
      setConversations((current) => {
        const exists = current.some((item) => item._id === normalized._id)
        const next = exists
          ? current.map((item) => item._id === normalized._id ? { ...item, ...normalized } : item)
          : [normalized, ...current]
        return next.sort((a, b) => new Date(b.updatedAt || b.lastMessage?.createdAt || 0) - new Date(a.updatedAt || a.lastMessage?.createdAt || 0))
      })
      setSlectedUser((current) => current?._id === normalized._id ? { ...current, ...normalized } : current)
    }, [])

    const loadSidebar = useCallback(async () => {
      try {
        setIsSidebarLoading(true)
        const { data } = await getChatSidebar()
        setContacts(data.users || [])
        setConversations((data.conversations || []).map(normalizeConversation))
        setUnseenMessages(data.unseenMessages || {})
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load chats")
      } finally {
        setIsSidebarLoading(false)
      }
    }, [])

    useEffect(() => {
      queueMicrotask(loadSidebar)
    }, [loadSidebar])

    useEffect(() => {
      if (!socket) return undefined
      const handleConversationUpdated = (conversation) => upsertConversation(conversation)
      const handleConversationDeleted = (conversationId) => {
        setConversations((current) => current.filter((item) => item._id !== conversationId))
        setSlectedUser((current) => current?._id === conversationId ? null : current)
      }
      socket.on("conversationUpdated", handleConversationUpdated)
      socket.on("conversationDeleted", handleConversationDeleted)
      return () => {
        socket.off("conversationUpdated", handleConversationUpdated)
        socket.off("conversationDeleted", handleConversationDeleted)
      }
    }, [socket, upsertConversation])

    const handleSelectUser = (user) => {
      setSlectedUser(user)
      setShowProfile(false)
      setSidebarPanel("chats")
      setUnseenMessages((current) => ({ ...current, [user._id]: 0 }))
    }

    const handleStartDirectChat = async (contact) => {
      try {
        const { data } = await createDirectChat(contact._id)
        const conversation = normalizeConversation(data.conversation)
        upsertConversation(conversation)
        handleSelectUser(conversation)
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to start chat")
      }
    }

    const handleCreateGroup = async (group) => {
      try {
        const { data } = await createGroupChat(group)
        const conversation = normalizeConversation(data.conversation)
        upsertConversation(conversation)
        handleSelectUser(conversation)
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to create group")
      }
    }

    const handleToggleFavorite = async (conversationId) => {
      const { data } = await toggleFavoriteChat(conversationId)
      upsertConversation(data.conversation)
    }

    const handleToggleBlock = async (conversationId) => {
      const { data } = await toggleBlockChat(conversationId)
      upsertConversation(data.conversation)
    }

    const handleDeleteGroup = async (conversationId) => {
      await deleteGroupChat(conversationId)
      setConversations((current) => current.filter((item) => item._id !== conversationId))
      setSlectedUser(null)
      setShowProfile(false)
    }

    const handleRemoveMember = async (conversationId, memberId) => {
      const { data } = await removeGroupMember(conversationId, memberId)
      upsertConversation(data.conversation)
    }

    const handleBackToChats = () => {
      setSlectedUser(null)
      setShowProfile(false)
    }
  return (
    <div className="w-full h-screen bg-[#e8f3ef]/80">
    <div className={`h-full grid grid-cols-1 overflow-hidden bg-[#f7fbf9]/90 shadow-2xl shadow-emerald-950/10 relative
    ${slectedUser ? 'md:grid-cols-[360px_minmax(0,1fr)_320px] xl:grid-cols-[400px_minmax(0,1fr)_360px]':'md:grid-cols-[380px_minmax(0,1fr)]'}`}>
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
          />
        )}
        <ChatContainer
          slectedUser={slectedUser}
          setSlectedUser={handleBackToChats}
          showProfile={showProfile}
          onShowProfile={() => setShowProfile(true)}
          onEditProfile={() => setSidebarPanel("profile")}
          onConversationUpdated={upsertConversation}
        />
        <RightSidebar
          slectedUser={slectedUser}
          showProfile={showProfile}
          onBackToChat={() => setShowProfile(false)}
          onToggleFavorite={handleToggleFavorite}
          onToggleBlock={handleToggleBlock}
          onDeleteGroup={handleDeleteGroup}
          onRemoveMember={handleRemoveMember}
        />
    </div>
    </div>
  )
}

export default ChatPage
