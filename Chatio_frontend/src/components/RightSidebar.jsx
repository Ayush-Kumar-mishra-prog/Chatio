import assets, { imagesDummyData } from '../assets/assets'
import { ArrowLeft, Bell, Image, Lock, LogOut, Phone, Search, Star, Trash2, UserMinus, Video } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'

const RightSidebar = ({
  slectedUser,
  showProfile,
  onBackToChat,
  onToggleFavorite,
  onToggleBlock,
  onDeleteGroup,
  onRemoveMember,
}) => {
  const { user, logout } = useAuth()
  const isGroup = slectedUser?.type === "group"
  const isAdmin = isGroup && slectedUser?.admins?.some((admin) => (admin._id || admin) === user?._id)

  const runAction = async (action, successMessage) => {
    try {
      await action()
      toast.success(successMessage)
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed")
    }
  }

  return slectedUser && (
    <div className={`bg-white text-slate-900 w-full relative overflow-y-scroll border-l border-emerald-100 ${showProfile ? "max-md:block" : "max-md:hidden"}`}>
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
      <img src={slectedUser?.profilePic || assets.avatar_icon} alt="" className="w-28 h-28 object-cover rounded-full" />
      <h1 className="px-8 text-xl font-semibold mx-auto flex items-center gap-2 text-center">
        {slectedUser.fullName}</h1>
        <p className="px-8 mx-auto text-slate-500 text-center">{slectedUser.bio}</p>
        <span className="text-xs text-[#00a884] flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#00a884]"></span>
          {isGroup ? `${slectedUser.members?.length || 0} members` : "Online"}
        </span>
        <div className="grid grid-cols-3 gap-3 w-full px-5 mt-4">
          <button className="h-16 rounded-lg border border-emerald-100 flex flex-col items-center justify-center gap-1 text-[#075e54] hover:bg-emerald-50">
            <Phone className="size-5" />
            <span className="text-xs">Audio</span>
          </button>
          <button className="h-16 rounded-lg border border-emerald-100 flex flex-col items-center justify-center gap-1 text-[#075e54] hover:bg-emerald-50">
            <Video className="size-5" />
            <span className="text-xs">Video</span>
          </button>
          <button className="h-16 rounded-lg border border-emerald-100 flex flex-col items-center justify-center gap-1 text-[#075e54] hover:bg-emerald-50">
            <Search className="size-5" />
            <span className="text-xs">Search</span>
          </button>
        </div>
     </div>

     <div className="px-5 py-4 text-xs border-b border-emerald-100">
      <p className="font-semibold text-slate-700 flex items-center gap-2">
        <Image className="size-4 text-[#075e54]" />
        Media
      </p>
      <div className="mt-3 max-h-50 overflow-y-scroll grid grid-cols-2 gap-3 opacity-90">
        {imagesDummyData.map((url,index)=>(
          <div key={index} onClick={()=> window.open(url)} className="cursor-pointer">
            <img src={url} alt="" className="h-24 w-full object-cover rounded-md" />
          </div>
        ))}
      </div>
     </div>

     <div className="px-5 py-3 space-y-1">
      <button
        onClick={() => runAction(() => onToggleFavorite(slectedUser._id), slectedUser.isFavorite ? "Removed from favorites" : "Added to favorites")}
        className="w-full h-12 flex items-center gap-3 rounded-md px-3 text-sm hover:bg-emerald-50"
      >
        <Star className={`size-5 text-[#075e54] ${slectedUser.isFavorite ? "fill-[#25d366]" : ""}`} />
        {slectedUser.isFavorite ? "Remove favorite" : "Favorite chat"}
      </button>
      <button className="w-full h-12 flex items-center gap-3 rounded-md px-3 text-sm hover:bg-emerald-50">
        <Bell className="size-5 text-[#075e54]" />
        Notifications
      </button>
      <button
        onClick={() => runAction(() => onToggleBlock(slectedUser._id), slectedUser.isBlocked ? "Chat unblocked" : "Chat blocked")}
        className="w-full h-12 flex items-center gap-3 rounded-md px-3 text-sm hover:bg-emerald-50"
      >
        <Lock className="size-5 text-[#075e54]" />
        {slectedUser.isBlocked ? "Unblock chat" : "Block chat"}
      </button>
     </div>

     {isGroup && (
      <div className="px-5 py-3 border-t border-emerald-100">
        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Members</p>
        <div className="space-y-1">
          {slectedUser.members?.map((member) => (
            <div key={member._id} className="flex items-center gap-3 rounded-md px-3 py-2">
              <img src={member.image || assets.avatar_icon} alt="" className="h-8 w-8 rounded-full object-cover" />
              <span className="min-w-0 flex-1 truncate text-sm">{member.name}</span>
              {slectedUser.admins?.some((admin) => (admin._id || admin) === member._id) && (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] text-[#075e54]">Admin</span>
              )}
              {isAdmin && member._id !== user?._id && (
                <button
                  type="button"
                  title="Remove member"
                  onClick={() => runAction(() => onRemoveMember(slectedUser._id, member._id), "Member removed")}
                  className="h-8 w-8 rounded-full grid place-items-center text-red-500 hover:bg-red-50"
                >
                  <UserMinus className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
     )}

     <div className="px-5 py-4">
      {isAdmin && (
        <button
          onClick={() => {
            if (window.confirm("Delete this group for all members?")) {
              runAction(() => onDeleteGroup(slectedUser._id), "Group deleted")
            }
          }}
          className="mb-3 w-full bg-red-500 hover:bg-red-600 text-white border-none text-sm font-semibold py-3 px-6 rounded-full cursor-pointer flex items-center justify-center gap-2"
        >
          <Trash2 className="size-4" />
          Delete group
        </button>
      )}
      <button onClick={logout} className="w-full bg-[#00a884] hover:bg-[#008f72] text-white border-none text-sm font-semibold py-3 px-6 rounded-full cursor-pointer flex items-center justify-center gap-2">
        <LogOut className="size-4" />
        Logout
      </button>
     </div>
    </div>
  )
}

export default RightSidebar
