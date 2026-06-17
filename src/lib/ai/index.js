// Lớp điều phối AI: chọn provider theo config, giữ ngữ cảnh theo kênh, chống spam.
const config = require('../../config');
const { WAGURI_SYSTEM_PROMPT } = require('./persona');

const providers = {
    gemini: require('./gemini'),
    claude: require('./claude'),
};

const contexts = new Map();  // channelId -> [{role,content}]
const cooldowns = new Map(); // userId -> timestamp hết cooldown

function getProvider() {
    const name = (config.AI.PROVIDER || 'gemini').toLowerCase();
    return providers[name] || providers.gemini;
}

/** True nếu user đang trong cooldown (đồng thời đặt cooldown mới). */
function onCooldown(userId) {
    const now = Date.now();
    if (now < (cooldowns.get(userId) || 0)) return true;
    cooldowns.set(userId, now + config.AI.USER_COOLDOWN_MS);
    return false;
}

/**
 * Trò chuyện với Waguri. Trả về câu trả lời, hoặc null nếu lỗi/chưa cấu hình.
 */
async function chatWithWaguri(channelId, userName, userText) {
    const provider = getProvider();
    let history = contexts.get(channelId) || [];
    const framed = `${userName}: ${userText}`;

    let reply;
    try {
        reply = await provider.chat(WAGURI_SYSTEM_PROMPT, history, framed);
    } catch (error) {
        console.error('[AI ERROR]', error.message);
        return null;
    }
    if (!reply) return null;

    // Cập nhật ngữ cảnh, cắt bớt và đảm bảo bắt đầu bằng 'user' (Gemini yêu cầu)
    history = [...history, { role: 'user', content: framed }, { role: 'assistant', content: reply }];
    const max = config.AI.MAX_CONTEXT_TURNS * 2;
    if (history.length > max) history = history.slice(history.length - max);
    if (history[0] && history[0].role === 'assistant') history = history.slice(1);
    contexts.set(channelId, history);

    return reply;
}

module.exports = { chatWithWaguri, onCooldown };
