const test = require('node:test');
const assert = require('node:assert');
const { solar2lunar, canChiYear, canChiDay, gioHoangDao } = require('../src/lib/amlich');

test('âm lịch: Tết Giáp Ngọ (dương 31/1/2014 = âm 1/1/2014)', () => {
    const L = solar2lunar(31, 1, 2014);
    assert.strictEqual(L.day, 1);
    assert.strictEqual(L.month, 1);
    assert.strictEqual(L.year, 2014);
    assert.strictEqual(canChiYear(L.year), 'Giáp Ngọ');
});

test('âm lịch: Tết Giáp Thìn (dương 10/2/2024 = âm 1/1/2024)', () => {
    const L = solar2lunar(10, 2, 2024);
    assert.strictEqual(L.day, 1);
    assert.strictEqual(L.month, 1);
    assert.strictEqual(canChiYear(L.year), 'Giáp Thìn');
});

test('âm lịch: can-chi ngày & giờ hoàng đạo trả về hợp lệ', () => {
    const L = solar2lunar(21, 6, 2026);
    assert.match(canChiDay(L.jd), /^[A-Za-zÀ-ỹ]+ [A-Za-zÀ-ỹ]+$/u);
    const gio = gioHoangDao(L.jd);
    assert.ok(Array.isArray(gio) && gio.length >= 1 && gio.length <= 12);
});
