"use client";

import { useEffect, useRef } from "react";

/**
 * The ink hand. Renders a full-document SVG overlay and draws hand-inked
 * marks (rough.js) at the live positions of elements tagged with:
 *   data-mark="underline | circle | strike | arrow"  (+ data-color, data-arrow-to)
 *   data-frame                                        (rough rectangle behind a card)
 *   data-flow="id1>id2"                               (drawn arrow between two #ids)
 * Marks draw themselves in like a pen moving across the page, then redraw on resize.
 */

const COLORS: Record<string, string> = {
  pen: "#e23b17",
  ink: "#211e18",
  marigold: "#f2a81d",
  blue: "#2a4c86",
  paper: "#f1eee4",
};

type Pt = { x: number; y: number; w: number; h: number; cx: number; cy: number };

export default function InkLayer({ scopeId }: { scopeId?: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanupResize: (() => void) | null = null;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function docRect(el: Element): Pt {
      const r = el.getBoundingClientRect();
      const x = r.left + window.scrollX;
      const y = r.top + window.scrollY;
      return { x, y, w: r.width, h: r.height, cx: x + r.width / 2, cy: y + r.height / 2 };
    }

    function animate(group: SVGGElement, delay: number) {
      if (reduce) return;
      group.querySelectorAll("path").forEach((p, i) => {
        let len = 0;
        try {
          len = (p as SVGPathElement).getTotalLength();
        } catch {
          return;
        }
        if (!len) return;
        const path = p as SVGPathElement;
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len);
        path.style.transition = "none";
        path.getBoundingClientRect();
        path.style.transition = `stroke-dashoffset .55s ${delay + i * 90}ms ease-out`;
        path.style.strokeDashoffset = "0";
      });
    }

    async function draw() {
      const svg = svgRef.current;
      if (!svg || cancelled) return;
      const roughMod = await import("roughjs");
      if (cancelled || !svgRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rough = (roughMod as any).default ?? roughMod;

      const scope: ParentNode = scopeId ? document.getElementById(scopeId) ?? document : document;

      svg.innerHTML = "";
      const W = document.documentElement.scrollWidth;
      const H = document.documentElement.scrollHeight;
      svg.setAttribute("width", String(W));
      svg.setAttribute("height", String(H));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rc: any = rough.svg(svg);

      const add = (node: SVGGElement, delay: number) => {
        svg.appendChild(node);
        animate(node, delay);
      };

      let order = 0;
      scope.querySelectorAll<HTMLElement>("[data-mark]").forEach((el) => {
        const type = el.dataset.mark;
        const col = COLORS[el.dataset.color || "ink"] || COLORS.ink;
        const r = docRect(el);
        const delay = reduce ? 0 : 220 + order * 130;
        order++;

        if (type === "underline") {
          const y = r.y + r.h + 5;
          add(rc.line(r.x - 2, y, r.x + r.w + 2, y + 2, { stroke: col, strokeWidth: 3, roughness: 1.6, bowing: 2 }), delay);
        } else if (type === "circle") {
          add(rc.ellipse(r.cx, r.cy + 2, r.w * 1.5, r.h * 1.45, { stroke: col, strokeWidth: 2.6, roughness: 1.7, bowing: 1.5 }), delay);
        } else if (type === "strike") {
          const y = r.y + r.h * 0.55;
          add(rc.line(r.x - 1, y, r.x + r.w + 1, y + 1.5, { stroke: col, strokeWidth: 2.4, roughness: 1.8, bowing: 2.5 }), delay);
        } else if (type === "arrow") {
          const target = el.dataset.arrowTo ? document.getElementById(el.dataset.arrowTo) : null;
          if (!target) return;
          const t = docRect(target);
          const x1 = r.cx, y1 = r.y + r.h + 2, x2 = t.x + 26, y2 = t.y - 4;
          add(rc.line(x1, y1, x2, y2, { stroke: col, strokeWidth: 2.2, roughness: 1.6, bowing: 3 }), delay);
          add(rc.linearPath([[x2 - 9, y2 - 7], [x2, y2], [x2 - 3, y2 - 11]], { stroke: col, strokeWidth: 2.2, roughness: 1.2 }), delay + 260);
        }
      });

      // rough frames behind cards
      scope.querySelectorAll<HTMLElement>("[data-frame]").forEach((el, i) => {
        const r = docRect(el);
        const col = COLORS[el.dataset.frameColor || "ink"] || COLORS.ink;
        add(rc.rectangle(r.x - 5, r.y - 5, r.w + 10, r.h + 10, { stroke: col, strokeWidth: 1.8, roughness: 1.5, bowing: 1.2 }), 120 + i * 60);
      });

      // explicit flow arrows between two ids: data-flow="from>to"
      scope.querySelectorAll<HTMLElement>("[data-flow]").forEach((el, i) => {
        const [fromId, toId] = (el.dataset.flow || "").split(">");
        const a = document.getElementById(fromId), b = document.getElementById(toId);
        if (!a || !b) return;
        const ra = docRect(a), rb = docRect(b);
        const x1 = ra.x + ra.w + 10, y1 = ra.cy, x2 = rb.x - 12, y2 = rb.cy;
        add(rc.line(x1, y1, x2, y2, { stroke: COLORS.ink, strokeWidth: 2, roughness: 1.7, bowing: 3 }), 600 + i * 250);
        add(rc.linearPath([[x2 - 10, y2 - 6], [x2, y2], [x2 - 10, y2 + 6]], { stroke: COLORS.ink, strokeWidth: 2, roughness: 1 }), 820 + i * 250);
      });
    }

    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(t);
      t = setTimeout(draw, 140);
    };

    // first paint after fonts settle so measurements are correct
    const ready = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (ready?.ready) ready.ready.then(() => setTimeout(draw, 60));
    else setTimeout(draw, 120);

    window.addEventListener("resize", schedule);
    cleanupResize = () => window.removeEventListener("resize", schedule);

    return () => {
      cancelled = true;
      clearTimeout(t);
      cleanupResize?.();
    };
  }, [scopeId]);

  return <svg ref={svgRef} className="ink-overlay" aria-hidden="true" />;
}
