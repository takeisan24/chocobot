// Cooldown nhẹ trong RAM (chống spam click). Khác với cooldown DB của /work cũ:
// đây chỉ để chặn bấm liên tục trong vài giây, không phải gate chính (gate là năng lượng).
const store = new Map(); // `${key}:${userId}` -> timestamp hết hạn

/** Trả về SỐ GIÂY còn lại nếu đang cooldown, hoặc 0 nếu OK (và đặt cooldown mới). */
function onCooldown(key, userId, ms) {
    const k = `${key}:${userId}`;
    const now = Date.now();
    const until = store.get(k) || 0;
    if (now < until) return Math.ceil((until - now) / 1000);
    store.set(k, now + ms);
    return 0;
}

module.exports = { onCooldown };
