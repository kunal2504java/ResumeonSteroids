"use client";

import { useEffect, useRef } from "react";

/** A hand-drawn ATS arc gauge — deliberately not a perfect ring. */
export default function InkGauge({ value = 92, size = 120 }: { value?: number; size?: number }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    (async () => {
      const mod = await import("roughjs");
      if (cancelled || !ref.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rough = (mod as any).default ?? mod;
      const svg = ref.current;
      svg.innerHTML = "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rc: any = rough.svg(svg);
      const c = size / 2;
      const rad = size * 0.38;
      const start = Math.PI * 0.75;
      const full = Math.PI * 1.5;
      const track = rc.arc(c, c, rad * 2, rad * 2, start, start + full, false, {
        stroke: "#cfc9ba", strokeWidth: 6, roughness: 1.4,
      });
      svg.appendChild(track);
      const sweep = full * Math.min(1, Math.max(0, value / 100));
      // rough.js arc() infinite-loops when the angular sweep is ~0
      // (its step becomes 0 → `for (a=start; a<=start; a+=0)` never ends).
      // Skip the value arc entirely for a zero/near-zero score.
      if (sweep <= 0.02) return;
      const val = rc.arc(c, c, rad * 2, rad * 2, start, start + sweep, false, {
        stroke: "#e23b17", strokeWidth: 7, roughness: 1.5,
      });
      svg.appendChild(val);
      if (!reduce) {
        val.querySelectorAll("path").forEach((p: SVGPathElement) => {
          const path = p;
          let len = 0;
          try { len = path.getTotalLength(); } catch { return; }
          if (!len) return;
          path.style.strokeDasharray = String(len);
          path.style.strokeDashoffset = String(len);
          path.getBoundingClientRect();
          path.style.transition = "stroke-dashoffset .8s 300ms ease-out";
          path.style.strokeDashoffset = "0";
        });
      }
    })();

    return () => { cancelled = true; };
  }, [value, size]);

  return <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" />;
}
