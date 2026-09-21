import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-5 pt-24 text-center">
      <p className="font-serif text-3xl">この頁はありません</p>
      <p className="mt-3 text-sm text-ink-soft">紙を閉じて、はじめの頁へ。</p>
      <Link href="/" className="btn-ink mt-8 inline-flex">
        きょうへ
      </Link>
    </div>
  );
}
