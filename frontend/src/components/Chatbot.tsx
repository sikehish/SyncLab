import React, { useState, useRef, useEffect } from "react";
import { FaComments, FaPaperPlane } from "react-icons/fa";
import { FaRobot } from "react-icons/fa6";

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: "user" | "bot" }[]>([]);
  const [input, setInput] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);
  
  const toggleChat = () => setIsOpen(!isOpen);
  
  const sendMessage = () => {
    if (!input.trim()) return;
    
    const userMessage = { text: input, sender: "user" as const };
    setMessages((prev) => [...prev, userMessage]);
    
    const url = `http://localhost:5000/api/chat?prompt=${encodeURIComponent(input)}`;
    eventSourceRef.current = new EventSource(url);
    
    let botMessage = { text: "", sender: "bot" as const };
    eventSourceRef.current.onmessage = (event) => {
      if (event.data === "[DONE]") {
        eventSourceRef.current?.close();
        return;
      }
      botMessage.text += event.data;
      setMessages((prev) => [...prev.slice(0, -1), { ...botMessage }]);
    };
    
    eventSourceRef.current.onerror = (error) => {
      console.error("Chatbot SSE error:", error);
      eventSourceRef.current?.close();
    };
    
    setMessages((prev) => [...prev, botMessage]);
    setInput("");
  };
  
  useEffect(() => {
    return () => eventSourceRef.current?.close();
  }, []);
  
  return (
    <>
      <button
        onClick={toggleChat}
        className="fixed bottom-5 right-5 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
      >
        <FaRobot size={24} />
      </button>
      
      {isOpen && (
        <div className="fixed bottom-24 right-5 w-80 bg-white shadow-xl rounded-lg border border-gray-300 overflow-hidden">
          <div className="bg-blue-600 text-white p-3 text-lg font-semibold">Sync Bot</div>
          <div className="h-64 p-3 overflow-y-auto space-y-2">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`p-2 rounded-lg text-white ${msg.sender === "user" ? "bg-blue-500 ml-auto" : "bg-gray-700 mr-auto"}`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="p-3 flex items-center border-t">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow p-2 border rounded-l-lg focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button 
              onClick={sendMessage} 
              className="bg-blue-600 p-2 rounded-r-lg text-white hover:bg-blue-700"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;