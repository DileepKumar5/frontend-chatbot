"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/solid";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { ArrowUpIcon, XMarkIcon, CloudArrowUpIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import Sidebar from "./Sidebar"; // Import Sidebar component
import HeaderControls from "./HeaderControls";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// Use the environment variable for API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ChatBox() {
  const [query, setQuery] = useState("");
  const [conversations, setConversations] = useState([]); // Initialize with empty array
  const [activeConversationId, setActiveConversationId] = useState(null); // Initialize with null
  const [syncedFiles, setSyncedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [conversationCounter, setConversationCounter] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(true); // Track theme
  const messagesEndRef = useRef(null);
  const [loadingMessage, setLoadingMessage] = useState(null);  // Add this line to define loadingMessage state
  const [mounted, setMounted] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser(); // Get user info from Clerk
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);


  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API_URL}/fetch-drive-files/`);
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

    // Skip separator line if it exists (the line with dashes)
    let dataRows = lines.slice(1);
    if (dataRows[0] && dataRows[0].includes("-")) {
      dataRows = dataRows.slice(1);
    }

    // Extract rows
    const rows = dataRows.map((line) => {
      const columns = line.split("|").map((col) => col.trim()).filter(Boolean);
      return columns;
    });

    // Construct the HTML table with improved styling and theme-aware colors
    let tableHtml = `<table class="table-auto border-collapse border border-gray-300 w-full mb-4 text-sm">`;

    // Add table headers with theme-aware styling
    tableHtml += "<thead><tr>";
    headers.forEach((header) => {
      tableHtml += `<th class="border border-gray-300 p-3 text-left ${isDarkMode ? 'bg-[#1e293b] text-white' : 'bg-gray-100 text-gray-800'} font-semibold">${header}</th>`;
    });
    tableHtml += "</tr></thead>";

    // Add table body (rows) with improved styling
    tableHtml += "<tbody>";
    rows.forEach((row, rowIndex) => {
      tableHtml += `<tr class="${rowIndex % 2 === 0 ? 'bg-opacity-50 bg-gray-50' : ''}">`;
      row.forEach((cell) => {
        // Check if cell contains a number with currency or percentage
        const isCurrency = /^[£$€¥₹]?\d+([.,]\d+)?$/.test(cell.trim());
        const isPercentage = /^\d+([.,]\d+)?%$/.test(cell.trim());

        tableHtml += `<td class="border border-gray-300 p-3 ${isCurrency || isPercentage ? 'text-right' : 'text-left'}">${cell}</td>`;
      });
      tableHtml += "</tr>";
    });
    tableHtml += "</tbody>";

    tableHtml += "</table>";

    return tableHtml;
  };

  // Optimize conversation loading
  const loadConversationsFromBackend = async () => {
    if (!user?.id) return;
    try {
      setIsLoadingHistory(true);
      const response = await axios.get(`${API_URL}/api/conversations/${user.id}`);

      // Create new conversation first
      const newConversation = {
        id: Date.now(),
        messages: [],
        title: "New Conversation",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (response.data && response.data.length > 0) {
        // Sort conversations by date and limit to most recent ones
        const sortedConversations = response.data
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 15); // Only load last 15 conversations

        // Remove any old 'Error:' bot messages to avoid showing stale errors after refreshing
        const cleanedConversations = sortedConversations.map(conv => ({
          ...conv,
          messages: conv.messages.filter(msg => !(msg.role === 'bot' && msg.content.startsWith('Error:')))
        }));
        setConversations([newConversation, ...cleanedConversations]);
      } else {
        setConversations([newConversation]);
      }
      setActiveConversationId(newConversation.id);
    } catch (error) {
      console.error("Error loading conversations:", error);
      const newConversation = {
        id: Date.now(),
        messages: [],
        title: "New Conversation",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setConversations([newConversation]);
      setActiveConversationId(newConversation.id);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load conversations when component mounts and user is authenticated
  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      loadConversationsFromBackend();
    }
  }, [isLoaded, isSignedIn, user?.id]);

  // Ensure activeConversationId is set after conversations are loaded
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id); // Set the first conversation as active if none is set
    }
  }, [conversations, activeConversationId]);


  const saveConversationToBackend = async (conversation) => {
    if (!user?.id) return;
    try {
      // Ensure messages have the correct structure
      const formattedMessages = conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      const payload = {
        id: conversation.id,  // Make sure this is a number
        user_id: user.id,
        messages: formattedMessages,
        title: conversation.messages[0]?.content.slice(0, 30) || "New Conversation",
        created_at: conversation.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log("Sending payload:", payload); // Debug log

      await axios.post(
        `${API_URL}/api/conversations/${user.id}`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error saving conversation to backend:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
    }
  };

  // Update the sendMessage function to stream SSE from the backend and display clean responses
  const sendMessage = async () => {
    if (!query.trim()) return;

    // Locate active conversation
    const activeConversation = conversations.find((conv) => conv.id === activeConversationId);
    if (!activeConversation) {
      console.error("No active conversation found");
      return;
    }

    // Add user message
    const timestamp = new Date().toISOString();
    const userMessage = { role: "user", content: query, timestamp };
    if (!activeConversation.created_at) activeConversation.created_at = timestamp;
    activeConversation.updated_at = timestamp;
    activeConversation.messages.push(userMessage);

    // Add placeholder bot message to update with streaming content
    const botMessage = { role: "bot", content: "", timestamp: new Date().toISOString() };
    activeConversation.messages.push(botMessage);
    setConversations([...conversations]);

    setLoading(true);
    setQuery("");

    // Stream with SSE
    const controller = new AbortController();
    let timeoutId = setTimeout(() => controller.abort(), 180000);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/query/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "text/event-stream" },
        body: JSON.stringify({ query }),
        signal: controller.signal
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split(/\r?\n\r?\n/);
          buffer = parts.pop();
          for (const part of parts) {
            // Only handle SSE data events and skip any heartbeat/comment events
            if (!part.startsWith("data:")) continue;
            const text = part.slice(5).trim();
            if (!text || text === ":") continue; // skip empty or heartbeat
            let parsed;
            try {
              parsed = JSON.parse(text);
              // If it's an object with a response field, use that, otherwise use the string directly
              if (typeof parsed === "object" && parsed.response !== undefined) {
                botMessage.content = parsed.response;
              } else {
                botMessage.content = parsed;
              }
            } catch {
              botMessage.content = text;
            }
            setConversations([...conversations]);
          }
        }
        if (done) break;
      }
      await saveConversationToBackend(activeConversation);
    } catch (error) {
      console.error("Error streaming response:", error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  // Update addNewConversation to include all required fields
  const addNewConversation = () => {
    const timestamp = new Date().toISOString();
    const newConversation = {
      id: Date.now(), // This will be a number
      messages: [],
      title: "New Conversation",
      created_at: timestamp,
      updated_at: timestamp,
      user_id: user?.id
    };
    setConversations([newConversation, ...conversations]);
    setActiveConversationId(newConversation.id);
  };

  // Delete a conversation
  const deleteConversation = async (id) => {
    try {
      const url = `${API_URL}/api/conversations/${user.id}/${id}`;
      console.log("Deleting conversation with URL:", url);

      // Delete from backend first
      const response = await axios.delete(url);
      console.log("Delete response:", response.data);

      // Then update local state
      const newConversations = conversations.filter((conv) => conv.id !== id);
      setConversations(newConversations);

      // If the deleted conversation was active, set the first conversation as active
      if (id === activeConversationId) {
        setActiveConversationId(newConversations[0]?.id || null);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      } else if (error.request) {
        console.error("Request error:", error.request);
      } else {
        console.error("Error message:", error.message);
      }
    }
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





  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    // Scroll to the bottom of the chat window
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations]);

  // Check if the active conversation is empty
  const isActiveConversationEmpty = !conversations.find(
    (conv) => conv.id === activeConversationId
  )?.messages.length;




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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // or a loading spinner
  }

  return (
    <div className={`flex h-screen w-full ${isDarkMode ? 'bg-[#100f1d] text-white' : 'bg-white text-black'} overflow-hidden`}>
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
            <div className="flex flex-col justify-center items-center h-[90%]">
              <video
                src="/Welcomebot.mp4"
                alt="Welcome Bot"
                width={280}
                height={280}
                className="mt-0"
                autoPlay
                loop
                muted
                playsInline
              />
              <h1
                className={`font-bold mb-2 text-center ${isDarkMode ? 'text-[#37dfb1]' : 'text-black'} text-4xl`}
              >
                Welcome to the NexusBot
              </h1>

              <p className={`text-lg mb-6 text-center max-w-xl ${isDarkMode ? 'text-white' : 'text-black'}`}>
                AI chatbot for quick answers to procurement and tender queries fast, reliable, and always available.
              </p>
              <div className="flex flex-wrap gap-4 justify-center mb-4">
                {[
                  "What is price of crane?",
                  "Have we done any project in Reko Diq?",
                  "What is price of 2 inch pipe?",
                  "Show me the latest tender status."
                ].map((example, idx) => (
                  <button
                    key={idx}
                    className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'bg-[#0d3228] text-white hover:bg-[#0f2722]' : 'bg-gray-200 text-black hover:bg-gray-300'} border border-[#37dfb1]`}
                    onClick={() => setQuery(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            (() => {
              const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId);
              if (!activeConversation || !activeConversation.messages) {
                return (
                  <div className="flex justify-center items-center h-[90%]">
                    <div className="text-center space-y-2">
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>No messages found</p>
                    </div>
                  </div>
                );
              }
              return activeConversation.messages.map((msg, idx) => (
                <div key={idx} className="flex mx-20 mt-4">
                  {msg.role === "bot" && (msg.content || !loading) && (
                    <div className="flex flex-col items-start pt-3">
                      {/* Bot Name and Avatar */}
                      <div className="flex items-center p-1 rounded-lg">
                        <div className="flex items-center mb-1 p-1 rounded-lg mx-2">
                          <img
                            src="/SmartTender.png"
                            alt="Bot_Avatar"
                            width={36}
                            height={36}
                            className="rounded-full mr-2"
                          />
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
                  {msg.role === "user" && mounted && (
                    <div className="flex flex-col items-start pt-3">
                      <div className="flex items-center p-1 rounded-lg">
                        <div className="flex items-center mb-1 p-1 rounded-lg mx-2">
                          <img
                            src={user?.imageUrl || "/gasco.jpeg"}
                            alt="User Avatar"
                            width={36}
                            height={36}
                            className="rounded-full mr-2"
                          />
                          <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                            {user?.fullName || user?.username || "User"}
                          </span>
                        </div>
                      </div>
                      <span className={`p-1 rounded-lg w-full break-words inline-block ml-7 text-xl leading-relaxed whitespace-pre-wrap ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {msg.content}
                      </span>
                    </div>
                  )}
                </div>
              ));
            })()
          )}
          {loading && (
            <span>
              <div className="flex  mx-20 mt-4 flex-col items-start pt-3">
                {/* Bot Name and Avatar */}
                <div className="flex items-center p-1 rounded-lg">
                  <div className="flex items-center mb-1 p-1 rounded-lg mx-2">
                    <img
                      src="/SmartTender.png"
                      alt="Bot_Avatar"
                      width={36}
                      height={36}
                      className="rounded-full mr-2"
                    />
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

        <div className={`flex items-center p-2 w-full max-w-4xl ml-4 pr-4 bg-transparent`}>
          {/* Paperclip Icon Button */}
          <button
            className="flex items-center justify-center h-10 w-10 border border-[#37dfb1] rounded-lg bg-transparent mr-2"
            type="button"
            tabIndex={-1}
          >
            <PaperClipIcon className="h-6 w-6 text-[#37dfb1]" />
            <input
              type="file"
              accept=".pdf,.docx,.xlsx,.csv"
              className="hidden"
              multiple
              onChange={handleFileUpload}
            />
          </button>
          {/* Input */}
          <input
            type="text"
            className="flex-grow p-2 bg-[#d9d9d9] text-white border border-[#37dfb1] rounded-lg focus:outline-none mx-2"
            placeholder="Ask me anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ background: isDarkMode ? '#d9d9d9' : '#e5e7eb', color: isDarkMode ? 'black' : '#000' }}
          />
          {/* Send Button */}
          <button
            onClick={sendMessage}
            className="flex items-center justify-center h-10 w-10 border border-[#37dfb1] rounded-lg bg-[#101c1d] ml-2 p-1"
            type="button"
          >
            <img
              src="/Final (19).png" // or .svg, or whatever your file is
              alt="Send"
              width={28} // adjust as needed
              height={28}
              className="object-contain"
            />
          </button>
        </div>
      </div>
    </div>
  );
}