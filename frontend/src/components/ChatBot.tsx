import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBotProps {
  opportunitiesContext: any[];
}

export const ChatBot: React.FC<ChatBotProps> = ({ opportunitiesContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI career advisor. Ask me anything about the opportunities on your dashboard!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const preferences = useAuthStore((state) => state.preferences);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/chat", {
        messages: [...messages, { role: "user", content: userMessage }],
        context: {
          profile: preferences,
          opportunities: opportunitiesContext,
        },
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.message },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting to the AI brain right now. Make sure Ollama is running!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 flex flex-col h-[550px] w-[400px] max-w-[calc(100vw-48px)] overflow-hidden rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] shadow-[0_24px_80px_-20px_rgba(15,23,42,0.26)] transition-all duration-300 origin-bottom-right animate-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <h3 className="text-lg font-black tracking-tight text-white">OpTrack Advisor</h3>
            </div>
            <button
              className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="13" y1="1" x2="1" y2="13"/><line x1="1" y1="1" x2="13" y2="13"/></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-transparent">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-[22px] px-5 py-3 text-[15px] leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-[linear-gradient(135deg,_#06b6d4_0%,_#0ea5e9_100%)] text-white rounded-br-sm shadow-cyan-500/20"
                      : "bg-white border border-slate-200/60 text-slate-700 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-[22px] rounded-bl-sm bg-white px-5 py-4 border border-slate-200/60 shadow-sm text-slate-400">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-bounce"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-100 bg-white/80 backdrop-blur-xl p-4">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 focus-within:border-cyan-300 focus-within:ring-4 focus-within:ring-cyan-500/10 transition-all">
              <input
                className="flex-1 bg-transparent px-3 py-2.5 text-[15px] text-slate-700 placeholder-slate-400 focus:outline-none"
                placeholder="Ask your advisor..."
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-md shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:shadow-none"
                disabled={isLoading || !input.trim()}
                onClick={handleSend}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-white shadow-xl hover:bg-cyan-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/30 transition-transform hover:scale-105 active:scale-95"
          onClick={() => setIsOpen(true)}
        >
          <span className="text-2xl">💬</span>
        </button>
      )}
    </div>
  );
};
