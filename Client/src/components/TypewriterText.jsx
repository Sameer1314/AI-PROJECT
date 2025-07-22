// TypewriterText.jsx
import React, { useEffect, useState } from "react";

export default function TypewriterText({ text, speed = 40 }) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex(currentIndex + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <p className="font-mono whitespace-pre-wrap leading-relaxed text-slate-200 text-base">
      {displayedText}
      {currentIndex < text.length && (
        <span className="inline-block text-slate-400 animate-blink">|</span>
      )}
    </p>
  );
}
