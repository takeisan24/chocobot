import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Trang riêng tư / phiên đăng nhập -> không index.
      disallow: ["/dashboard", "/login", "/auth/"],
    },
    sitemap: "https://waguri-bot.vercel.app/sitemap.xml",
  };
}
