"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0812] text-slate-200 px-6 text-center gap-5">
      <div className="text-5xl">🥺</div>
      <h1 className="text-2xl font-black text-white">Có lỗi rồi~</h1>
      <p className="text-slate-400 max-w-sm">Waguri xin lỗi, có gì đó trục trặc. Cậu thử lại giúp mình nhé!</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 rounded-full font-bold bg-pink-300 text-[#0d0812] hover:bg-pink-400 transition-all"
        >
          Thử lại
        </button>
        <Link href="/" className="px-6 py-3 rounded-full font-bold border border-pink-300/30 text-pink-200 hover:border-pink-300/60 transition-all">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
