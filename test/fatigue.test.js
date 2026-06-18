const test = require('node:test');
const assert = require('node:assert');
const { fatigueMultiplier } = require('../src/lib/fatigue');
const config = require('../src/config');

test('fatigueMultiplier: gradual decay and multiplier correctness', async () => {
    const userId = 'test_user_fatigue';

    // Lần đầu chạy: không có mệt mỏi (1.0)
    const f1 = fatigueMultiplier(userId);
    assert.strictEqual(f1, 1.0);

    // Lần hai chạy ngay lập tức: mệt mỏi tăng 1 nấc (-5%)
    const f2 = fatigueMultiplier(userId);
    assert.ok(f2 < 1.0);
    assert.strictEqual(f2, 1.0 - config.FATIGUE.STEP);

    // Lần ba chạy ngay lập tức: mệt mỏi tăng tiếp
    const f3 = fatigueMultiplier(userId);
    assert.strictEqual(f3, 1.0 - 2 * config.FATIGUE.STEP);
});
