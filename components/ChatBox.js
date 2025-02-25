"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { PaperAirplaneIcon,PaperClipIcon } from "@heroicons/react/24/solid";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { ArrowUpIcon, XMarkIcon, CloudArrowUpIcon } from "@heroicons/react/24/solid";


export default function ChatBox() {
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState([{ id: 1, messages: [] }]); // Store all conversations
  const [activeConversationId, setActiveConversationId] = useState(1); // Track active conversation
  const [syncedFiles, setSyncedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);  
  const [conversationCounter, setConversationCounter] = useState(1);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/fetch-drive-files/`);
        if (response.data.processed_files) {
          setSyncedFiles(response.data.processed_files);
        }
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };
    fetchFiles();
  }, []);
  

  const sendMessage = async () => {
    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    const newConversations = [...conversations];
    const activeConversation = newConversations.find(c => c.id === activeConversationId);
    activeConversation.messages.push(userMessage);
    setConversations(newConversations);

    setLoading(true);
    setQuery("");
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/query/`,
        JSON.stringify({ query }),
        { headers: { "Content-Type": "application/json" } }
      );

      const botResponse = response.data.response || response.data;

      const botMessage = {
        role: "bot",
        content: typeof botResponse === "string" ? botResponse : JSON.stringify(botResponse),
      };

      activeConversation.messages.push(botMessage);
      setConversations(newConversations);
    } catch (error) {
      console.error("Error fetching response:", error);
    }
    
    setLoading(false);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles([...uploadedFiles, ...files]);
    console.log("Files uploaded:", files);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const addNewConversation = () => {
    const newId = conversationCounter + 1;
    const newConversation = { id: newId, messages: [] };
    setConversations([newConversation, ...conversations]);
    setActiveConversationId(newId);
    setConversationCounter(newId);
  };

  const deleteConversation = (id) => {
    const newConversations = conversations.filter((conversation) => conversation.id !== id);
    setConversations(newConversations);

    // If the deleted conversation was active, set the active conversation to the first one
    if (id === activeConversationId) {
      setActiveConversationId(newConversations[0]?.id || null);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [conversations, activeConversationId]);
  

  const getChatName = (index) => {
    const reversedIndex = conversations.length - 1 - index; // Reverse the index to match the new order
    const names = ["First Chat", "Second Chat", "Third Chat", "Fourth Chat", "Fifth Chat"];
    return names[reversedIndex] || `${reversedIndex + 1}th Chat`;
  };

  // Check if the current active conversation is empty
  const isActiveConversationEmpty = conversations.find((conversation) => conversation.id === activeConversationId)?.messages.length === 0;

  return (
    <div className="flex w-screen h-screen bg-gray-900 text-white">
      
      {/* Sidebar */}
      <div className={`transition-all duration-300 bg-gray-800 p-4 ${sidebarOpen ? "w-64" : "w-16"}`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mb-4 focus:outline-none">
          {sidebarOpen ? <ChevronLeftIcon className="h-6 w-6 text-white" /> : <ChevronRightIcon className="h-6 w-6 text-white" />}
        </button>

        {/* Add New Chat Button */}
        {sidebarOpen && (
          <button
            onClick={addNewConversation}
            className="mt-auto bg-transparent text-white border border-gray-700 p-3 rounded-lg w-full hover:bg-gray-700 transition-colors"
          >
            New Chat
          </button>
        )}

        {sidebarOpen && (
          <ul className="mt-4">
            {conversations.map((conversation, index) => (
              <li
                key={conversation.id}
                className={`cursor-pointer text-gray-300 text-sm mb-2 flex justify-between items-center ${
                  conversation.id === activeConversationId ? "bg-gray-700 text-white" : "hover:bg-gray-600"
                } p-3 rounded-md`}
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <span>{getChatName(index)}</span> 
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className="text-gray-400 hover:text-white focus:outline-none"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Chat Box */}
      <div className="flex flex-col flex-1 items-center">
           {/* Header */}
        <div className="w-full bg-gray-900 py-4">
          <h1 className="text-center text-2xl text-white">TenderAi</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full max-w-3xl custom-scrollbar">
          {/* Show greeting message if conversation is empty */}
          {isActiveConversationEmpty ? (
            <div className="flex justify-center items-center h-[90%]">
              <div className="text-center text-lg text-gray-400">
                <p>Hi, I am ChatPDF.</p>
                <p className="text-gray-300">How may I assist you today?</p>
              </div>
            </div>
          ) : (
            conversations
              .find((conversation) => conversation.id === activeConversationId)
              .messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "bot" && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center bg-gray-700 p-1 rounded-lg ">
                      <div className="flex items-center mb-1 bg-gray-700 p-1 rounded-lg mx-2">
                        
                          <img src="/bot.jpg" alt="Bot Avatar" className="w-6 h-6 rounded-full mr-2" />
                          <span className="text-sm text-gray-300 ">ChatPDF</span>
                          
                      </div>
                      </div>
                      <span className="p-3 rounded-lg max-w-xl break-words inline-block text-white">
                        {msg.content}
                      </span>
                    </div>
                  )}
                  {msg.role === "user" && (
                    <div className="flex flex-col items-end">
                      <div className="bg-gray-700 p-1 rounded-lg">
                        <span className="text-sm text-gray-300 mb-1 mx-2">You</span>
                      </div>

                      <span className="p-3 rounded-lg max-w-xl break-words inline-block text-white">
                        {msg.content}
                      </span>
                    </div>
                  )}
                </div>
              ))
          )}
          {loading && <div className="text-gray-400 text-sm text-center">Bot is typing...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex items-center p-2 border-t border-gray-700 w-full max-w-2xl justify-center">
          <label className="cursor-pointer text-gray-400 hover:text-white">
            <PaperClipIcon className="h-6 w-6 mx-2" />
            <input
              type="file"
              accept=".pdf,.docx,.xlsx,.csv"
              className="hidden"
              multiple
              onChange={handleFileUpload}
            />
          </label>
          <input
            type="text"
            className="flex-grow p-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none mx-4"
            placeholder="Type a message..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={sendMessage} className="bg-blue-500 text-white p-2 rounded-lg">
            <ArrowUpIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
