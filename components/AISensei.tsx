import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, MessageCircle } from "lucide-react";
import { askTutor } from "../services/geminiService.ts";

interface AISenseiProps {
  topic: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const AISensei: React.FC<AISenseiProps> = ({ topic, isOpen, setIsOpen }) => {
  const [query, setQuery] = useState("");
  const [chat, setChat] = useState<{ role: "ai" | "user"; text: string }[]>([{ role: "ai", text: `Halo! Saya AI Sensei. Ada yang ingin kamu tanyakan tentang ${topic || "English Recount Text"}?` }]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  // Update pesan pembuka jika topik berubah
  useEffect(() => {
    if (chat.length === 1) {
      setChat([{ role: "ai", text: `Halo! Saya AI Sensei. Ada yang ingin kamu tanyakan tentang ${topic || "English Recount Text"}?` }]);
    }
  }, [topic]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userText = query;
    setChat((prev) => [...prev, { role: "user", text: userText }]);
    setQuery("");
    setLoading(true);

    const response = await askTutor(topic || "Recount Text", userText);
    setChat((prev) => [...prev, { role: "ai", text: response || "" }]);
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-50 group shadow-indigo-900/20"
        title="Tanya AI Sensei"
      >
        <Sparkles size={24} className="group-hover:animate-spin-slow" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-24 md:right-24 md:w-96 md:h-[500px] bg-slate-900 md:rounded-[2.5rem] shadow-2xl flex flex-col z-[100] border border-slate-800 animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">
          <div className="p-6 bg-slate-950 text-white flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center border border-indigo-500/50">
                <Bot size={24} />
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-tight">AI Sensei</h4>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Online & Ready</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-900">
            {chat.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium border ${msg.role === "user" ? "bg-indigo-600 text-white border-indigo-500 rounded-tr-none" : "bg-slate-800 text-slate-200 border-slate-700 rounded-tl-none"}`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-tl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/50">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tanya Sensei..."
                className="w-full pl-5 pr-12 py-4 bg-slate-950 border-2 border-slate-800 focus:border-indigo-600 rounded-2xl outline-none font-bold text-sm text-white shadow-inner transition-all placeholder:text-slate-600"
              />
              <button type="submit" className="absolute right-2 top-2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg">
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AISensei;
