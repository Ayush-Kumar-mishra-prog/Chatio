import { useState } from 'react'
import SideBar from '../components/SideBar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'

const ChatPage = () => {
    const [slectedUser,setSlectedUser] = useState(false)
    const [showProfile, setShowProfile] = useState(false)

    const handleSelectUser = (user) => {
      setSlectedUser(user)
      setShowProfile(false)
    }

    const handleBackToChats = () => {
      setSlectedUser(null)
      setShowProfile(false)
    }
  return (
    <div className="w-full h-screen bg-[#e8f3ef]/80">
    <div className={`h-full grid grid-cols-1 overflow-hidden bg-[#f7fbf9]/90 shadow-2xl shadow-emerald-950/10 relative
    ${slectedUser ? 'md:grid-cols-[360px_minmax(0,1fr)_320px] xl:grid-cols-[400px_minmax(0,1fr)_360px]':'md:grid-cols-[380px_minmax(0,1fr)]'}`}>
        <SideBar slectedUser={slectedUser} setSlectedUser={handleSelectUser} />
        <ChatContainer
          slectedUser={slectedUser}
          setSlectedUser={handleBackToChats}
          showProfile={showProfile}
          onShowProfile={() => setShowProfile(true)}
        />
        <RightSidebar
          slectedUser={slectedUser}
          showProfile={showProfile}
          onBackToChat={() => setShowProfile(false)}
        />
    </div>
    </div>
  )
}

export default ChatPage
