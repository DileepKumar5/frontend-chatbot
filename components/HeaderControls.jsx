import { useState } from "react";
import { ChevronDown, Check, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const HeaderControls = ({ isDarkMode, toggleTheme }) => {
  const { signOut } = useClerk();
  const router = useRouter();
  const models = [
    {
      name: "GPT-4",
      description: "High-performance AI for professional and research use.",
      abilities: ["📝", "💡", "🔍", "🤖"],
    },
    {
      name: "GPT-4o mini",
      description: "Fast, advanced AI with top-tier reasoning and multimodal support.",
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

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className={`w-full py-4 flex justify-between items-center px-6 ${isDarkMode ? 'bg-[#100f1d] shadow-lg' : 'bg-gray-200'} `}>
      
      {/* Left Section (Model Selector) */}
      <div className="flex space-x-4 items-center">
        <div
          className={`${
            isDarkMode ? "bg-[#23232b] text-white" : "bg-gray-100 text-purple-950"
          } px-4 py-2 rounded-lg text-sm cursor-pointer 
          hover:${isDarkMode ? "bg-[#2e2e38]" : "bg-gray-300"} 
          flex items-center justify-between gap-2`}
        >
          Controls <ChevronDown size={16} />
        </div>

        {/* Model Selection Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`${
              isDarkMode ? "bg-[#23232b] text-white" : "bg-gray-100 text-purple-950"
            } w-36 px-4 py-2 rounded-lg text-sm cursor-pointer text-center 
            hover:${isDarkMode ? "bg-[#2e2e38]" : "bg-gray-300"} 
            flex items-center justify-between relative`}
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

        {/* RAG Information */}
        <div className="relative group">
          <div
            className={`${
              isDarkMode ? "bg-[#23232b] text-white" : "bg-gray-100 text-purple-950"
            } px-4 py-2 rounded-lg text-sm cursor-pointer 
            hover:${isDarkMode ? "bg-[#2e2e38]" : "bg-gray-300"}`}
          >
            RAG ⓘ
          </div>

          {/* Tooltip */}
          <div
            className={`absolute left-0 mt-1 w-64 p-2 text-xs rounded-lg shadow-lg opacity-0 
            group-hover:opacity-100 transition-opacity duration-200 ${
              isDarkMode ? "bg-[#23232b] text-white" : "bg-gray-100 text-black"
            }`}
          >
            <p className="text-sm font-semibold text-center">Retrieval-Augmented Generation:</p>
            <p className="text-xs text-gray-400 text-center">
              Improves AI-generated responses by incorporating relevant information from external data sources,
              ensuring more accurate and contextually rich answers.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section (Theme Toggle and Logout) */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className={`${isDarkMode ? 'bg-[#23232b]' : 'bg-gray-300'} text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:${isDarkMode ? 'bg-[#2e2e38]' : 'bg-gray-400'}`}
        >
          {isDarkMode ? '🌙' : '☀️'}
        </button>
        <button
          onClick={handleLogout}
          className={`${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded-lg text-sm cursor-pointer flex items-center space-x-2 transition-colors duration-200`}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default HeaderControls;
