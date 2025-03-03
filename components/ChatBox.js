"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/solid";
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
    <div className="flex h-screen w-full bg-[#1b1829] text-white overflow-hidden">





      {/* Sidebar */}
      {/* Sidebar */}
      <div className={`transition-all duration-300 bg-[#100f1d] px-4  ${sidebarOpen ? "w-80" : "w-20"} overflow-hidden`}>


        {/* Logo Section */}
        <div className="flex flex-col items-center mt-4">
          <img src="/smarttype.png" alt="Gasco Logo" className="width-{250} height-{70}" /> {/* Reduced space below logo */}

        </div>

        {/* New Chat Button */}
        {sidebarOpen && (
          <button
            onClick={addNewConversation}
            className="w-full  bg-[#977dff] p-3 rounded-lg text-white font-semibold hover:bg-[#8666ff] transition"
          >
            + New Chat
          </button>
        )}

        {/* Dynamic Chat List */}
        {sidebarOpen && (
          <div className="mt-3 space-y-2"> {/* Reduced space */}
            <h2 className="text-gray-400 text-sm">Recent Chats</h2>
            {conversations.length > 0 ? (
              conversations.map((conversation, index) => (
                <div
                  key={conversation.id}
                  className={`cursor-pointer bg-[#23232b] p-2 rounded-lg flex justify-between items-center ${conversation.id === activeConversationId ? "border border-[#977dff]" : "hover:bg-[#2e2e38]"
                    }`}
                  onClick={() => setActiveConversationId(conversation.id)}
                >
                  <span className="text-white truncate w-3/4">
                    {conversation.messages.length > 0 ? conversation.messages[0].content.slice(0, 25) + "..." : "New Chat"}
                  </span>
                  <button
                    className="text-gray-400 hover:text-white"
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
              <div className="text-gray-500 text-sm">No chats yet</div>
            )}
          </div>
        )}

        {/* User Info */}
        {sidebarOpen && (
          <div className="absolute bottom-4 left-4 flex items-center space-x-3">
            <img src="/abis.jpeg" alt="User" className="w-12 h-12 rounded-full" />
            <span className="text-white text-lg">Abis Hussain Syed</span>
          </div>
        )}
      </div>





      {/* Chat Box */}
      <div className="flex flex-col flex-1 items-center">
        {/* Header */}
        {/* Header */}
        {/* Header */}
        <div className="w-full py-4 flex justify-between items-center px-6 bg-[#100f1d] shadow-lg">

          {/* Left Side (Logo) */}


          {/* Center Section (Rectangles) */}
          <div className="flex space-x-4 items-center">
            <div className="bg-[#23232b] text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-[#2e2e38]">
              Controls ▼
            </div>
            <div className="bg-[#23232b] text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-[#2e2e38]">
              GPT-4 ▼
            </div>
            <div className="bg-[#23232b] text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-[#2e2e38]">
              RAG ⓘ
            </div>
          </div>

          {/* Fetch Files Button - Centered Between Rectangles and Theme Toggle */}
          <div className="flex-grow flex justify-center">
            <button
              onClick={fetchFiles}
              className="bg-[#23232b] text-white px-4 py-2 rounded-lg text-xl cursor-pointer hover:bg-[#2e2e38]"
            >
              Fetch Files from Drive
            </button>
          </div>

          {/* Right Side (Theme Toggle or Additional Controls) */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button className="bg-[#23232b] text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-[#2e2e38]">
              🌙
            </button>
          </div>

        </div>


        <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full  mx-4 custom-scrollbar h-screen scrollbar-right">




          {/* Show greeting message if conversation is empty */}
          {isActiveConversationEmpty ? (
            <div className="flex justify-center items-center h-[90%]">
              <div className="text-center space-y-2">
                <p className="text-2xl text-white font-bold">Hi, I am SmartTender.</p>
                <p className="text-xl text-gray-gray">SmartTender is a solution that streamlines bidding, enhances accuracy, and maximizes efficiency for procurement teams.</p>
              </div>
            </div>
          ) : (
            conversations
              .find((conversation) => conversation.id === activeConversationId)
              .messages.map((msg, idx) => (
                <div key={idx} className="flex mx-64 mt-16">


                  {msg.role === "bot" && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center p-1 rounded-lg ">
                        <div className="flex items-center mb-1 p-1 rounded-lg mx-2">

                          <img src="/SmartTender.png" alt="Bot_Avatar" className="w-9 h-9 rounded-full mr-2" />
                          <span className="text-lg text-white font-bold ">SmartTender</span>

                        </div>
                      </div>
                      <span className="p-4 rounded-lg w-full break-words inline-block text-white ml-4 text-xl leading-relaxed">
                        {msg.content}
                      </span>
                    </div>
                  )}
                  {msg.role === "user" && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center p-1 rounded-lg ">
                        <div className="flex items-center mb-1  p-1 rounded-lg mx-2">

                          <img src="/abis.jpeg" alt="Bot_Avatar" className="w-9 h-9 rounded-full mr-2" />
                          <span className="text-lg text-white font-bold ">Abis Hussain</span>

                        </div>
                      </div>
                      <span className="p-4 rounded-lg w-full break-words inline-block text-white ml-4 text-xl leading-relaxed">
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

        <div className="flex items-center p-2 border-t border-gray-700 w-full max-w-4xl ml-4 pr-4">


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
          <button onClick={sendMessage} className="bg-[#f1f144] text-white p-2 rounded-lg">
            <ArrowUpIcon className="h-6 w-6 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
