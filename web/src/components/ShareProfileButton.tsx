"use client";

import { useState } from "react";

export default function ShareProfileButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://waguri-bot.vercel.app/u/${id}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bị chặn -> bỏ qua */
    }
  };

  return (
    <button
      onClick={copy}
      className="px-4 py-2 rounded-full text-xs font-bold border border-pink-300/30 text-pink-200 hover:border-pink-300/60 transition-all whitespace-nowrap"
    >
      {copied ? "✅ Đã copy!" : "🔗 Chia sẻ hồ sơ"}
    </button>
  );
}
