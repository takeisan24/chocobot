// ============================================================
// scripts/build-support-server.js — Thiết lập SERVER HỖ TRỢ, ƯU TIÊN TÁI DÙNG kênh có sẵn.
// ------------------------------------------------------------
// Triết lý: KHÔNG tạo bừa kênh mới. Với mỗi "vai trò kênh" (rules, hướng dẫn, ...),
// script sẽ:  (1) dùng ID bạn map sẵn  ->  (2) tự dò kênh có tên giống (alias)
//          -> (3) chỉ TẠO MỚI nếu bạn bật CREATE_MISSING.
// Nội dung mẫu CHỈ đăng vào kênh đang TRỐNG (0 tin nhắn) -> không spam kênh đang dùng.
//
// CÁCH DÙNG:
//   1) Mời Waguri vào server, tạm cấp ADMINISTRATOR (cho Community + đăng bài).
//   2) (Tuỳ chọn) Điền ID kênh có sẵn vào USE_EXISTING bên dưới cho chắc ăn.
//   3) Chạy XEM TRƯỚC:  node scripts/build-support-server.js <SERVER_ID>
//      -> in ra "sẽ dùng kênh nào cho vai trò nào", KHÔNG đổi gì (DRY_RUN=true).
//   4) Ưng rồi: đặt DRY_RUN=false (dòng dưới) rồi chạy lại để làm thật.
// ============================================================
require('dotenv').config();
const {
    Client, GatewayIntentBits, ChannelType, EmbedBuilder,
    GuildVerificationLevel, GuildExplicitContentFilter,
} = require('discord.js');
const config = require('../src/config');

// ====================== TUỲ CHỈNH ======================
const DRY_RUN = true;          // true = chỉ xem trước, không đổi gì. Đổi false để làm thật.
const CREATE_MISSING = false;  // true = tự tạo kênh cho vai trò không tìm thấy. false = chỉ tái dùng.
const ENABLE_COMMUNITY = true; // bật Community (cần rules + updates).

// Dán ID kênh CÓ SẴN để ép dùng (để trống "" = tự dò theo tên). Bật Developer Mode -> chuột phải kênh -> Copy ID.
const USE_EXISTING = {
    rules: '', updates: '', guide: '', links: '', announce: '',
    chat: '', support: '', bug: '', suggest: '', logs: '',
};
// =======================================================

const GUILD_ID = process.argv[2] || process.env.SUPPORT_GUILD_ID;
if (!GUILD_ID) { console.error('❌ Thiếu Server ID. Dùng: node scripts/build-support-server.js <SERVER_ID>'); process.exit(1); }
if (!process.env.DISCORD_TOKEN) { console.error('❌ Thiếu DISCORD_TOKEN trong .env'); process.exit(1); }

const PINK = config.COLORS.INFO;

