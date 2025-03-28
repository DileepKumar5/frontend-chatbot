"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/solid";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { ArrowUpIcon, XMarkIcon, CloudArrowUpIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import Sidebar from "./Sidebar"; // Import Sidebar component
import HeaderControls from "./HeaderControls";


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
  const [loadingMessage, setLoadingMessage] = useState(null);  // Add this line to define loadingMessage state


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

  const cleanBotResponse = (content) => {
    // Detect markdown-style tables in the content
    const tablePattern = /\|([^\|]+(?:\|[^\|]+)+)\|/g;  // Match Markdown tables
    const markdownTableMatch = content.match(tablePattern);

    if (markdownTableMatch) {
      markdownTableMatch.forEach((table) => {
        const htmlTable = convertMarkdownToHtmlTable(table);  // Convert Markdown table to HTML
        content = content.replace(table, htmlTable); // Replace markdown table with HTML table
      });
    }

    // Clean up any markdown like bold, italics, and headers
    content = content
      .replace(/(\*\*|__)(.*?)\1/g, '$2')  // Remove bold (**text**)
      .replace(/(\*|_)(.*?)\1/g, '$2')    // Remove italics (*text* or _text_)
      .replace(/(#{3,6})\s*(.*)/g, '$2')   // Remove headers (### text, #### text, ###### text)
      .replace(/~~(.*?)~~/g, '$1');        // Remove strikethrough (~~text~~)
      // content = content
      // .replace(/(\d+[\.)]\s+)/g, '<br />$1') // Add <br /> before numbers followed by a period or parenthesis (e.g., 1. or 2))

    return content;
  };



  // Function to convert markdown-style tables to HTML
  const convertMarkdownToHtmlTable = (markdown) => {
    const lines = markdown.trim().split("\n");

    // Extract the header row
    const headers = lines[0].split("|").map((header) => header.trim()).filter(Boolean);

    // Remove separator line (the line with dashes used to separate headers)
    const separator = lines[1].split("|").map((sep) => sep.trim()).filter(Boolean);
    if (separator.every((col) => col === "" || col === "-")) {
      lines.splice(1, 1); // Remove the separator line if it is just dashes
    }

    // Extract rows (lines after the header)
    const rows = lines.slice(1).map((line) => {
      const columns = line.split("|").map((col) => col.trim()).filter(Boolean);
      return columns;
    });

    // Construct the HTML table
    let tableHtml = `<table class="table-auto border-collapse border border-gray-300 w-full">`;

    // Add table headers
    tableHtml += "<thead><tr>";
    headers.forEach((header) => {
      tableHtml += `<th class="border border-gray-300 p-2 text-left">${header}</th>`;
    });
    tableHtml += "</tr></thead>";

    // Add table body (rows)
    tableHtml += "<tbody>";
    rows.forEach((row) => {
      tableHtml += "<tr>";
      row.forEach((cell) => {
        tableHtml += `<td class="border border-gray-300 p-2">${cell}</td>`;
      });
      tableHtml += "</tr>";
    });
    tableHtml += "</tbody>";

    tableHtml += "</table>";

    return tableHtml;
  };




  const sendMessage = async () => {
    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    const newConversations = [...conversations];
    const activeConversation = newConversations.find(c => c.id === activeConversationId);

    // Add the user's message to the conversation
    activeConversation.messages.push(userMessage);
    setConversations(newConversations);  // Update the conversations state

    setLoading(true);  // Start loading state
    setQuery("");  // Clear the input field

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

      // Add the bot's response to the conversation
      activeConversation.messages.push(botMessage);
      setConversations(newConversations);  // Update the conversations state
    } catch (error) {
      console.error("Error fetching response:", error);
    }

    setLoading(false);  // End loading state
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeConversationId]);  // Add activeConversationId to ensure scrolling works when switching conversations




  // Check if the current active conversation is empty
  const isActiveConversationEmpty = conversations.find((conversation) => conversation.id === activeConversationId)?.messages.length === 0;

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
      <Sidebar
        sidebarOpen={sidebarOpen}
        isDarkMode={isDarkMode}
        addNewConversation={addNewConversation}
        conversations={conversations}
        activeConversationId={activeConversationId}
        setActiveConversationId={setActiveConversationId}
        deleteConversation={deleteConversation}
      />
      {/* Chat Box */}
      <div className="flex flex-col flex-1 items-center">
        {/* Header */}
        <HeaderControls isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

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
                      <span
                        className="p-1 rounded-lg w-full break-words inline-block ml-7 text-xl leading-tight whitespace-pre-line"
                        dangerouslySetInnerHTML={{ __html: cleanBotResponse(msg.content) }}
                      ></span>



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
                      <span className="p-1  rounded-lg w-full break-words inline-block ml-7 text-xl leading-relaxed whitespace-pre-wrap">
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