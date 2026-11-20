"use client";

import { useEffect } from "react";
import { go } from "@/lib/nav";

export default function ProgressPage() {
  useEffect(() => {
    go("/album");
  }, []);

  return <p className="px-5 pt-16 text-ink-soft">見本帳へ移ります…</p>;
}