// Mỗi vai trò: alias để dò tên kênh + có cần tạo mới khi thiếu không.
const TARGETS = {
    rules:    { aliases: ['luật', 'luat', 'rule', 'nội-quy', 'noi-quy', 'quy-định', 'quy-dinh'] },
    updates:  { aliases: ['mod-update', 'community-update', 'cập-nhật', 'mod-log'], forceCreateForCommunity: true },
    guide:    { aliases: ['hướng-dẫn', 'huong-dan', 'guide', 'how-to', 'huongdan'] },
    links:    { aliases: ['liên-kết', 'lien-ket', 'link'] },
    announce: { aliases: ['thông-báo', 'thong-bao', 'announce', 'tin-tức', 'tin-tuc'] },
    chat:     { aliases: ['chat-chung', 'general', 'chung', 'tổng', 'sảnh', 'main'] },
    support:  { aliases: ['hỗ-trợ', 'ho-tro', 'support', 'help', 'giúp-đỡ'] },
    bug:      { aliases: ['báo-lỗi', 'bao-loi', 'bug', 'report', 'lỗi'] },
    suggest:  { aliases: ['góp-ý', 'gop-y', 'suggest', 'feedback', 'đề-xuất'] },
    logs:     { aliases: ['log', 'nhật-ký', 'nhat-ky'] },
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`Đăng nhập: ${client.user.tag}`);
    const botId = client.user.id;
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${botId}&permissions=1099512007760&scope=bot+applications.commands`;
    const voteUrl = `https://top.gg/bot/${botId}/vote`;
    const topggUrl = `https://top.gg/bot/${botId}`;

    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        await guild.channels.fetch();
        console.log(`\n🏗️  Server: ${guild.name}  ${DRY_RUN ? '【XEM TRƯỚC — không đổi gì】' : '【LÀM THẬT】'}\n`);

        const isText = c => c && (c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement);

        // --- Phân giải kênh cho từng vai trò ---
        const resolved = {};   // key -> channel (đang có)
        const toCreate = [];   // key cần tạo mới
        for (const [key, def] of Object.entries(TARGETS)) {
            let ch = null;
            const id = USE_EXISTING[key];
            if (id) ch = guild.channels.cache.get(id) || null;
            if (!ch) ch = guild.channels.cache.find(c => isText(c) && def.aliases.some(a => c.name.toLowerCase().includes(a))) || null;

            if (ch) { resolved[key] = ch; console.log(`  ✓ ${key.padEnd(9)} -> #${ch.name}`); continue; }

            const needForCommunity = ENABLE_COMMUNITY && def.forceCreateForCommunity;
            if (CREATE_MISSING || needForCommunity) { toCreate.push(key); console.log(`  + ${key.padEnd(9)} -> (sẽ TẠO MỚI${needForCommunity ? ' — cần cho Community' : ''})`); }
            else console.log(`  – ${key.padEnd(9)} -> (không tìm thấy, bỏ qua)`);
        }

        if (DRY_RUN) {
            console.log('\n👀 Đây là XEM TRƯỚC. Nếu ổn: mở file sửa DRY_RUN=false rồi chạy lại để áp dụng.');
            console.log('   (Muốn ép dùng kênh cụ thể thì điền ID vào USE_EXISTING; muốn tạo kênh thiếu thì bật CREATE_MISSING.)');
            return;
        }

        // --- Tạo các kênh thiếu (nếu được phép) ---
        for (const key of toCreate) {
            const name = key === 'updates' ? 'mod-updates' : key;
            const ch = await guild.channels.create({ name, type: ChannelType.GuildText });
            resolved[key] = ch;
            console.log(`  + Đã tạo #${ch.name}`);
        }

        // --- Bật Community (nếu có rules + updates) ---
        if (ENABLE_COMMUNITY && !guild.features.includes('COMMUNITY') && resolved.rules && resolved.updates) {
            try {
                await guild.edit({
                    features: [...guild.features, 'COMMUNITY'],
                    rulesChannel: resolved.rules.id,
                    publicUpdatesChannel: resolved.updates.id,
                    verificationLevel: GuildVerificationLevel.Medium,
                    explicitContentFilter: GuildExplicitContentFilter.AllMembers,
                    description: 'Server hỗ trợ chính thức của Waguri 🌸',
                    reason: 'Enable Community',
                });
                console.log(`\n✅ Đã bật Community (rules=#${resolved.rules.name}, updates=#${resolved.updates.name}).`);
            } catch (e) {
                console.warn('\n! Không bật được Community (cần Manage Server):', e.message);
            }
        } else if (ENABLE_COMMUNITY && guild.features.includes('COMMUNITY')) {
            console.log('\n= Community đã bật sẵn.');
        }

        // --- Đăng nội dung mẫu (CHỈ vào kênh đang trống) ---
        const E = (title, desc) => new EmbedBuilder().setColor(PINK).setTitle(title).setDescription(desc);
        const CONTENT = {
            rules: { pin: true, embed: E('📜・Nội quy server', ['1️⃣ Tôn trọng mọi người.', '2️⃣ Không spam/quảng cáo/link độc hại.', '3️⃣ Đăng đúng kênh (hỏi ở hỗ trợ, lỗi ở báo lỗi).', '4️⃣ Nội dung lành mạnh.', '5️⃣ Nghe Mod/Admin.', '', 'Tuân thủ Điều khoản & Hướng dẫn cộng đồng Discord 🌸'].join('\n')) },
            guide: { pin: true, embed: E('🌸・Bắt đầu với Waguri', ['• `/help` — tất cả lệnh', '• `/daily` điểm danh · `/work` kiếm tiền', '• `/shop` `/buy` · `/leaderboard`', '• `/taixiu` `/masoi`… minigame', '• `@Waguri` / `/ask` trò chuyện 💬', '• `/vote` nhận thưởng 💝', '', `*Dùng được prefix \`${config.PREFIX}\`.*`].join('\n')) },
            links: { embed: E('🔗・Liên kết', [`➕ **[Mời Waguri](${inviteUrl})**`, `🗳️ **[Vote Top.gg](${voteUrl})**`, `⭐ **[Trang Top.gg](${topggUrl})**`, '', '*(Thêm link Privacy/Terms khi web deploy.)*'].join('\n')) },
            announce: { embed: E('🎉・Waguri đã có mặt!', ['Chào mừng đến nhà của **Waguri Kaoruko** 🍰', 'Server hỗ trợ chính thức — cập nhật, trợ giúp, giao lưu.', '', `➕ [Mời bot](${inviteUrl}) · 🗳️ [Vote](${voteUrl})`].join('\n')) },
            chat: { embed: E('🌸・Chào mừng!', 'Cứ thoải mái trò chuyện nhé~ Có gì cần giúp thì ghé kênh hỗ trợ! 💕') },
            support: { embed: E('🛟・Cần giúp đỡ?', 'Mô tả vấn đề **rõ ràng** (kèm ảnh nếu có) — Mod & cộng đồng sẽ hỗ trợ sớm nhất 🌸') },
            bug: { embed: E('🐛・Báo lỗi', ['```', 'Lệnh bị lỗi: /...', 'Mình đã làm gì: ...', 'Mong đợi vs thực tế: ...', 'Ảnh/log: ...', '```'].join('\n')) },
            suggest: { embed: E('💡・Góp ý', 'Muốn Waguri có thêm gì? Chia sẻ ở đây nhé — mình trân trọng mọi ý tưởng! ✨') },
        };
        for (const [key, c] of Object.entries(CONTENT)) {
            const ch = resolved[key];
            if (!ch) continue;
            try {
                const recent = await ch.messages.fetch({ limit: 1 });
                if (recent.size > 0) { console.log(`    = #${ch.name} đã có tin nhắn -> không đăng (giữ nguyên).`); continue; }
                const msg = await ch.send({ embeds: [c.embed] });
                if (c.pin) await msg.pin().catch(() => {});
                console.log(`    ✎ đã đăng vào #${ch.name}`);
            } catch (e) { console.warn(`    ! không đăng được vào #${ch.name}: ${e.message}`); }
        }

        console.log('\n✅ Xong! Còn lại làm tay: invite vĩnh viễn -> Top.gg + env SUPPORT_INVITE; webhook #logs -> env LOG_WEBHOOK_URL; gỡ Administrator tạm.');
    } catch (e) {
        console.error('❌ Lỗi:', e?.message || e);
    } finally {
        client.destroy();
        process.exit(0);
    }
});

client.login(process.env.DISCORD_TOKEN);
