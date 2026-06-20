// Dữ liệu hệ trồng cây: giống theo tier giá trị (trái/hoa), map -> item đầu ra, chi phí, thời gian.

// tier -> danh sách [tên, isFlower]
const TYPES = {
    1500: [['Chanh', false], ['Hoa Dại', true]],
    2000: [['Chuối', false], ['Bí Ngô', false], ['Hoa Xương Rồng', true], ['Hoa Cúc', true]],
    2500: [['Dưa Hấu', false], ['Táo', false], ['Hoa Anh Túc', true], ['Hoa Mai', true]],
    3000: [['Bơ', false], ['Nho', false], ['Hoa Hồng', true], ['Hoa Tulip', true]],
    3500: [['Dâu', false], ['Hoa Hướng Dương', true]],
};
const TIER_WEIGHTS = [[1500, 0.30], [2000, 0.28], [2500, 0.22], [3000, 0.14], [3500, 0.06]];

// BOX: giá mở Plantbox. Đặt 600 để EV (~476) ÂM nhẹ -> là sink chống lạm phát
// (giống pigbox), KHÔNG phải máy in tiền như bản 240 cũ.
const COST = { BUY: 500, FERT: 200, REVIVE: 1000, STEAL_FEE: 100, BOX: 600 };

const TIMINGS = {
    WATER_INTERVAL_MS: 3 * 60 * 60 * 1000, // 3h giữa các lần tưới
    DEAD_MS: 5 * 60 * 60 * 1000,           // bỏ tưới 5h -> chết
    HARVEST_MIN_MS: 60 * 60 * 1000,        // thu hoạch sau khi trưởng thành 1h
    STEAL_MIN_MS: 90 * 60 * 1000,          // trộm được sau 1h30 (nếu chủ chưa thu)
    PEST_MAX_MS: 4 * 60 * 60 * 1000,       // sau 4h chưa thu -> sâu bọ, mất trắng
};

const STEAL = { ENERGY: 15, SUCCESS: 0.5, FINE: 2000, JAIL_HOURS: 24, MAX_FAILS: 3 };

function randPlant() {
    const r = Math.random();
    let acc = 0, tier = 1500;
    for (const [t, w] of TIER_WEIGHTS) { acc += w; if (r < acc) { tier = t; break; } }
    const list = TYPES[tier];
    const [name, flower] = list[Math.floor(Math.random() * list.length)];
    return { name, tier, flower };
}

const produceId = (tier, flower) => (flower ? 'hoa_' : 'trai_') + tier;

module.exports = { TYPES, COST, TIMINGS, STEAL, randPlant, produceId };
