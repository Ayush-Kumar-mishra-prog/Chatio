import { useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ArrowLeft, ImageIcon, Phone, Send, Video, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getChatMessages, sendChatMessage } from '../api/api'
import { toast } from 'react-toastify'

const MAX_IMAGES = 4
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const ChatContainer = ({slectedUser, setSlectedUser, showProfile, onShowProfile, onEditProfile, onConversationUpdated, onStartCall}) => {
  const { user, socket, onlineUsers } = useAuth()
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [selectedImages, setSelectedImages] = useState([])
  const scrollEnd = useRef()
  const fileInputRef = useRef(null)
  const isBlocked = Boolean(slectedUser?.isBlocked || slectedUser?.blockedBy?.length)
  const isOnline = slectedUser?.type === "group" || slectedUser?.members?.some((member) => member._id !== user?._id && onlineUsers.includes(member._id))

  useEffect(()=>{
   if(scrollEnd.current){
    scrollEnd.current.scrollIntoView({behavior: "smooth"})
   }
  },[messages])

  useEffect(() => {
    if (!slectedUser?._id) return
    const loadMessages = async () => {
      try {
        const { data } = await getChatMessages(slectedUser._id)
        setMessages(data.messages || [])
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load messages")
      }
    }
    loadMessages()
  }, [slectedUser?._id])

  useEffect(() => {
    if (!socket || !slectedUser?._id) return undefined
    const handleNewMessage = (message) => {
      if (message.conversationId !== slectedUser._id) return
      setMessages((current) => [...current, message])
      onConversationUpdated?.({
        ...slectedUser,
        lastMessage: message,
        updatedAt: message.createdAt,
      })
    }
    const handleMessagesSeen = ({ conversationId, messageIds = [] }) => {
      if (conversationId !== slectedUser._id) return
      setMessages((current) =>
        current.map((message) =>
          messageIds.includes(message._id) ? { ...message, seen: true } : message,
        ),
      )
    }
    socket.on("newMessage", handleNewMessage)
    socket.on("messagesSeen", handleMessagesSeen)
    return () => {
      socket.off("newMessage", handleNewMessage)
      socket.off("messagesSeen", handleMessagesSeen)
    }
  }, [socket, slectedUser, onConversationUpdated])

  const sendMessage = async (payload) => {
    if (!slectedUser?._id || isBlocked) return
    try {
      setIsSending(true)
      const { data } = await sendChatMessage(slectedUser._id, payload)
      const nextMessage = data.newMessage
      setMessages((current) => [...current, nextMessage])
      onConversationUpdated?.({
        ...slectedUser,
        lastMessage: nextMessage,
        updatedAt: nextMessage.createdAt,
      })
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const text = messageText.trim()
    if (!text) return
    setMessageText("")
    sendMessage({ text })
  }

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    if (files.length + selectedImages.length > MAX_IMAGES) {
      toast.error("You can send up to 4 images at once")
      event.target.value = ""
      return
    }
    const invalidFile = files.find((file) => file.size > MAX_IMAGE_SIZE)
    if (invalidFile) {
      toast.error("Each image must be 5 MB or less")
      event.target.value = ""
      return
    }
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.readAsDataURL(file)
          }),
      ),
    ).then((images) => setSelectedImages((current) => [...current, ...images]))
    event.target.value = ""
  }

  const handleSendImage = () => {
    const text = messageText.trim()
    if (!selectedImages.length && !text) return
    sendMessage({ images: selectedImages, text })
    setSelectedImages([])
    setMessageText("")
  }

  const handleRemoveImage = (index) => {
    setSelectedImages((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

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
              <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-[#00a884]" : "bg-slate-400"}`}></span>
              {slectedUser.type === "group" ? `${slectedUser.members?.length || 0} members` : isOnline ? "Online" : "Offline"}
            </span>
          </span>
        </button>
        
        <button type="button" title="Voice call" onClick={() => onStartCall?.(slectedUser, "voice")} className="h-10 w-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200">
          <Phone className="size-5" />
        </button>
        <button type="button" title="Video call" onClick={() => onStartCall?.(slectedUser, "video")} className="h-10 w-10 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200">
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
        {messages.map((msg)=> {
          const isMine = msg.senderId === user?._id
          return (
          <div key={msg._id} className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
            <div className="text-center text-xs">
              <img src={isMine ? user?.image || assets.avatar_icon : slectedUser?.profilePic || assets.avatar_icon} alt="" className="w-7 h-7 object-cover rounded-full" />
              <p className="text-slate-500">{ formatMessageTime(msg.createdAt) }</p>
            </div>
            <div className={`max-w-72 md:max-w-96 rounded-lg mb-2 break-words shadow-sm overflow-hidden ${isMine ? 'rounded-br-none bg-[#d9fdd3] text-slate-900':'rounded-bl-none bg-white text-slate-900'}`}>
              {!!(msg.images?.length || msg.image) && (
                <div className={`grid gap-1 p-1 ${(msg.images?.length || 1) > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {(msg.images?.length ? msg.images : [msg.image]).map((url, index) => (
                    <img key={`${msg._id}-${index}`} src={url} alt="" className="h-40 w-full object-cover rounded-md border border-white" />
                  ))}
                </div>
              )}
              {msg.text && <p className="px-3 py-2 text-sm">{msg.text}</p>}
              {isMine && (
                <span className={`flex justify-end px-2 pb-1 text-[11px] ${msg.seen ? "text-[#34b7f1]" : "text-slate-500"}`}>
                  {msg.seen ? "Seen" : "Sent"}
                </span>
              )}
            </div>
          </div>
        )})}
        {!messages.length && (
          <div className="m-auto rounded-full bg-white/80 px-4 py-2 text-sm text-slate-500 shadow-sm">
            Say hello to start this chat.
          </div>
        )}
        <div ref={scrollEnd} className=""></div>

        
      </div>

      <form onSubmit={handleSubmit} className="absolute bottom-0 left-0 right-0 bg-[#f0f2f5]">
        {!!selectedImages.length && (
          <div className="px-3 pt-3 pb-2 bg-white border-t border-emerald-100">
            <div className="flex gap-2 overflow-x-auto">
            {selectedImages.map((image, index) => (
            <div key={image.slice(0, 40)} className="relative shrink-0">
              <img src={image} alt="Preview" className="h-24 w-24 object-cover rounded-lg border-2 border-emerald-200" />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
              >
                <X className="size-4" />
              </button>
            </div>
            ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 p-3">
          <div className="flex-1 flex items-center bg-white shadow-sm px-3 rounded-full">
            <input
              type="text"
              value={messageText}
              disabled={isBlocked}
              onChange={(event) => setMessageText(event.target.value)}
              className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-slate-800 placeholder:text-slate-500 bg-transparent disabled:cursor-not-allowed"
              placeholder={isBlocked ? "This chat is blocked" : "Send a message"}
            />
            <input ref={fileInputRef} type="file" id='image' accept='image/*' multiple hidden className="" onChange={handleImageChange} />
            <label htmlFor="image" className={isBlocked ? "pointer-events-none opacity-40" : "cursor-pointer"}>
              <ImageIcon className='w-6 mr-2 text-slate-500' />
            </label>
          </div>
          <button 
            type={selectedImages.length ? "button" : "submit"} 
            onClick={selectedImages.length ? handleSendImage : undefined}
            title="Send" 
            disabled={isSending || isBlocked} 
            className="h-11 w-11 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-md disabled:opacity-60"
          >
            <Send className="size-5" />
          </button>
        </div>
      </form>

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
