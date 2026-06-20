// ============================================================
// scripts/backup-db.js — Sao lưu các bảng dữ liệu người chơi ra file JSON.
// ------------------------------------------------------------
// Dùng: node scripts/backup-db.js
//   -> tạo backups/backup-<thời-gian>.json (đã .gitignore).
// Nên đặt lịch chạy hằng ngày (Wispbyte scheduled task / cron / GitHub Actions).
// Phục hồi: nạp lại JSON vào Supabase (hoặc giữ làm ảnh chụp an toàn).
// ============================================================
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabase } = require('../src/database');

// Bảng dữ liệu động cần backup (bỏ items/jobs vì đã nằm trong migration seed).
const TABLES = [
    'users', 'inventory', 'cooldowns', 'achievements', 'quest_progress',
    'user_pets', 'pigs', 'plants', 'clans', 'loans', 'market_listings',
    'guild_settings', 'guild_members', 'daily_counters', 'game_event',
];

(async () => {
    const dump = {};
    for (const t of TABLES) {
        try {
            let rows = [], from = 0;
            const PAGE = 1000;
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const { data, error } = await supabase.from(t).select('*').range(from, from + PAGE - 1);
                if (error) throw error;
                rows.push(...data);
                if (data.length < PAGE) break;
                from += PAGE;
            }
            dump[t] = rows;
            console.log(`  ${t}: ${rows.length} dòng`);
        } catch (e) {
            console.warn(`  ! bỏ qua ${t}: ${e.message}`);
        }
    }
    const dir = path.join(__dirname, '..', 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(dir, `backup-${ts}.json`);
    fs.writeFileSync(file, JSON.stringify(dump));
    console.log(`\n✅ Đã backup -> ${file}`);
    process.exit(0);
})();
