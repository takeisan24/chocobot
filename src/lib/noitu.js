// Trò chơi nối từ tiếng Việt (state trong RAM theo kênh). Quy tắc: cụm 2 tiếng,
// tiếng đầu của cụm mới = tiếng cuối của cụm trước; không lặp; không đi 2 lượt liên tiếp.
// Không kiểm tra từ điển (giữ nhẹ) — chỉ kiểm tra quy tắc nối.

const games = new Map(); // channelId -> { lastWord, used:Set, lastPlayer, count }
const START = ['con cá', 'hoa hồng', 'bầu trời', 'mặt trời', 'học sinh', 'cà phê', 'nụ cười', 'dòng sông', 'mây trắng', 'bông lúa'];

function startGame(channelId) {
    const phrase = START[Math.floor(Math.random() * START.length)];
    const lastWord = phrase.split(' ')[1];
    games.set(channelId, { lastWord, used: new Set([phrase]), lastPlayer: null, count: 0 });
    return { phrase, lastWord };
}
function stopGame(channelId) {
    const g = games.get(channelId);
    games.delete(channelId);
    return g;
}
function getGame(channelId) {
    return games.get(channelId);
}

// Xử lý 1 tin nhắn cho ván đang chạy (gọi từ messageCreate). React theo kết quả.
async function handleMessage(message) {
    const g = games.get(message.channelId);
    if (!g) return;

    const content = message.content.trim().toLowerCase();
    const tokens = content.split(/\s+/);
    if (tokens.length !== 2) return;                 // chỉ xử lý cụm đúng 2 tiếng
    if (!/^\p{L}+$/u.test(tokens[0]) || !/^\p{L}+$/u.test(tokens[1])) return; // chỉ chữ cái

    if (tokens[0] !== g.lastWord) return message.react('❌').catch(() => {});  // sai tiếng nối
    if (g.used.has(content)) return message.react('♻️').catch(() => {});        // đã dùng
    if (g.lastPlayer === message.author.id) return message.react('⏳').catch(() => {}); // 2 lượt liên tiếp

    g.lastWord = tokens[1];
    g.used.add(content);
    g.lastPlayer = message.author.id;
    g.count++;
    message.react('✅').catch(() => {});
}

module.exports = { startGame, stopGame, getGame, handleMessage };
