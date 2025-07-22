import "./App.css";
import React, { useState, useRef, useEffect } from "react";
import URL from "./constants";
import MessageBubble from "./components/MessageBubble";
import Sidebar from "./components/Sidebar";

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-2">
      <div className="bg-gray-700 p-2 rounded-lg flex space-x-1">
        <span className="dot animate-bounce" />
        <span className="dot animate-bounce200" />
        <span className="dot animate-bounce400" />
      </div>
    </div>
  );
}

function App() {
  const welcomeMessages = [
    "🤖 Ready for some mind-bending questions?",
    "💬 Ask me anything, literally anything!",
    "🚀 Let's launch your thoughts into answers!",
    "🧠 Got something puzzling? I'm all ears.",
    "✨ A fresh start — what’s on your mind?",
  ];

  // Lazy state initialization from localStorage
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("chats");
    if (saved) return JSON.parse(saved);
    return [{ id: Date.now(), title: "New Chat", messages: [] }];
  });
  const [currentChatId, setCurrentChatId] = useState(() => {
    const savedId = localStorage.getItem("currentChatId");
    if (savedId) return Number(savedId);
    // If no saved ID, use first chat's id
    const initialChats = JSON.parse(localStorage.getItem("chats") || "[]");
    return initialChats.length ? initialChats[0].id : chats[0].id;
  });
  const [question, setQuestion] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const endOfMessages = useRef(null);

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const messages = currentChat?.messages || [];

  // Fetch server session only if no local chats exist
  useEffect(() => {
    if (localStorage.getItem("chats")) return;
    fetch("http://localhost:3001/messages", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const sessionMsgs = data.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const sessionChat = {
          id: Date.now(),
          title: "Session Chat",
          messages: sessionMsgs,
        };
        setChats([sessionChat]);
        setCurrentChatId(sessionChat.id);
      })
      .catch(() => {});
  }, []);

  // Persist chats
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  // Persist currentChatId
  useEffect(() => {
    localStorage.setItem("currentChatId", currentChatId.toString());
  }, [currentChatId]);

  // Welcome message carousel when no messages
  useEffect(() => {
    if (messages.length === 0) {
      const interval = setInterval(() => {
        setWelcomeIndex((prev) => (prev + 1) % welcomeMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // End-session beacon
  useEffect(() => {
    const handleBeforeUnload = () => {
      navigator.sendBeacon("http://localhost:3001/end-session");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const askQuestion = async () => {
    if (!question.trim()) return;
    const userMessage = { role: "user", content: question };
    // Send user message to backend
    await fetch("http://localhost:3001/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(userMessage),
    });
    // Optimistically update UI
    updateCurrentChat([...messages, userMessage]);
    setQuestion("");
    setIsTyping(true);

    // Get assistant reply
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: question }] }] }),
    });
    const data = await res.json();
    const assistantReply = data.candidates[0].content.parts[0].text.trim();
    const assistantMessage = { role: "assistant", content: assistantReply };
    // Save assistant message
    await fetch("http://localhost:3001/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(assistantMessage),
    });

    setIsTyping(false);
    updateCurrentChat([...messages, userMessage, assistantMessage]);

    // Generate title if first message
    if (messages.length === 0) {
      const newTitle = await generateTitleFromMessages([
        userMessage,
        assistantMessage,
      ]);
      renameCurrentChat(newTitle);
    }
  };

  const generateTitleFromMessages = async (conversation) => {
    const prompt = `Give a short, catchy single-line title (max 6 words) for this conversation.\n\n${conversation
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")}`;
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await res.json();
    const rawTitle = data.candidates[0].content.parts[0].text.trim();
    return rawTitle
      .split("\n")[0]
      .replace(/^[-*\d.\s]+/, "")
      .replace(/[*_#`~]/g, "")
      .trim();
  };

  const updateCurrentChat = (updatedMessages) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? { ...chat, messages: updatedMessages }
          : chat
      )
    );
  };

  const renameCurrentChat = (newTitle) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId ? { ...chat, title: newTitle } : chat
      )
    );
  };

  const handleNewChat = () => {
    const placeholder = chats.find((chat) => chat.messages.length === 0);
    if (placeholder) {
      setCurrentChatId(placeholder.id);
      return;
    }
    const newChat = { id: Date.now(), title: "New Chat", messages: [] };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const handleSelectChat = (chatId) => setCurrentChatId(chatId);

  const handleDeleteChat = (chatId) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    if (chatId === currentChatId && chats.length > 1) {
      const remaining = chats.filter((c) => c.id !== chatId);
      setCurrentChatId(remaining[0].id);
    }
  };

  return (
    <div className="h-screen flex bg-gray-900">
      <div className="w-1/5">
        <Sidebar
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
        />
      </div>
      <div className="flex-1 flex flex-col p-6">
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="text-center text-white text-4xl py-50 animate-fade-in">
              {welcomeMessages[welcomeIndex]}
            </div>
          ) : (
            messages.map((msg, idx) => (
              <MessageBubble key={idx} role={msg.role} content={msg.content} />
            ))
          )}
          {isTyping && <TypingIndicator />}
          <div ref={endOfMessages} />
        </div>
        <div className="mt-4 flex items-center bg-gray-800 rounded-full border border-gray-700 p-2">
          <input
            type="text"
            className="flex-1 bg-transparent pl-4 outline-none text-white"
            placeholder="Enter your prompt"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askQuestion()}
          />
          <button
            className="px-6 py-2 rounded-full bg-blue-500 hover:bg-blue-600 transition text-white cursor-pointer"
            onClick={askQuestion}
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
