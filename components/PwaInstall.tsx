"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function PwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* オフライン登録失敗は無視 */
      });
    }

    setStandalone(isStandalone());
    setIos(isIos());
    setHidden(localStorage.getItem("kirei-ji-hide-install") === "1");

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone || hidden) return null;

  const dismiss = () => {
    localStorage.setItem("kirei-ji-hide-install", "1");
    setHidden(true);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <section className="mt-6 rounded-3xl border border-ink/8 bg-white/45 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-gold">ホーム画面に追加</p>
          <p className="mt-1 font-serif text-lg">アプリのように使う</p>
          {deferred ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              紙とペンの感覚で、いつでも一文字。
            </p>
          ) : ios ? (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Safari の共有ボタン（□↑）から「ホーム画面に追加」を選んでください。
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              ブラウザのメニューから「アプリをインストール」または「ホーム画面に追加」を選んでください。
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-[11px] text-ink-soft"
          aria-label="閉じる"
        >
          閉じる
        </button>
      </div>
      {deferred && (
        <button type="button" className="btn-ink mt-3 w-full" onClick={install}>
          インストールする
        </button>
      )}
    </section>
  );
}
