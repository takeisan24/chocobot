const test = require('node:test');
const assert = require('node:assert');
const { parseAmount } = require('../src/lib/amount');

test('parseAmount: hậu tố k/m/tr/ty', () => {
    assert.strictEqual(parseAmount('1000'), 1000);
    assert.strictEqual(parseAmount('1k'), 1000);
    assert.strictEqual(parseAmount('2m'), 2_000_000);
    assert.strictEqual(parseAmount('1tr'), 1_000_000);
    assert.strictEqual(parseAmount('1ty'), 1_000_000_000);
    assert.strictEqual(parseAmount('1.5k'), 1500);
});

test('parseAmount: "all" theo số dư', () => {
    assert.strictEqual(parseAmount('all', 500), 500);
    assert.strictEqual(parseAmount('hết', 1234), 1234);
    assert.strictEqual(parseAmount('all', 0), null);       // không có tiền
    assert.strictEqual(parseAmount('all'), null);          // thiếu max
});

test('parseAmount: đầu vào sai trả null', () => {
    assert.strictEqual(parseAmount('xyz'), null);
    assert.strictEqual(parseAmount('0'), null);
    assert.strictEqual(parseAmount('-5'), null);
    assert.strictEqual(parseAmount(null), null);
});
