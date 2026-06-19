const db = require('../database.js');

// Sự kiện nhân thu nhập/EXP toàn cục, giữ trong RAM (nạp lúc khởi động).
let cache = { mult: 1, until: 0, name: null };

async function loadEvent() {
    const e = await db.getGameEvent();
    if (e) cache = { mult: Number(e.multiplier || 1), until: e.ends_at ? new Date(e.ends_at).getTime() : 0, name: e.name };
    return cache;
}

/** Hệ số nhân hiện tại (1 nếu không có sự kiện đang chạy). */
function getEventMult() {
    return (cache.until && Date.now() < cache.until) ? cache.mult : 1;
}

function getEventInfo() {
    const active = !!(cache.until && Date.now() < cache.until);
    return { active, mult: cache.mult, until: cache.until, name: cache.name };
}

async function setEvent(mult, hours, name) {
    const untilMs = Date.now() + hours * 3600000;
    await db.setGameEvent(mult, new Date(untilMs).toISOString(), name || null);
    cache = { mult, until: untilMs, name: name || null };
}

async function clearEvent() {
    await db.setGameEvent(1, null, null);
    cache = { mult: 1, until: 0, name: null };
}

module.exports = { loadEvent, getEventMult, getEventInfo, setEvent, clearEvent };
