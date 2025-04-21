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
    <div className={`transition-all duration-300 ${isDarkMode ? 'bg-[#100f1d]' : 'bg-[#100f1d]'} px-4 ${sidebarOpen ? "w-80" : "w-20"} overflow-hidden relative h-screen`}>
      
      {/* Logo Section */}
      <div className="flex flex-col items-center mt-4">
        <img src="/smarttype.png" alt="Logo" className="w-40 h-auto" />
      </div>

      {/* New Chat Button */}
      {sidebarOpen && (
        <button
          onClick={addNewConversation}
          className={`w-full ${isDarkMode ? 'bg-[#2d3748] hover:bg-[#4a5568]' : 'bg-[#2d3748] hover:bg-[#4a5568]'} p-3 rounded-lg text-white font-semibold transition mt-6`}
        >
          + New Chat
        </button>
      )}

      {/* Dynamic Chat List */}
      {sidebarOpen && (
        <div className="mt-3 space-y-2">
          <h2 className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'} text-sm`}>Recent Chats</h2>
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`cursor-pointer ${isDarkMode ? 'bg-[#23232b]' : 'bg-[#23232b]'} p-2 rounded-lg flex justify-between items-center ${conversation.id === activeConversationId ? `${isDarkMode ? 'border-[#977dff]' : ''}` : `hover:${isDarkMode ? 'bg-[#2e2e38]' : 'bg-gray-300'}`}`}
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
      )}

      {/* User Info & Logout */}
      {sidebarOpen && user && (
        <div className="absolute bottom-4 left-4 w-[calc(100%-2rem)]" ref={logoutRef}>
          <div 
            className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            onClick={toggleLogout}
          >
            <img 
              src={user.imageUrl} 
              alt="User Profile" 
              className="w-12 h-12 rounded-full" 
            />
            <span className={`${isDarkMode ? 'text-white' : 'text-white'} text-lg truncate`}>
              {user.fullName || user.username || "User"}
            </span>
          </div>
          {showLogout && (
            <button
              onClick={handleLogout}
              className="absolute bottom-full left-0 mb-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-center"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </div>
  );
}