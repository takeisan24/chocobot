const config = require('../config');

// Kiểm tra mức cược hợp lệ. Trả chuỗi lỗi (đã có giọng Waguri) hoặc null nếu OK.
function checkBet(bet) {
    if (!bet) return 'Số tiền cược không hợp lệ~ (nhập số, hoặc `all`)';
    if (bet < config.GAMBLE.MIN_BET) return `Cược tối thiểu **${config.GAMBLE.MIN_BET}** ${config.CURRENCY} nhé~`;
    if (bet > config.GAMBLE.MAX_BET) return `Cược tối đa **${config.GAMBLE.MAX_BET.toLocaleString('vi-VN')}** ${config.CURRENCY} thôi~`;
    return null;
}

module.exports = { checkBet };
