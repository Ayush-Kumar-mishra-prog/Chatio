import { useState } from "react";
import assets from "../assets/assets";
import {
  CheckCheck,
  Clock3,
  MessageCircle,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  SearchIcon,
  Star,
  UserPlus,
  Users,
  CircleDashed,
  LogOut,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { asId } from "../lib/utils";

const SideBar = ({
  slectedUser,
  setSlectedUser,
  contacts = [],
  conversations = [],
  unseenMessages = {},
  isLoading,
  onStartDirectChat,
  onEditProfile,
  onCreateGroup,
  statuses = [],
  callLogs = [],
  onStartCall,
  currentUserId,
}) => {
  const navigate = useNavigate();
  const [showNewChat, setShowNewChat] = useState(false);
  const [activeTab, setActiveTab] = useState("Chats");
  const [searchTerm, setSearchTerm] = useState("");
  const [newChatSearch, setNewChatSearch] = useState("");
  const { user, logout, onlineUsers } = useAuth();
  const topTabs = [
    { label: "Chats", icon: MessageCircle },
    { label: "Groups", icon: Users },
    { label: "Favorites", icon: Star },
  ];
  const bottomTabs = [
    { label: "Status", icon: CircleDashed },
    { label: "Calls", icon: Phone },
  ];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filterBySearch = (items) =>
    normalizedSearch
      ? items.filter((item) =>
          (item.fullName || item.name || "").toLowerCase().includes(normalizedSearch),
        )
      : items;
  const filteredUsers = filterBySearch(conversations.filter((item) => item.type !== "group"));
  const filteredGroups = filterBySearch(
    conversations.filter((item) => {
      if (item.type !== "group") return false;
      // Only show groups where user is a member
      return item.members?.some((member) => (member._id || member) === user?._id);
    })
  );
  const filteredFavorites = filterBySearch(conversations.filter((item) => item.isFavorite));
  const groupedStatuses = Object.values(
    statuses.reduce((acc, status) => {
      const owner = status.userId || {};
      const key = asId(owner._id || status.userId);
      if (!key) return acc;
      acc[key] ||= { ...owner, _id: key, items: [], latest: status.createdAt };
      acc[key].items.push(status);
      if (new Date(status.createdAt) > new Date(acc[key].latest)) {
        acc[key].latest = status.createdAt;
      }
      return acc;
    }, {}),
  ).sort((a, b) => new Date(b.latest) - new Date(a.latest));

  const myStatusGroup = groupedStatuses.find(
    (group) => asId(group._id) === asId(currentUserId),
  );
  const otherStatuses = groupedStatuses.filter(
    (group) => asId(group._id) !== asId(currentUserId),
  );
  const filteredStatuses = filterBySearch(otherStatuses);

  const hasUnviewedStatus = (group) =>
    group.items.some(
      (status) =>
        !status.viewers?.some((viewer) => asId(viewer._id || viewer) === asId(currentUserId)),
    );
  const filteredCalls = filterBySearch(callLogs);
  const filteredContacts = (newChatSearch.trim()
    ? contacts.filter((contact) =>
        (contact.name || contact.fullName || "").toLowerCase().includes(newChatSearch.trim().toLowerCase()),
      )
    : contacts
  ).filter((contact) => contact._id !== user?._id);

  const selectConversation = (conversation) => {
    setSlectedUser(conversation);
    setShowNewChat(false);
  };

  const renderConversationList = (items, type = "chat") => (
    <div className="py-2">
      {!items.length && (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
          {isLoading ? "Loading..." : type === "favorite" ? "No favorite chats yet" : "No chats yet"}
        </div>
      )}
      {items.map((chat) => {
        const isGroup = chat.type === "group";
        const online = !isGroup && chat.members?.some(
          (member) =>
            asId(member._id || member) !== asId(user?._id) &&
            onlineUsers.includes(asId(member._id || member)),
        );
        const unread = unseenMessages[chat._id] || 0;
        return (
        <div
          onClick={() => {
            selectConversation(chat);
          }}
          key={chat._id}
          className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer max-sm:text-sm border-b border-slate-100 transition ${asId(slectedUser?._id) === asId(chat._id) ? "bg-[#d9fdd3]" : "hover:bg-[#f0f2f5]"}`}
        >
          <img
            src={chat?.profilePic || assets.avatar_icon}
            alt=""
            className="h-11 w-11 object-cover rounded-full"
          />
          <div className="flex flex-col leading-5 min-w-0">
            <p className="font-medium truncate">{chat.fullName || chat.name}</p>
            <span
              className={`${isGroup || online ? "text-[#00a884]" : "text-slate-400"} text-xs truncate`}
            >
              {isGroup ? `${chat.members?.length || 0} members` : online ? "Online" : "Offline"}
            </span>
            <span className="text-xs text-slate-500 truncate">
              {chat.lastMessage?.text || chat.bio || (chat.lastMessage?.image ? "Image" : "Start chatting")}
            </span>
          </div>
          {chat.isFavorite && (
            <Star className="ml-auto size-4 shrink-0 fill-[#25d366] text-[#25d366]" />
          )}
          {!!unread && (
            <p className="absolute top-5 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-[#25d366] text-white">
              {unread}
            </p>
          )}
        </div>
      )})}
    </div>
  );

  const renderStatusList = () => (
    <div className="py-2">
      <button
        type="button"
        onClick={() => navigate("/status")}
        className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 hover:bg-[#f0f2f5]"
      >
        <span className="relative h-14 w-14 shrink-0">
          <img
            src={user?.image || assets.avatar_icon}
            alt=""
            className="h-14 w-14 rounded-full object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-[#00a884] text-white grid place-items-center border-2 border-white">
            <Plus className="size-3.5" />
          </span>
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">My status</span>
          <span className="block text-sm text-slate-500">
            {myStatusGroup
              ? `${myStatusGroup.items.length} update${myStatusGroup.items.length > 1 ? "s" : ""}`
              : "Click to add status update"}
          </span>
        </span>
      </button>

      {!!filteredStatuses.length && (
        <p className="px-4 pt-4 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Recent updates
        </p>
      )}

      {filteredStatuses.map((statusUser) => {
        const latest = statusUser.items?.at(-1);
        const unviewed = hasUnviewedStatus(statusUser);
        return (
          <button
            key={statusUser._id}
            type="button"
            onClick={() =>
              navigate("/status", { state: { userId: statusUser._id } })
            }
            className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 hover:bg-[#f0f2f5]"
          >
            <span
              className={`h-14 w-14 rounded-full p-0.5 ${unviewed ? "border-2 border-[#25d366]" : "border-2 border-slate-300"}`}
            >
              <img
                src={statusUser.image || assets.avatar_icon}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            </span>
            <span className="min-w-0">
              <span className="block font-medium truncate">
                {statusUser.name || "Contact"}
              </span>
              <span className="block text-sm text-slate-500 truncate">
                {latest?.text || (latest?.image ? "Photo" : "Status update")}
              </span>
              <span className="block text-xs text-[#00a884]">
                {formatShortTime(statusUser.latest)}
              </span>
            </span>
          </button>
        );
      })}

      {!myStatusGroup && !filteredStatuses.length && (
        <p className="px-4 py-8 text-center text-sm text-slate-500">
          No status updates yet. Tap My status to add one.
        </p>
      )}
    </div>
  );

  const renderCallsList = () => (
    <div className="py-2">
      {!filteredCalls.length && (
        <div className="px-4 py-8 text-center text-sm text-slate-500">
          No call history yet
        </div>
      )}
      {filteredCalls.map((call) => {
        const isOutgoing = call.callerId?._id === user?._id;
        const peer = isOutgoing ? call.receiverIds?.[0] : call.callerId;
        const missed = call.status === "missed";
        const CallIcon =
          isOutgoing ? PhoneOutgoing : PhoneIncoming;
        return (
          <button
            key={call._id}
            type="button"
            onClick={() => {
              const conversation = call.conversationId;
              if (conversation?._id) {
                onStartCall?.(
                  {
                    _id: conversation._id,
                    fullName: conversation.name || peer?.name,
                    profilePic: conversation.image || peer?.image,
                    members: conversation.members || [
                      call.callerId,
                      ...(call.receiverIds || []),
                    ],
                  },
                  call.type || "voice",
                );
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 hover:bg-[#f0f2f5]"
          >
            <img
              src={peer?.image || call.conversationId?.image || assets.avatar_icon}
              alt=""
              className="h-11 w-11 rounded-full object-cover"
            />
            <span className="min-w-0 flex-1">
              <span
                className={`block font-medium truncate ${missed ? "text-red-500" : "text-slate-900"}`}
              >
                {peer?.name || call.conversationId?.name || "Call"}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <CallIcon
                  className={`size-3.5 ${missed ? "text-red-500" : "text-[#00a884]"}`}
                />
                {isOutgoing ? "Outgoing" : missed ? "Missed" : "Incoming"} - {formatShortTime(call.createdAt)}
              </span>
            </span>
            <Phone className="size-5 text-[#075e54]" />
          </button>
        );
      })}
    </div>
  );

  const renderActiveContent = () => {
    if (activeTab === "Groups") return renderConversationList(filteredGroups, "group");
    if (activeTab === "Favorites")
      return renderConversationList(filteredFavorites, "favorite");
    if (activeTab === "Status") return renderStatusList();
    if (activeTab === "Calls") return renderCallsList();
    return renderConversationList(filteredUsers, "chat");
  };

  return (
    <div
      className={`bg-white h-full max-md:h-dvh min-h-0 border-r border-emerald-100 text-slate-950 flex flex-col ${slectedUser ? "max-md:hidden" : ""}`}
    >
      <div className="px-4 pt-4 pb-3 border-b border-emerald-100">
        <div className="flex justify-between items-center">
          <div className="flex justify-center items-center gap-2">
            <img
              src={assets.main_logo_}
              alt="logo"
              className="h-11 w-11 object-cover rounded-full"
            />
            <p className="text-2xl font-semibold text-[#075e54]">Chatio</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Edit profile"
              onClick={onEditProfile}
              className="h-10 w-10 rounded-full overflow-hidden border border-emerald-100 hover:ring-2 hover:ring-[#00a884] transition"
            >
              <img
                src={user?.image || assets.avatar_icon}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          </div>
        </div>

        <div className="rounded-full bg-[#f0f2f5] border border-transparent focus-within:border-emerald-300 flex items-center gap-2 px-4 py-3 mt-5">
          <SearchIcon className="size-5 text-[#075e54]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="bg-transparent border-none outline-none text-slate-700 text-sm placeholder:text-slate-400 flex-1"
            placeholder={`Search ${activeTab}...`}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {topTabs.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveTab(label)}
              className={`h-10 rounded-full flex items-center justify-center gap-1.5 text-xs font-semibold transition ${activeTab === label ? "bg-[#d9fdd3] text-[#075e54]" : "text-slate-600 hover:bg-emerald-50"}`}
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

      </div>


      <div className="flex-1 min-h-0 overflow-y-scroll">
        {showNewChat ? (
          <div className="h-full flex flex-col">
            <div className="px-4 pt-3 pb-2 border-b border-emerald-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-600">New Chat</p>
                <button
                  type="button"
                  onClick={() => setShowNewChat(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-200"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-[#f0f2f5] px-3 py-2">
                <SearchIcon className="size-4 text-[#075e54]" />
                <input
                  className="w-full bg-transparent outline-none text-sm"
                  value={newChatSearch}
                  onChange={(event) => setNewChatSearch(event.target.value)}
                  placeholder="Search contacts"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <button
                type="button"
                onClick={onCreateGroup}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50 border-b border-emerald-100"
              >
                <span className="h-10 w-10 rounded-full bg-[#00a884] text-white flex items-center justify-center">
                  <Users className="size-5" />
                </span>
                <span className="font-medium">Create group</span>
              </button>
              {filteredContacts.map((contact) => (
                <button
                  key={contact._id}
                  onClick={() => {
                    onStartDirectChat(contact);
                    setShowNewChat(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50 border-b border-slate-100"
                >
                  <img
                    src={contact.image || contact.profilePic || assets.avatar_icon}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <span className="text-sm flex-1">{contact.name || contact.fullName}</span>
                  <UserPlus className="size-4 text-[#075e54]" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 pt-3 pb-1 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">{activeTab}</p>
              <button
                type="button"
                title="New chat"
                onClick={() => setShowNewChat(true)}
                className="h-8 w-8 rounded-full bg-[#00a884] text-white flex items-center justify-center hover:bg-[#008f72] transition"
              >
                <Plus className="size-5" />
              </button>
            </div>
            {renderActiveContent()}
          </>
        )}
      </div>
      <div className="grid grid-cols-3 shrink-0 sticky bottom-0 z-10 border-t border-emerald-100 bg-white px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {bottomTabs.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(label)}
            className={`h-12 flex flex-col items-center justify-center gap-1 rounded-md text-xs font-medium transition ${activeTab === label ? "bg-[#d9fdd3] text-[#075e54]" : "text-slate-600 hover:bg-emerald-50 hover:text-[#075e54]"}`}
          >
            <Icon className="size-5" />
            <span>{label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/", { replace: true });
          }}
          className="h-12 flex flex-col items-center justify-center gap-1 rounded-md text-xs font-medium transition text-slate-600 hover:bg-emerald-50 hover:text-[#075e54]"
        >
          <LogOut className="size-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const formatShortTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default SideBar;
