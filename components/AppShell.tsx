"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "きょう", icon: SunIcon },
  { href: "/lessons", label: "レッスン", icon: BookIcon },
  { href: "/progress", label: "きろく", icon: ChartIcon },
  { href: "/tips", label: "こころえ", icon: LeafIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* 無視 */
      });
    }
  }, []);
  const hideNav = pathname.startsWith("/practice") || pathname.startsWith("/diagnose");

  return (
    <div className="min-h-dvh bg-desk">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-paper shadow-[0_0_80px_rgba(40,30,20,0.12)]">
        <div className={hideNav ? "flex flex-1 flex-col" : "flex flex-1 flex-col pb-[4.5rem]"}>
          {children}
        </div>
        {!hideNav && (
          <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-ink/8 bg-paper/95 backdrop-blur-md">
            <ul className="grid grid-cols-4 px-2 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
              {items.map((item) => {
                const active =
                  ready &&
                  (item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex flex-col items-center gap-0.5 py-2 text-[11px] tracking-wide ${
                        active ? "text-ink" : "text-ink-soft/70"
                      }`}
                    >
                      <Icon active={active} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}

function SunIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} />
      <path
        d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.4}
        strokeLinecap="round"
      />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5.5h9.5A3.5 3.5 0 0 1 18 9v10.5H8.2A3.2 3.2 0 0 0 5 16.3V5.5Z"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.4}
      />
      <path d="M5 16.3h13" stroke="currentColor" strokeWidth={active ? 1.8 : 1.4} />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 19V9.5M12 19V5M19 19v-6"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.4}
        strokeLinecap="round"
      />
    </svg>
  );
}

function LeafIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 14.5c6-8 13-9.5 14-9.5-1 6.5-3.5 13-10.5 14-4 .6-6.2-1.2-6.2-3.8 0-1.6.9-2.8 2.7-.7Z"
        stroke="currentColor"
        strokeWidth={active ? 1.8 : 1.4}
      />
      <path d="M9 15.5c2-3 5-6 9.5-8.5" stroke="currentColor" strokeWidth={active ? 1.6 : 1.3} strokeLinecap="round" />
    </svg>
  );
}
