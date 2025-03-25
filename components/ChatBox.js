"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/solid";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { ArrowUpIcon, XMarkIcon, CloudArrowUpIcon } from "@heroicons/react/24/solid";
import { motion } from "motion/react"
import { ChevronDown, Check } from "lucide-react";

export default function ChatBox() {
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState([{ id: 1, messages: [] }]); // Store all conversations
  const [activeConversationId, setActiveConversationId] = useState(1); // Track active conversation
  const [syncedFiles, setSyncedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [conversationCounter, setConversationCounter] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(true); // Track theme
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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
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
  const models = [
    {
      name: "GPT-4",
      description: " High-performance AI for professional and research use.",
      abilities: ["📝", "💡", "🔍", "🤖"],
    },
    {
      name: "GPT-4o mini",
      description: " Fast, advanced AI with top-tier reasoning and multimodal support.",
      abilities: ["🌍", "📝", "🔍"],
    },
    {
      name: "GPT-3.5",
      description: "Cost-effective AI for general tasks.",
      abilities: ["📝", "🔍"],
    },
    {
      name: "DALL·E 3",
      description: "Creates high-quality images from text.",
      abilities: ["🖼️"],
    },
  ];
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [menuOpen, setMenuOpen] = useState(false);

  //for loading animation
    const [statusIndex, setStatusIndex] = useState(0);
    const statuses = [  
      "Optimizing response...",
      "Checking for accuracy...",
      "Enhancing output...",
      "Loading additional resources...",
      "Ensuring consistency...",
      "Refining details...",
      "Cross-verifying data..."
    ];
  
    useEffect(() => {
      setStatusIndex(0); // Always start from the first status
    
      const interval = setInterval(() => {
        setStatusIndex((prev) => (prev + 1) % statuses.length);
      }, 1500);
    
      return () => clearInterval(interval);
    }, []);
   

  return (
    <div className={`flex h-screen w-full ${isDarkMode ? 'bg-[#1b1829] text-white' : 'bg-white text-black'} overflow-hidden`}>
      {/* Sidebar */}
      <div className={`transition-all duration-300 ${isDarkMode ? 'bg-[#100f1d]' : 'bg-[#100f1d]'} px-4 ${sidebarOpen ? "w-80" : "w-20"} overflow-hidden`}>
        {/* Logo Section */}
        <div className="flex flex-col items-center mt-4">
          <img src="/smarttype.png" alt="Gasco Logo" className="width-{250} height-{70}" /> {/* Reduced space below logo */}
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
          <div className="mt-3 space-y-2"> {/* Reduced space */}
            <h2 className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'} text-sm`}>Recent Chats</h2>
            {conversations.length > 0 ? (
              conversations.map((conversation, index) => (
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
 

      {/* Chat Box */}
      <div className="flex flex-col flex-1 items-center">
        {/* Header */}
        <div className={`w-full py-4 flex justify-between items-center px-6 ${isDarkMode ? 'bg-[#100f1d] shadow-lg' : 'bg-gray-200'} `}>
          {/* Center Section (Rectangles) */}
          <div className="flex space-x-4 items-center">
          <div className={`${isDarkMode ? 'bg-[#23232b] text-white' : 'bg-gray-100 text-purple-950'} 
            px-4 py-2 rounded-lg text-sm cursor-pointer 
            hover:${isDarkMode ? 'bg-[#2e2e38]' : 'bg-gray-300'} 
            flex items-center justify-between gap-2`}>
              Controls <ChevronDown size={16} />
          </div>

            {/* <div className={`${isDarkMode ? 'bg-[#23232b] text-white' : 'bg-gray-100 text-purple-950'} px-4 py-2 rounded-lg text-sm cursor-pointer hover:${isDarkMode ? 'bg-[#2e2e38]' : 'bg-gray-300'}`}>
              GPT-4 ▼
            </div> */}
            <div  className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`${
                isDarkMode ? "bg-[#23232b] text-white" : "bg-gray-100 text-purple-950"
              } w-36 px-4 py-2 rounded-lg text-sm cursor-pointer text-center hover:${
                isDarkMode ? "bg-[#2e2e38]" : "bg-gray-300"
              } flex items-center justify-between relative`}
            >
              <span className="flex-1 text-center">{selectedModel.name}</span>
              <ChevronDown size={16} className="ml-2" />
            </button>

              {menuOpen && (
                <div
                className={`absolute top-full left-0 mt-1 w-64 rounded-lg shadow-lg p-2 z-10 ${
                  isDarkMode ? "bg-[#23232b] text-white" : "bg-gray-100 text-black"
                }`}
              >
                  {models.map((model) => (
                    <div
                      key={model.name}
                      onClick={() => {
                        setSelectedModel(model);
                        setMenuOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors 
                        ${isDarkMode ? "hover:bg-[#2e2e38]" : "hover:bg-gray-300"}`}
                      
                    >
                      <div>
                        <p className="text-sm font-semibold">{model.name}</p>
                        <p className="text-xs text-gray-400">{model.description}</p>
                        <div className="flex gap-1 text-xs mt-1">{model.abilities.map((icon) => icon)}</div>
                      </div>
                      {selectedModel.name === model.name && <Check size={16} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative group">
              <div
                className={`${
                  isDarkMode ? "bg-[#23232b] text-white" : "bg-gray-100 text-purple-950"
                } px-4 py-2 rounded-lg text-sm cursor-pointer hover:${
                  isDarkMode ? "bg-[#2e2e38]" : "bg-gray-300"
                }`}
              >
                RAG ⓘ
              </div>

              {/* Tooltip */}
              <div
                className={`absolute left-0 mt-1 w-64 p-2 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  isDarkMode ? "bg-[#23232b] text-white" : "bg-gray-100 text-black"
                }`}
              >
                <p className="text-sm font-semibold text-center">Retrieval-Augmented Generation:</p>
                <p className="text-xs text-gray-400 text-center">improves AI-generated responses by incorporating relevant information from external data sources, ensuring more accurate and contextually rich answers.</p>
              </div>
              
            </div>
          </div>

          {/* Right Side (Theme Toggle or Additional Controls) */}
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`${isDarkMode ? 'bg-[#23232b]' : 'bg-gray-300'} text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:${isDarkMode ? 'bg-[#2e2e38]' : 'bg-gray-400'}`}
            >
              {isDarkMode ? '🌙' : '☀️'}
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-4 space-y-4 w-full mx-4 custom-scrollbar h-screen scrollbar-right ${isDarkMode ? 'text-white' : 'text-black'}`}>
          {/* Show greeting message if conversation is empty */}
          {isActiveConversationEmpty ? (
            <div className="flex justify-center items-center h-[90%]">
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold">Hi, I am SmartTender.</p>
                <p className="text-xl text-gray-400">SmartTender is a solution that streamlines bidding, enhances accuracy, and maximizes efficiency for procurement teams.</p>
              </div>
            </div>
          ) : (
            conversations
              .find((conversation) => conversation.id === activeConversationId)
              .messages.map((msg, idx) => (
                <div key={idx} className="flex mx-20 mt-4">
                  {msg.role === "bot" && (
                    <div className="flex flex-col items-start pt-3">
                    {/* Bot Name and Avatar */}
                      <div className="flex items-center p-1 rounded-lg">
                        <div className="flex items-center mb-1 p-1 rounded-lg mx-2">
                          <img src="/SmartTender.png" alt="Bot_Avatar" className="w-9 h-9 rounded-full mr-2" />
                          <span className="text-lg font-bold">SmartTender</span>
                        </div>
                      </div>
                  
                      {/* Message or Loading Animation */}
                      <span className="p-1 rounded-lg w-full break-words inline-block ml-7 text-xl leading-relaxed">
                        {loading ? (
                          <div className="flex space-x-1">                     
                          </div>
                        ) : (
                          msg.content
                        )}
                      </span>
                  </div>
                  )}
                  {msg.role === "user" && (
                    <div className="flex flex-col items-start pt-3">
                      <div className="flex items-center p-1 rounded-lg ">
                        <div className="flex items-center mb-1 p-1 rounded-lg mx-2">
                          <img src="/gasco.jpeg" alt="Bot_Avatar" className="w-9 h-9 rounded-full mr-2" />
                          <span className="text-lg font-bold ">Faysal Naqvi</span>
                        </div>
                      </div>
                      <span className="p-1  rounded-lg w-full break-words inline-block ml-7 text-xl leading-relaxed">
                        {msg.content}
                      </span>
                    </div>
                  )}
                  
                </div>
                
              ))
          )}
                {loading && (
                    <span>
                    <div className="flex  mx-20 mt-4 flex-col items-start pt-3">
                    {/* Bot Name and Avatar */}
                      <div className="flex items-center p-1 rounded-lg">
                        <div className="flex items-center mb-1 p-1 rounded-lg mx-2">
                          <img src="/SmartTender.png" alt="Bot_Avatar" className="w-9 h-9 rounded-full mr-2" />
                          <span className="text-lg font-bold">SmartTender</span>
                        </div>
                      </div>
                  
                      {/* Message or Loading Animation */}
                      <span className="p-1 rounded-lg w-full break-words inline-block ml-7 text-xl leading-relaxed">
                        
                      <div className="flex items-center space-x-3">
                        {/* Spinning Circle */}
                        <motion.div
                          className="w-6 h-6 border-4 border-gray-300 border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        />
                       
                        {/* Status Text */}
                        <motion.p
                          key={statusIndex}
                          className="text-gray-500 text-sm font-medium"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.5 }}
                        >
                          {statuses[statusIndex]}
                        </motion.p>
                      </div>

                       
                      </span>
                  </div>
                  </span>
                  )}
          {/* {loading && (
         
            <div className="flex justify-center items-center space-x-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
            </div>
          
          )} */}
          <div ref={messagesEndRef} />
        </div>

        <div className={`flex items-center p-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} w-full max-w-4xl ml-4 pr-4`}>
          <label className={`cursor-pointer text-gray-400 ${isDarkMode ? 'hover:text-white' : 'hover:text-black'}`}>
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
            className={`flex-grow p-2 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} rounded-lg focus:outline-none mx-4`}
            placeholder="Type a message..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={sendMessage} className={`${isDarkMode ? 'bg-[#f1f144]' : 'bg-yellow-400'} text-white p-2 rounded-lg`}>
            <ArrowUpIcon className="h-6 w-6 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}