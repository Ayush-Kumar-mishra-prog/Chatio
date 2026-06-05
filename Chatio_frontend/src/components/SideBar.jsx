import { useState } from "react";
import assets, { userDummyData } from "../assets/assets";
import {
  CheckCheck,
  Clock3,
  MessageCircle,
  MoreVertical,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  SearchIcon,
  Star,
  UserPlus,
  Users,
  CircleDashed,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SideBar = ({ slectedUser, setSlectedUser }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [activeTab, setActiveTab] = useState("Chats");
  const [searchTerm, setSearchTerm] = useState("");
  const topTabs = [
    { label: "Chats", icon: MessageCircle },
    { label: "Groups", icon: Users },
    { label: "Favorites", icon: Star },
  ];
  const bottomTabs = [
    { label: "Status", icon: CircleDashed },
    { label: "Calls", icon: Phone },
  ];
  const groupDummyData = [
    {
      _id: "group-design",
      fullName: "Design Team",
      bio: "Alison: Final screens are ready",
      members: "8 members",
      profilePic: assets.logo_icon,
    },
    {
      _id: "group-office",
      fullName: "Office Updates",
      bio: "Marco: Standup at 10:30",
      members: "24 members",
      profilePic: assets.logo_big,
    },
    {
      _id: "group-family",
      fullName: "Family Group",
      bio: "Richard: Dinner plan?",
      members: "6 members",
      profilePic: assets.avatar_icon,
    },
  ];
  const favoriteDummyData = userDummyData.filter(
    (_, index) => index === 0 || index === 2 || index === 4,
  );
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
          item.fullName.toLowerCase().includes(normalizedSearch),
        )
      : items;
  const filteredUsers = filterBySearch(userDummyData);
  const filteredGroups = filterBySearch(groupDummyData);
  const filteredFavorites = filterBySearch(favoriteDummyData);
  const filteredStatuses = filterBySearch(statusDummyData);
  const filteredCalls = filterBySearch(callsDummyData);

  const selectConversation = (conversation) => {
    setSlectedUser(conversation);
    setShowNewChat(false);
  };

  const renderConversationList = (items, type = "chat") => (
    <div className="py-2">
      {items.map((user, index) => (
        <div
          onClick={() => {
            selectConversation(user);
          }}
          key={user._id}
          className={`relative flex items-center gap-3 px-4 py-3 cursor-pointer max-sm:text-sm border-b border-slate-100 transition ${slectedUser?._id === user._id ? "bg-[#d9fdd3]" : "hover:bg-[#f0f2f5]"}`}
        >
          <img
            src={user?.profilePic || assets.avatar_icon}
            alt=""
            className="h-11 w-11 object-cover rounded-full"
          />
          <div className="flex flex-col leading-5 min-w-0">
            <p className="font-medium truncate">{user.fullName}</p>
            <span
              className={`${type === "group" ? "text-slate-500" : index < 3 ? "text-[#00a884]" : "text-slate-400"} text-xs truncate`}
            >
              {type === "group"
                ? user.members
                : index < 3
                  ? "Online"
                  : "Offline"}
            </span>
            <span className="text-xs text-slate-500 truncate">{user.bio}</span>
          </div>
          {type === "favorite" && (
            <Star className="ml-auto size-4 shrink-0 fill-[#25d366] text-[#25d366]" />
          )}
          {type === "chat" && index > 2 && (
            <p className="absolute top-5 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-[#25d366] text-white">
              {index}
            </p>
          )}
        </div>
      ))}
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
    if (activeTab === "Groups")
      return renderConversationList(filteredGroups, "group");
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
              title="New chat"
              onClick={() => setShowNewChat((value) => !value)}
              className="h-10 w-10 rounded-full flex items-center justify-center text-[#075e54] hover:bg-emerald-50 transition"
            >
              <Plus className="size-5" />
            </button>
            <div className="relative py-2">
              <button
                type="button"
                title="Menu"
                onClick={() => setShowMenu((value) => !value)}
                className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-emerald-50 transition"
              >
                <MoreVertical className="size-5 cursor-pointer" />
              </button>
              <div
                className={`absolute top-full right-0 z-20 w-36 p-2 rounded-md bg-white border border-emerald-100 text-slate-800 shadow-xl ${showMenu ? "block" : "hidden"}`}
              >
                <p
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer text-sm rounded px-3 py-2 hover:bg-emerald-50"
                >
                  Edit Profile
                </p>
                <p className="cursor-pointer text-sm rounded px-3 py-2 hover:bg-emerald-50">
                  Logout
                </p>
              </div>
            </div>
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
                placeholder="Search contacts"
              />
            </div>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50">
            <span className="h-9 w-9 rounded-full bg-[#00a884] text-white flex items-center justify-center">
              <Users className="size-5" />
            </span>
            <span className="font-medium">Create group</span>
          </button>
          {userDummyData.map((user) => (
            <button
              key={user._id}
              onClick={() => {
                selectConversation(user);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-emerald-50"
            >
              <img
                src={user.profilePic || assets.avatar_icon}
                alt=""
                className="h-9 w-9 rounded-full object-cover"
              />
              <span className="text-sm">{user.fullName}</span>
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
            Dummy data
          </span>
        </div>
        {renderActiveContent()}
      </div>
      <div className="grid grid-cols-2 shrink-0 sticky bottom-0 z-10 border-t border-emerald-100 bg-white px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
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
      </div>
    </div>
  );
};

export default SideBar;
