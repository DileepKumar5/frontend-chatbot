"use client";
import { useState, useRef, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Sidebar({ 
  sidebarOpen, 
  isDarkMode, 
  addNewConversation, 
  conversations, 
  activeConversationId, 
  setActiveConversationId, 
  deleteConversation 
}) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const logoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target)) {
        setShowLogout(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleLogout = () => {
    setShowLogout(!showLogout);
  };

  return (
    <div
      className={`transition-all duration-300 ${isDarkMode ? 'bg-[#100f1d]' : 'bg-[#100f1d]'} px-4 ${sidebarOpen ? "w-80" : "w-20"} flex flex-col h-screen`}
      style={{ borderRight: '0.1px solid #37dfb1' }}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-center mt-4 mb-2">
        <video
          src="/sidebarlogo.mp4"
          alt="Welcome Bot"
          width={192}
          height={48}
          className="mt-0"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>

      {sidebarOpen && (
        <>
          {/* New Chat Button */}
          <button
            onClick={addNewConversation}
            className={`w-full ${isDarkMode ? 'bg-[#1a3937] hover:bg-[#1a3937]' : 'bg-[#0f2722] hover:bg-[#1a3937]'} p-3 rounded-lg text-white font-semibold transition mt-6 border border-[#37dfb1]`}
          >
            + New Chat
          </button>

          {/* Chat List - Scrollable Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar mt-6">
            <h2 className="text-white text-center font-bold text-sm">Recent Chats</h2>
            <div className="space-y-2 mt-4">
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`cursor-pointer ${isDarkMode ? 'bg-[#0f2722]' : 'bg-[#0f2722]'} p-2 rounded-lg flex justify-between items-center border border-[#37dfb1] ${conversation.id === activeConversationId ? `${isDarkMode ? 'border border-[#1a3937]' : 'border border-[#1a3937]'}` : `hover:${isDarkMode ? 'bg-[#1a3937]' : 'bg-[#1a3937]'}`}`}
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <span className={`${isDarkMode ? 'text-white' : 'text-white'} truncate w-3/4`}>
                      {conversation.messages.length > 0
                        ? conversation.messages[0].content.slice(0, 25) + "..."
                        : "New Chat"}
                    </span>
                    <button
                      className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-white'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-sm`}>No chats yet</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* User Profile Section - Fixed at bottom */}
      {sidebarOpen && user && (
        <div className="mt-4 relative" ref={logoutRef}>
          <div 
            className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            onClick={toggleLogout}
          >
            <img 
              src={user.imageUrl} 
              alt="User Profile" 
              className="w-12 h-12 rounded-full border-2"
              style={{ borderColor: '#00bf63' }}
            />
            <span className={`${isDarkMode ? 'text-white' : 'text-white'} text-lg truncate`}>
              {user.fullName || user.username || "User"}
            </span>
          </div>
          {showLogout && (
            <button
              onClick={handleLogout}
              className="absolute bottom-full left-0 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-center mb-1"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </div>
  );
}