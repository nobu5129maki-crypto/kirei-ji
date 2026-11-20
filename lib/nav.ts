"use client";

import { useEffect, useState } from "react";
import { toBaseRelative } from "./paths";

export function go(href: string): void {
  const rel = toBaseRelative(href);
  window.location.assign(new URL(rel, document.baseURI).href);
}

export function registerAppServiceWorker(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const root = document.baseURI;
  const script = new URL("sw.js", root).href;
  const scope = new URL("./", root).href;
  navigator.serviceWorker.register(script, { scope }).catch(() => {
    /* オフライン登録の失敗は無視 */
  });
}

function readAppPathname(): string {
  const basePath = new URL(document.baseURI).pathname.replace(/\/$/, "");
  let pathname = window.location.pathname;
  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
    pathname = pathname.slice(basePath.length) || "/";
  }
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);
  return pathname || "/";
}

export function useAppPathname(): string {
  const [pathname, setPathname] = useState("/");
  useEffect(() => {
    const sync = () => setPathname(readAppPathname());
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  return pathname;
}
