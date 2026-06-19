const test = require('node:test');
const assert = require('node:assert');
const config = require('../src/config');

test('Sprint 3: Vehicle configurations and cost validation', () => {
    assert.ok(config.VEHICLES);
    assert.strictEqual(config.VEHICLES.xe_wave.energy_cost, 8);
    assert.strictEqual(config.VEHICLES.xe_sh.energy_cost, 6);
    assert.strictEqual(config.VEHICLES.o_to_vinfast.energy_cost, 4);
    assert.strictEqual(config.VEHICLES.xe_wave.name, 'Xe Honda Wave');
    assert.strictEqual(config.VEHICLES.xe_sh.name, 'Xe Vespa Hồng Cute');
    assert.strictEqual(config.VEHICLES.o_to_vinfast.name, 'Ô tô VinFast VF3');
});

test('Sprint 3: Vehicle selection priority logic', () => {
    // Giả lập logic tìm phương tiện tốt nhất trong kho đồ
    function getBestVehicle(inv) {
        const vehicles = inv.filter(i => ['o_to_vinfast', 'xe_sh', 'xe_wave'].includes(i.item_id));
        let bestVehicleId = null;
        if (vehicles.length > 0) {
            if (vehicles.some(v => v.item_id === 'o_to_vinfast')) bestVehicleId = 'o_to_vinfast';
            else if (vehicles.some(v => v.item_id === 'xe_sh')) bestVehicleId = 'xe_sh';
            else if (vehicles.some(v => v.item_id === 'xe_wave')) bestVehicleId = 'xe_wave';
        }
        return bestVehicleId;
    }

    const inv1 = [{ item_id: 'xe_wave' }, { item_id: 'xe_sh' }];
    assert.strictEqual(getBestVehicle(inv1), 'xe_sh');

    const inv2 = [{ item_id: 'xe_wave' }, { item_id: 'o_to_vinfast' }, { item_id: 'xe_sh' }];
    assert.strictEqual(getBestVehicle(inv2), 'o_to_vinfast');

    const inv3 = [{ item_id: 'can_cau' }];
    assert.strictEqual(getBestVehicle(inv3), null);
});
