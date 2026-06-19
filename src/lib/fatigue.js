const config = require('../config');

// Theo dõi số lần làm việc liên tiếp gần đây (RAM) để giảm thu nhập dần (chống cày máy).
const store = new Map(); // userId -> { count, ts }

/** Trả hệ số thu nhập (1.0 -> FLOOR) và tăng đếm. Có decay dần theo thời gian nghỉ. */
function fatigueMultiplier(userId) {
    const now = Date.now();
    const r = store.get(userId) || { count: 0, ts: now };
    
    // Nguội dần (hồi sức) nếu để cách quãng không làm việc liên tục
    if (now - r.ts > config.FATIGUE.DECAY_MS) {
        const decay = Math.floor((now - r.ts) / config.FATIGUE.DECAY_MS);
        r.count = Math.max(0, r.count - decay);
    }
    
    const mult = Math.max(config.FATIGUE.FLOOR, 1 - r.count * config.FATIGUE.STEP);
    r.count++;
    r.ts = now;
    store.set(userId, r);
    return mult;
}

/** Xem hệ số mệt mỏi hiện tại mà KHÔNG tăng đếm (cho /status). */
function peekFatigue(userId) {
    const r = store.get(userId);
    if (!r) return 1;
    const count = (Date.now() - r.ts > config.FATIGUE.RESET_MS) ? 0 : r.count;
    return Math.max(config.FATIGUE.FLOOR, 1 - count * config.FATIGUE.STEP);
}

/** Giải trí/nghỉ ngơi -> giảm bớt độ mệt (giảm count). */
function restFatigue(userId, amount = 1) {
    const r = store.get(userId);
    if (r) { r.count = Math.max(0, r.count - amount); store.set(userId, r); }
}

/** Hồi sức hoàn toàn (vd khi /ngu). */
function resetFatigue(userId) {
    store.delete(userId);
}

module.exports = { fatigueMultiplier, restFatigue, resetFatigue, peekFatigue };
