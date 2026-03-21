"use client";

import { useState, useEffect } from "react";

interface StreamingTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export default function StreamingText({
  text,
  speed = 20,
  className = "",
  onComplete,
}: StreamingTextProps) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-0.5 h-4 bg-[#6366f1] animate-pulse ml-0.5 align-middle" />
      )}
    </span>
  );
}
