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

test('conditionMultiplier: lấy theo chỉ số tệ hơn (năng lượng vs sức khỏe)', () => {
    // Năng lượng đầy nhưng sức khỏe thấp -> bị sức khỏe kéo xuống
    const lowHealth = conditionMultiplier(config.ENERGY.MAX, 20);
    assert.ok(lowHealth < 1.0);
    // Cả hai đều thấp -> lấy cái thấp hơn
    const m = conditionMultiplier(config.ENERGY.MAX * 0.2, 40);
    const onlyEnergy = conditionFactor(0.2);
    const onlyHealth = conditionFactor(0.4);
    assert.strictEqual(m, Math.min(onlyEnergy, onlyHealth));
});

test('conditionMultiplier: không bao giờ thấp hơn FLOOR', () => {
    assert.ok(conditionMultiplier(0, 0) >= config.FATIGUE.FLOOR);
    assert.strictEqual(conditionMultiplier(0, 0), config.FATIGUE.FLOOR);
});
