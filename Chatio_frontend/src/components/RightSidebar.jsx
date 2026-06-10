import assets from "../assets/assets";
import {
  ArrowLeft,
  Bell,
  Image,
  Lock,
  LogOut,
  Phone,
  Search,
  Star,
  Trash2,
  UserMinus,
  UserPlus,
  Video,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { isMirrorAi } from "../lib/mirrorAi";
import { useEffect, useState } from "react";
import { getChatMessages } from "../api/api";
import LoadingSpinner from "./LoadingSpinner";

const RightSidebar = ({
  slectedUser,
  showProfile,
  onBackToChat,
  onToggleFavorite,
  onToggleBlock,
  onDeleteGroup,
  onRemoveMember,
  onAddMembers,
  contacts = [],
  onStartCall,
  isLoadingFavorite = false,
  isLoadingBlock = false,
  isLoadingDelete = false,
  isLoadingRemove = () => false,
  isLoadingAddMembers = false,
}) => {
  const { user, logout } = useAuth();
  const isGroup = slectedUser?.type === "group";
  const isMirrorAiChat = isMirrorAi(slectedUser);
  const showCallActions = !isGroup && !isMirrorAiChat;
  const isAdmin =
    isGroup &&
    slectedUser?.admins?.some((admin) => (admin._id || admin) === user?._id);
  const [chatImages, setChatImages] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    if (!slectedUser?._id) return;
    const loadChatImages = async () => {
      try {
        const { data } = await getChatMessages(slectedUser._id);
        const images = (data.messages || [])
          .flatMap((msg) =>
            msg.images?.length ? msg.images : msg.image ? [msg.image] : [],
          )
          .reverse()
          .slice(0, 6);
        setChatImages(images);
      } catch (error) {
        setChatImages([]);
      }
    };
    loadChatImages();
  }, [slectedUser?._id]);

  return (
    slectedUser && (
      <div
        className={`bg-white text-slate-900 w-full relative overflow-y-scroll border-l border-emerald-100 ${showProfile ? "max-md:block" : "max-md:hidden"}`}
      >
        <div className="sticky top-0 z-10 h-16 flex items-center gap-3 px-4 bg-[#f0f2f5] border-b border-emerald-100">
          <button
            type="button"
            title="Back to chat"
            onClick={onBackToChat}
            className="md:hidden h-10 w-10 rounded-full flex items-center justify-center hover:bg-slate-200"
          >
            <ArrowLeft className="size-5" />
          </button>
          <p className="font-semibold">Contact info</p>
        </div>

        <div className="pt-8 pb-6 flex flex-col items-center gap-2 text-sm mx-auto border-b border-emerald-100">
          <img
            src={slectedUser?.profilePic || assets.avatar_icon}
            alt=""
            className="w-28 h-28 object-cover rounded-full"
          />
          <h1 className="px-8 text-xl font-semibold mx-auto flex items-center gap-2 text-center">
            {slectedUser.fullName}
          </h1>
          <p className="px-8 mx-auto text-slate-500 text-center">
            {slectedUser.bio}
          </p>
          <span className="text-xs text-[#00a884] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00a884]"></span>
            {isGroup ? `${slectedUser.members?.length || 0} members` : "Online"}
          </span>
          <div className={`grid gap-3 w-full px-5 mt-4 ${showCallActions ? "grid-cols-3" : "grid-cols-1"}`}>
            {showCallActions && (
              <>
            <button
              onClick={() => onStartCall?.(slectedUser, "voice")}
              className="h-16 rounded-lg border border-emerald-100 flex flex-col items-center justify-center gap-1 text-[#075e54] hover:bg-emerald-50"
            >
              <Phone className="size-5" />
              <span className="text-xs">Audio</span>
            </button>
            <button
              onClick={() => onStartCall?.(slectedUser, "video")}
              className="h-16 rounded-lg border border-emerald-100 flex flex-col items-center justify-center gap-1 text-[#075e54] hover:bg-emerald-50"
            >
              <Video className="size-5" />
              <span className="text-xs">Video</span>
            </button>
              </>
            )}
            <button className="h-16 rounded-lg border border-emerald-100 flex flex-col items-center justify-center gap-1 text-[#075e54] hover:bg-emerald-50">
              <Search className="size-5" />
              <span className="text-xs">Search</span>
            </button>
          </div>
        </div>

        {chatImages.length > 0 && (
          <div className="px-5 py-4 text-xs border-b border-emerald-100">
            <p className="font-semibold text-slate-700 flex items-center gap-2">
              <Image className="size-4 text-[#075e54]" />
              Media ({chatImages.length})
            </p>
            <div className="mt-3 max-h-50 overflow-y-scroll grid grid-cols-2 gap-3 opacity-90">
              {chatImages.map((url, index) => (
                <div
                  key={index}
                  onClick={() => window.open(url)}
                  className="cursor-pointer"
                >
                  <img
                    src={url}
                    alt=""
                    className="h-24 w-full object-cover rounded-md"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-5 py-3 space-y-1">
          <button
            onClick={() => onToggleFavorite(slectedUser._id)}
            disabled={isLoadingFavorite}
            className="w-full h-12 flex items-center gap-3 rounded-md px-3 text-sm hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingFavorite ? (
              <LoadingSpinner size="sm" inline />
            ) : (
              <Star
                className={`size-5 text-[#075e54] ${slectedUser.isFavorite ? "fill-[#25d366]" : ""}`}
              />
            )}
            {isLoadingFavorite
              ? "Loading..."
              : slectedUser.isFavorite
                ? "Remove favorite"
                : "Favorite chat"}
          </button>
          <button className="w-full h-12 flex items-center gap-3 rounded-md px-3 text-sm hover:bg-emerald-50">
            <Bell className="size-5 text-[#075e54]" />
            Notifications
          </button>
          <button
            onClick={() => onToggleBlock(slectedUser._id)}
            disabled={isLoadingBlock}
            className="w-full h-12 flex items-center gap-3 rounded-md px-3 text-sm hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingBlock ? (
              <LoadingSpinner size="sm" inline />
            ) : (
              <Lock className="size-5 text-[#075e54]" />
            )}
            {isLoadingBlock
              ? "Loading..."
              : slectedUser.isBlocked
                ? "Unblock chat"
                : "Block chat"}
          </button>
        </div>

        {isGroup && (
          <div className="px-5 py-3 border-t border-emerald-100">
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="w-full flex items-center justify-between mb-2 text-xs font-semibold uppercase text-slate-500 hover:text-[#075e54]"
            >
              <span className="flex items-center gap-2">
                <Users className="size-4" />
                Members ({slectedUser.members?.length || 0})
              </span>
              <span className="text-lg">{showMembers ? "-" : "+"}</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAddMembers((value) => !value)}
                className="mb-3 w-full h-10 flex items-center gap-3 rounded-md px-3 text-sm text-[#075e54] hover:bg-emerald-50"
              >
                <UserPlus className="size-4" />
                Add members
              </button>
            )}
            {showAddMembers && isAdmin && (
              <div className="mb-4 rounded-lg border border-emerald-100 p-2">
                {contacts
                  .filter(
                    (contact) =>
                      !slectedUser.members?.some(
                        (member) => member._id === contact._id,
                      ),
                  )
                  .map((contact) => {
                    const selected = selectedMembers.includes(contact._id);
                    return (
                      <button
                        key={contact._id}
                        type="button"
                        onClick={() =>
                          setSelectedMembers((current) =>
                            selected
                              ? current.filter((id) => id !== contact._id)
                              : [...current, contact._id],
                          )
                        }
                        className={`w-full flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${selected ? "bg-[#d9fdd3]" : "hover:bg-slate-50"}`}
                      >
                        <img
                          src={contact.image || assets.avatar_icon}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <span className="flex-1 truncate">{contact.name}</span>
                      </button>
                    );
                  })}
                {!contacts.filter(
                  (contact) =>
                    !slectedUser.members?.some(
                      (member) => member._id === contact._id,
                    ),
                ).length && (
                  <p className="py-4 text-center text-sm text-slate-500">
                    No contacts to add
                  </p>
                )}
                <button
                  type="button"
                  disabled={!selectedMembers.length || isLoadingAddMembers}
                  onClick={() => onAddMembers(slectedUser._id, selectedMembers)}
                  className="mt-2 w-full rounded-full bg-[#00a884] py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingAddMembers ? (
                    <>
                      <LoadingSpinner size="sm" inline />
                      Adding...
                    </>
                  ) : (
                    "Add selected"
                  )}
                </button>
              </div>
            )}
            {showMembers && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                  Admins
                </p>
                {slectedUser.members
                  ?.filter((member) =>
                    slectedUser.admins?.some(
                      (admin) => (admin._id || admin) === member._id,
                    ),
                  )
                  .map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center gap-3 rounded-md px-3 py-2 bg-emerald-50"
                    >
                      <img
                        src={member.image || assets.avatar_icon}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {member.name}
                      </span>
                      <span className="rounded-full bg-[#00a884] text-white px-2 py-1 text-[11px]">
                        Admin
                      </span>
                    </div>
                  ))}

                <p className="mt-3 mb-2 text-xs font-semibold uppercase text-slate-500">
                  Members
                </p>
                {slectedUser.members
                  ?.filter(
                    (member) =>
                      !slectedUser.admins?.some(
                        (admin) => (admin._id || admin) === member._id,
                      ),
                  )
                  .map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center gap-3 rounded-md px-3 py-2"
                    >
                      <img
                        src={member.image || assets.avatar_icon}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {member.name}
                      </span>
                      {isAdmin && member._id !== user?._id && (
                        <button
                          type="button"
                          title="Remove member"
                          disabled={isLoadingRemove(member._id)}
                          onClick={() =>
                            onRemoveMember(slectedUser._id, member._id)
                          }
                          className="h-8 w-8 rounded-full grid place-items-center text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoadingRemove(member._id) ? (
                            <LoadingSpinner size="sm" inline />
                          ) : (
                            <UserMinus className="size-4" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-4">
          {isAdmin && (
            <button
              onClick={() => {
                if (window.confirm("Delete this group for all members?")) {
                  onDeleteGroup(slectedUser._id);
                }
              }}
              disabled={isLoadingDelete}
              className="mb-3 w-full bg-red-500 hover:bg-red-600 text-white border-none text-sm font-semibold py-3 px-6 rounded-full cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingDelete ? (
                <>
                  <LoadingSpinner size="sm" inline />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete group
                </>
              )}
            </button>
          )}
          <button
            onClick={logout}
            className="w-full bg-[#00a884] hover:bg-[#008f72] text-white border-none text-sm font-semibold py-3 px-6 rounded-full cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </div>
    )
  );
};

export default RightSidebar;
