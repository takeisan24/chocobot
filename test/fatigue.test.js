const test = require('node:test');
const assert = require('node:assert');
const { conditionMultiplier, conditionFactor } = require('../src/lib/fatigue');
const config = require('../src/config');

test('conditionFactor: >= THRESHOLD -> 1.0, dưới ngưỡng giảm dần về FLOOR', () => {
    const { THRESHOLD, FLOOR } = config.FATIGUE;
    assert.strictEqual(conditionFactor(1.0), 1.0);
    assert.strictEqual(conditionFactor(THRESHOLD), 1.0);     // đúng ngưỡng vẫn full
    assert.strictEqual(conditionFactor(0), FLOOR);            // cạn kiệt -> đáy
    // Giữa 0 và THRESHOLD: tuyến tính
    const mid = conditionFactor(THRESHOLD / 2);
    assert.ok(mid > FLOOR && mid < 1.0);
    assert.ok(Math.abs(mid - (FLOOR + (1 - FLOOR) * 0.5)) < 1e-9);
});

test('conditionMultiplier: năng lượng cao + khỏe -> 100%, không phạt oan', () => {
    // Năng lượng 90/100, sức khỏe 100 -> không giảm gì
    assert.strictEqual(conditionMultiplier(90, 100), 1.0);
    // Đúng ngưỡng 50% năng lượng -> vẫn full
    assert.strictEqual(conditionMultiplier(config.ENERGY.MAX * 0.5, 100), 1.0);
});

test('conditionMultiplier: CHỈ theo năng lượng (sức khỏe không phạt thu nhập)', () => {
    // Năng lượng đầy, sức khỏe thấp -> KHÔNG bị phạt (sức khỏe chỉ là cổng chặn, không trừ tiền)
    assert.strictEqual(conditionMultiplier(config.ENERGY.MAX, 20), 1.0);
    // Chỉ năng lượng quyết định hệ số
    const m = conditionMultiplier(config.ENERGY.MAX * 0.2, 40);
    assert.strictEqual(m, conditionFactor(0.2));
});

test('conditionMultiplier: không bao giờ thấp hơn FLOOR', () => {
    assert.ok(conditionMultiplier(0, 0) >= config.FATIGUE.FLOOR);
    assert.strictEqual(conditionMultiplier(0, 0), config.FATIGUE.FLOOR);
});
