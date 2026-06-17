// Lấy URL ảnh ngẫu nhiên từ các API free (không cần key). Node 18+ có global fetch.
async function fetchJson(url) {
    const r = await fetch(url, { headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
}

async function cat() {
    const d = await fetchJson('https://api.thecatapi.com/v1/images/search');
    return d[0]?.url;
}
async function dog() {
    const d = await fetchJson('https://dog.ceo/api/breeds/image/random');
    return d.message;
}
async function waifu() {
    const d = await fetchJson('https://api.waifu.pics/sfw/waifu'); // SFW
    return d.url;
}

module.exports = { cat, dog, waifu };
