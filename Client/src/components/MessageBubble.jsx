import React, { useState, useEffect } from "react";

export default function MessageBubble({ role, content }) {
  const isUser = role === "user";
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (typeof content !== "string" || role !== "assistant") {
      setDisplayed(content);
      return;
    }

    let i = 0;
    let text = "";

    const interval = setInterval(() => {
      text += content.charAt(i);
      setDisplayed(text);
      i++;

      if (i >= content.length) {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [content, role]);

  const containerClasses = isUser ? "justify-end" : "justify-start";
  const bubbleClasses = [
    "max-w-[70%] px-4 py-2 rounded-lg break-words whitespace-pre-wrap",
    isUser ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100",
  ].join(" ");

  return (
    <div className={`flex ${containerClasses} mb-2`}>
      <div className={bubbleClasses}>{displayed}</div>
    </div>
  );
}
