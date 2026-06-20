const config = require('../config');

// ============================================================
// lib/fatigue.js — Hệ số "mệt" suy ra TRỰC TIẾP từ tình trạng người chơi
// (năng lượng + sức khỏe), thay cho cách đếm số lần làm liên tiếp.
//   - Còn >= THRESHOLD (50%) cả năng lượng LẪN sức khỏe -> thu nhập 100%.
//   - Tụt dưới THRESHOLD -> thu nhập giảm tuyến tính, tối đa chỉ còn FLOOR.
//   - Lấy theo chỉ số TỆ HƠN giữa năng lượng và sức khỏe.
// Hàm thuần (không giữ state) -> dễ test, gắn liền tài nguyên người chơi.
// ============================================================

/** Hệ số theo 1 tỉ lệ 0..1 (năng lượng% hoặc sức khỏe%). */
function conditionFactor(ratio) {
    const { THRESHOLD, FLOOR } = config.FATIGUE;
    const r = Math.max(0, Math.min(1, Number(ratio) || 0));
    if (r >= THRESHOLD) return 1;
    return FLOOR + (1 - FLOOR) * (r / THRESHOLD); // 0 -> FLOOR, THRESHOLD -> 1.0
}

/** Hệ số thu nhập do mệt: lấy theo chỉ số tệ hơn giữa năng lượng & sức khỏe. */
function conditionMultiplier(energy, health, maxEnergy = config.ENERGY.MAX) {
    const e = conditionFactor(Number(energy) / maxEnergy);
    const h = conditionFactor(Number(health ?? 100) / 100);
    return Math.min(e, h);
}

module.exports = { conditionMultiplier, conditionFactor };
