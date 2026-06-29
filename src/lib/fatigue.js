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

/** Hệ số thu nhập do mệt: CHỈ theo NĂNG LƯỢNG.
 * (Sức khỏe KHÔNG phạt thu nhập — nó chỉ là cổng chặn hành động; máu chỉ giảm khi có bệnh.)
 * Vẫn giữ tham số `health` để không phá chữ ký các nơi đang gọi. */
function conditionMultiplier(energy, health, maxEnergy = config.ENERGY.MAX) {
    return conditionFactor(Number(energy) / maxEnergy);
}

module.exports = { conditionMultiplier, conditionFactor };
