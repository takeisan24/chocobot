// Công thức game tái dùng ở web — ĐỒNG BỘ với bot (src/lib/leveling.js + persona.js).
// LƯU Ý: nếu đổi công thức bên bot thì sửa cả ở đây.

const BASE = 100; // = config.LEVELING.BASE

const expForLevel = (lvl: number) => (lvl <= 1 ? 0 : BASE * (lvl - 1) * (lvl - 1));

export function getLevelProgress(exp: number) {
  const e = Math.max(0, Number(exp) || 0);
  const level = e <= 0 ? 1 : Math.floor(Math.sqrt(e / BASE)) + 1;
  const floor = expForLevel(level);
  const next = expForLevel(level + 1);
  return { level, expIntoLevel: e - floor, expForNextLevel: next - floor };
}

// Bậc thân thiết với Waguri (đồng bộ AFFECTION_TIERS trong persona.js)
const TIERS: { min: number; name: string }[] = [
  { min: 300, name: "💞 Tri kỷ" },
  { min: 120, name: "💗 Thân thiết" },
  { min: 50, name: "💓 Bạn thân" },
  { min: 15, name: "💛 Quen biết" },
  { min: 0, name: "🤍 Người mới" },
];

export function affectionTier(aff: number) {
  const a = Number(aff) || 0;
  return (TIERS.find((t) => a >= t.min) || TIERS[TIERS.length - 1]).name;
}

export const fmtVND = (n: number) => Number(n || 0).toLocaleString("vi-VN");
