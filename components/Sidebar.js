"use client";
import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

export default function Sidebar({ 
  sidebarOpen, 
  isDarkMode, 
  addNewConversation, 
  conversations, 
  activeConversationId, 
  setActiveConversationId, 
  deleteConversation 
}) {
  return (
    <div className={`transition-all duration-300 ${isDarkMode ? 'bg-[#100f1d]' : 'bg-[#100f1d]'} px-4 ${sidebarOpen ? "w-80" : "w-20"} overflow-hidden`}>
      {/* Logo Section */}
      <div className="flex flex-col items-center mt-4">
        <img src="/smarttype.png" alt="Logo" className="w-40 h-auto" />
      </div>

      {/* New Chat Button */}
      {sidebarOpen && (
        <button
          onClick={addNewConversation}
          className={`w-full ${isDarkMode ? 'bg-[#2d3748] hover:bg-[#4a5568]' : 'bg-[#2d3748] hover:bg-[#4a5568]'} p-3 rounded-lg text-white font-semibold transition`}
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
                  {conversation.messages.length > 0 ? conversation.messages[0].content.slice(0, 25) + "..." : "New Chat"}
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

      {/* User Info */}
      {sidebarOpen && (
        <div className="absolute bottom-4 left-4 flex items-center space-x-3">
          <img src="/gasco.jpeg" alt="User" className="w-12 h-12 rounded-full" />
          <span className={`${isDarkMode ? 'text-white' : 'text-white'} text-lg`}>Faysal Naqvi</span>
        </div>
      )}
    </div>
  );
}
