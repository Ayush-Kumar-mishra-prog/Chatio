import { useEffect, useRef } from 'react'
import assets, { messagesDummyData } from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ArrowLeft, ImageIcon, Phone, Send, Video } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ChatContainer = ({slectedUser, setSlectedUser, showProfile, onShowProfile, onEditProfile}) => {
  const { user } = useAuth()
  const scrollEnd = useRef()
  useEffect(()=>{
   if(scrollEnd.current){
    scrollEnd.current.scrollIntoView({behavior: "smooth"})
   }
  },[slectedUser])
  return slectedUser ? (
    <div className={`h-full overflow-hidden relative bg-[#efeae2] ${showProfile ? "max-md:hidden" : ""}`}>
      <div className="h-16 flex items-center gap-2 px-3 md:px-4 border-b border-emerald-100 bg-[#f0f2f5]">
        <button
          type="button"
          title="Back"
          className="md:hidden h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-200"
          onClick={()=>setSlectedUser(null)}
        >
          <ArrowLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={onShowProfile}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <img src={slectedUser?.profilePic || assets.avatar_icon} alt="" className="h-10 w-10 rounded-full object-cover" />
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold text-slate-900">{slectedUser.fullName}</span>
            <span className="flex items-center gap-1 text-xs text-[#00a884]">
              <span className="h-2 w-2 rounded-full bg-[#00a884]"></span>
              Online
            </span>
          </span>
        </button>
        
        <button type="button" title="Voice call" className="h-10 w-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200">
          <Phone className="size-5" />
        </button>
        <button type="button" title="Video call" className="h-10 w-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200">
          <Video className="size-5" />
        </button>
        <button type="button" title="Edit profile" onClick={onEditProfile} className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 hover:ring-2 hover:ring-[#00a884]">
          <img src={user?.image || assets.avatar_icon} alt="" className="h-full w-full object-cover" />
        </button>
        {/* <button type="button" title="Contact info" onClick={onShowProfile} className="h-10 w-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200">
          <Info className="size-5" />
        </button>
        <button type="button" title="More" className="h-10 w-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200">
          <MoreVertical className="size-5" />
        </button> */}
      </div>

      <div className="flex flex-col h-[calc(100%-128px)] overflow-y-scroll p-3 md:p-5 pb-6 bg-[radial-gradient(circle_at_top_left,rgba(37,211,102,0.08),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.6),rgba(217,253,211,0.35))]">
        {messagesDummyData.map((msg,index)=>(
          <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== '680f50e4f10f3cd28382ecf9' && 'flex-row-reverse'}`}>
            {msg.image ? (
              <img src={msg.image} alt="" className="max-w-57.5 border border-white rounded-lg overflow-hidden mb-8 shadow" />
            ):(
              <p className={`px-3 py-2 max-w-64 md:max-w-80 text-sm rounded-lg mb-2 break-words shadow-sm ${msg.senderId !== '680f50e4f10f3cd28382ecf9' ? 'rounded-br-none bg-[#d9fdd3] text-slate-900':'rounded-bl-none bg-white text-slate-900'}`}>{msg.text}</p>
            )}
            <div className="text-center text-xs">
        <img src={msg.senderId !== '680f50e4f10f3cd28382ecf9' ? assets.avatar_icon : slectedUser?.profilePic || assets.avatar_icon} alt="" className="w-7 h-7 object-cover rounded-full" />
        <p className="text-slate-500">{ formatMessageTime(msg.createdAt) }</p>
        </div>
          </div>
        ))}
        <div ref={scrollEnd} className=""></div>

        
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-[#f0f2f5]">
        <div className="flex-1 flex items-center bg-white shadow-sm px-3 rounded-full">
          <input type="text" className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-slate-800 placeholder:text-slate-500 bg-transparent" placeholder='Send a message' />
          <input type="file" id='image' accept='image/*' hidden className="" />
          <label htmlFor="image" className="">
            <ImageIcon className='w-6 mr-2 cursor-pointer text-slate-500' />
          </label>
        </div>
        <button type="button" title="Send" className="h-11 w-11 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-md">
          <Send className="size-5" />
        </button>
      </div>

    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-3 bg-[#f7fbf9] max-md:hidden border-b-4 border-[#25d366]">
      <img src={assets.main_logo_} alt="" className="h-24 w-24 object-cover rounded-full shadow-lg shadow-emerald-950/10" />
      <p className="text-lg font-semibold text-[#075e54]">Chat anytime, anywhere</p>
      <p className="text-sm text-slate-500">Select a conversation to start messaging.</p>
    </div>
  )
}

export default ChatContainer
