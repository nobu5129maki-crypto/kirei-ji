"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type WritingPadHandle = {
  clear: () => void;
  undo: () => void;
  isEmpty: () => boolean;
  getInkCanvas: () => HTMLCanvasElement | null;
  strokeCount: () => number;
};

type Point = { x: number; y: number };

type Props = {
  ghost: string;
  showGhost: boolean;
  className?: string;
};

export const WritingPad = forwardRef<WritingPadHandle, Props>(
  function WritingPad({ ghost, showGhost, className = "" }, ref) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const inkRef = useRef<HTMLCanvasElement>(null);
    const modelRef = useRef<HTMLCanvasElement>(null);
    const strokesRef = useRef<Point[][]>([]);
    const currentRef = useRef<Point[] | null>(null);
    const [strokeTick, setStrokeTick] = useState(0);

    const sizeCanvas = (canvas: HTMLCanvasElement, css: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(css * dpr);
      canvas.height = Math.round(css * dpr);
      canvas.style.width = `${css}px`;
      canvas.style.height = `${css}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return ctx;
    };

    const paintInk = () => {
      const canvas = inkRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const css = wrap.clientWidth;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = canvas.width / css;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1C1916";
      ctx.lineWidth = Math.max(5.4, css * 0.018);
      const all = [
        ...strokesRef.current,
        ...(currentRef.current ? [currentRef.current] : []),
      ];
      for (const stroke of all) {
        if (stroke.length < 2) {
          if (stroke.length === 1) {
            ctx.beginPath();
            ctx.arc(stroke[0].x, stroke[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.fillStyle = "#1C1916";
            ctx.fill();
          }
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length - 1; i++) {
          const midX = (stroke[i].x + stroke[i + 1].x) / 2;
          const midY = (stroke[i].y + stroke[i + 1].y) / 2;
          ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, midX, midY);
        }
        const last = stroke[stroke.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.stroke();
      }
    };

    const paintGhost = async () => {
      const canvas = modelRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const css = wrap.clientWidth;
      const ctx = sizeCanvas(canvas, css);
      ctx.clearRect(0, 0, css, css);
      if (!showGhost) return;
      await document.fonts.ready;
      try {
        await document.fonts.load(`${css * 0.72}px "Klee One"`);
      } catch {
        /* ignore */
      }
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#1C1916";
      ctx.font = `600 ${css * 0.72}px "Klee One", "Yu Mincho", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ghost, css / 2, css / 2 + css * 0.02);
      ctx.globalAlpha = 1;
    };

    useEffect(() => {
      const wrap = wrapRef.current;
      const ink = inkRef.current;
      if (!wrap || !ink) return;

      const layout = () => {
        sizeCanvas(ink, wrap.clientWidth);
        paintInk();
        void paintGhost();
      };

      layout();
      const ro = new ResizeObserver(layout);
      ro.observe(wrap);
      return () => ro.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ghost, showGhost]);

    useImperativeHandle(ref, () => ({
      clear: () => {
        strokesRef.current = [];
        currentRef.current = null;
        setStrokeTick((n) => n + 1);
        paintInk();
      },
      undo: () => {
        strokesRef.current = strokesRef.current.slice(0, -1);
        currentRef.current = null;
        setStrokeTick((n) => n + 1);
        paintInk();
      },
      isEmpty: () => strokesRef.current.length === 0,
      getInkCanvas: () => inkRef.current,
      strokeCount: () => strokesRef.current.length,
    }));

    const pointFromEvent = (e: ReactPointerEvent<HTMLCanvasElement>): Point => {
      const rect = e.currentTarget.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* 非信頼イベントでも描けるようにする */
      }
      currentRef.current = [pointFromEvent(e)];
      paintInk();
    };

    const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!currentRef.current) return;
      currentRef.current.push(pointFromEvent(e));
      paintInk();
    };

    const endStroke = () => {
      if (!currentRef.current) return;
      if (currentRef.current.length > 0) {
        strokesRef.current = [...strokesRef.current, currentRef.current];
      }
      currentRef.current = null;
      setStrokeTick((n) => n + 1);
      paintInk();
    };

    return (
      <div
        ref={wrapRef}
        className={`relative aspect-square w-full overflow-hidden rounded-[22px] bg-[#FBF7F0] ${className}`}
      >
        <Grid />
        <canvas
          ref={modelRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        />
        <canvas
          ref={inkRef}
          className="absolute inset-0 h-full w-full touch-none"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
        />
        <span className="sr-only">画数 {strokeTick}</span>
      </div>
    );
  },
);

function Grid() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      aria-hidden
    >
      <rect
        x="3.5"
        y="3.5"
        width="93"
        height="93"
        fill="none"
        stroke="#C9BBA8"
        strokeWidth="0.7"
      />
      <line x1="50" y1="3.5" x2="50" y2="96.5" stroke="#D8CCBA" strokeWidth="0.45" strokeDasharray="1.6 1.5" />
      <line x1="3.5" y1="50" x2="96.5" y2="50" stroke="#D8CCBA" strokeWidth="0.45" strokeDasharray="1.6 1.5" />
      <line x1="3.5" y1="3.5" x2="96.5" y2="96.5" stroke="#E4DACB" strokeWidth="0.3" />
      <line x1="96.5" y1="3.5" x2="3.5" y2="96.5" stroke="#E4DACB" strokeWidth="0.3" />
    </svg>
  );
}
