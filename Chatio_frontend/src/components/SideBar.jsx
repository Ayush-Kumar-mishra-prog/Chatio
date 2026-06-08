import { useState } from "react";
import assets, { userDummyData } from "../assets/assets";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  const statusDummyData = userDummyData.map((user, index) => ({
    ...user,
    statusTime: index === 0 ? "Just now" : `${index + 1}h ago`,
    statusText: index % 2 === 0 ? "New photo update" : "Available today",
  }));
  const callsDummyData = userDummyData.map((user, index) => ({
    ...user,
    callType: index % 2 === 0 ? "Incoming" : "Outgoing",
    callTime: index === 0 ? "Today, 9:12 AM" : `Yesterday, ${index + 2}:30 PM`,
    missed: index === 3,
  }));
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filterBySearch = (items) =>
    normalizedSearch
      ? items.filter((item) =>
          (item.fullName || item.name || "").toLowerCase().includes(normalizedSearch),
        )
      : items;
  const filteredUsers = filterBySearch(conversations.filter((item) => item.type !== "group"));
  const filteredGroups = filterBySearch(conversations.filter((item) => item.type === "group"));
  const filteredFavorites = filterBySearch(conversations.filter((item) => item.isFavorite));
  const filteredStatuses = filterBySearch(statusDummyData);
  const filteredCalls = filterBySearch(callsDummyData);
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
        const online = !isGroup && chat.members?.some((member) => member._id !== user?._id && onlineUsers.includes(member._id));
        const unread = unseenMessages[chat._id] || 0;
        return (
        <div
          onClick={() => {
            selectConversation(chat);
          }}
          key={chat._id}
          className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer max-sm:text-sm border-b border-slate-100 transition ${slectedUser?._id === chat._id ? "bg-[#d9fdd3]" : "hover:bg-[#f0f2f5]"}`}
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
      {filteredStatuses.map((user) => (
        <button
          key={user._id}
          type="button"
          onClick={() => navigate(`/status`)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 hover:bg-[#f0f2f5]"
        >
          <span className="h-12 w-12 rounded-full border-2 border-[#25d366] p-0.5">
            <img
              src={user.profilePic || assets.avatar_icon}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          </span>
          <span className="min-w-0">
            <span className="block font-medium truncate">{user.fullName}</span>
            <span className="block text-xs text-slate-500 truncate">
              {user.statusText}
            </span>
            <span className="block text-xs text-[#00a884]">
              {user.statusTime}
            </span>
          </span>
        </button>
      ))}
    </div>
  );

  const renderCallsList = () => (
    <div className="py-2">
      {filteredCalls.map((user) => {
        const CallIcon =
          user.callType === "Incoming" ? PhoneIncoming : PhoneOutgoing;
        return (
          <button
            key={user._id}
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 hover:bg-[#f0f2f5]"
          >
            <img
              src={user.profilePic || assets.avatar_icon}
              alt=""
              className="h-11 w-11 rounded-full object-cover"
            />
            <span className="min-w-0 flex-1">
              <span
                className={`block font-medium truncate ${user.missed ? "text-red-500" : "text-slate-900"}`}
              >
                {user.fullName}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <CallIcon
                  className={`size-3.5 ${user.missed ? "text-red-500" : "text-[#00a884]"}`}
                />
                {user.callType} - {user.callTime}
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

      {showNewChat && (
        <div className="mx-4 mt-3 rounded-lg border border-emerald-100 bg-white shadow-xl overflow-y-scroll">
          <div className="p-3 border-b border-emerald-100">
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
          <button
            type="button"
            onClick={onCreateGroup}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50"
          >
            <span className="h-9 w-9 rounded-full bg-[#00a884] text-white flex items-center justify-center">
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
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-emerald-50"
            >
              <img
                src={contact.image || contact.profilePic || assets.avatar_icon}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
              <span className="text-sm">{contact.name || contact.fullName}</span>
              <UserPlus className="ml-auto size-4 text-[#075e54]" />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-scroll">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-600">{activeTab}</p>
          <span className="text-xs text-[#00a884] flex items-center gap-1">
            {activeTab === "Chats" ? (
              <CheckCheck className="size-4" />
            ) : (
              <Clock3 className="size-4" />
            )}
            {isLoading ? "Loading" : `${conversations.length} chats`}
          </span>
        </div>
        {renderActiveContent()}
      </div>
      <button
        type="button"
        title="New chat"
        onClick={() => setShowNewChat((value) => !value)}
        className="absolute bottom-20 right-5 z-20 h-14 w-14 rounded-2xl bg-[#00a884] text-white shadow-xl shadow-emerald-900/20 grid place-items-center hover:bg-[#008f72] transition"
      >
        <Plus className="size-6" />
      </button>
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

export default SideBar;
