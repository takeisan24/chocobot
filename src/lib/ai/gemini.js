// Provider AI: Google Gemini (free tier). SDK: @google/generative-ai
const config = require('../../config');

let genAI = null;
function getClient() {
    if (!process.env.GEMINI_API_KEY) return null;
    if (!genAI) {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAI;
}

/**
 * @param {string} systemPrompt
 * @param {{role:'user'|'assistant', content:string}[]} history
 * @param {string} userText
 * @returns {Promise<string>}
 */
async function chat(systemPrompt, history, userText) {
    const ai = getClient();
    if (!ai) throw new Error('Thiếu GEMINI_API_KEY');

    const model = ai.getGenerativeModel({
        model: config.AI.GEMINI_MODEL,
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: config.AI.MAX_OUTPUT_TOKENS, temperature: 0.9 },
    });

    const geminiHistory = history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
    }));

    const session = model.startChat({ history: geminiHistory });
    const result = await session.sendMessage(userText);
    return result.response.text();
}

module.exports = { chat };
