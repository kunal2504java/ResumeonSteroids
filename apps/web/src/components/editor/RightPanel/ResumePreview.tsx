"use client";

import { useRef, useState, useEffect } from "react";
import JakeTemplate from "./JakeTemplate";

export default function ResumePreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth - 32;
      const containerHeight = containerRef.current.clientHeight - 32;
      const scaleX = containerWidth / 816;
      const scaleY = containerHeight / 1056;
      setScale(Math.min(scaleX, scaleY, 1));
    }

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full flex items-start justify-center overflow-auto p-4 bg-zinc-900"
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        <div className="shadow-2xl shadow-black/50">
          <JakeTemplate ref={resumeRef} />
        </div>
      </div>
    </div>
  );
}

export { JakeTemplate };
