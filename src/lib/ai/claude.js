// Provider AI: Claude (Anthropic). Tùy chọn — bật bằng AI_PROVIDER=claude.
// Cần: npm i @anthropic-ai/sdk  + ANTHROPIC_API_KEY
const config = require('../../config');

let client = null;
function getClient() {
    if (!process.env.ANTHROPIC_API_KEY) return null;
    if (!client) {
        let Anthropic;
        try {
            Anthropic = require('@anthropic-ai/sdk');
        } catch {
            throw new Error('Chưa cài @anthropic-ai/sdk — chạy: npm i @anthropic-ai/sdk');
        }
        client = new Anthropic(); // đọc ANTHROPIC_API_KEY từ env
    }
    return client;
}

/**
 * @param {string} systemPrompt
 * @param {{role:'user'|'assistant', content:string}[]} history
 * @param {string} userText
 * @returns {Promise<string>}
 */
async function chat(systemPrompt, history, userText) {
    const c = getClient();
    if (!c) throw new Error('Thiếu ANTHROPIC_API_KEY');

    const messages = [
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userText },
    ];

    const resp = await c.messages.create({
        model: config.AI.CLAUDE_MODEL,
        max_tokens: config.AI.MAX_OUTPUT_TOKENS,
        system: systemPrompt,
        messages,
    });

    return resp.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
}

module.exports = { chat };
