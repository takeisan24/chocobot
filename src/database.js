const { createClient } = require('@supabase/supabase-js');

// 1. Tải các biến môi trường cấu hình Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('[ERROR] Thiếu cấu hình SUPABASE_URL hoặc SUPABASE_SERVICE_KEY trong file .env');
    process.exit(1);
}

// 2. Khởi tạo kết nối Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Lấy thông tin user (nếu chưa có thì tự động tạo mới với 0đ).
 * @param {string} userId - Discord ID của người dùng
 * @returns {object|null} - Thông tin người dùng
 */
async function getUser(userId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code === 'PGRST116') {
            // Lỗi PGRST116: Không tìm thấy dòng nào -> User mới, tự tạo.
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([{ user_id: userId }])
                .select()
                .single();
                
            if (insertError) throw insertError;
            return newUser;
        }

        if (error) throw error;
        return data;

    } catch (error) {
        console.error(`[DATABASE ERROR] Lỗi getUser(${userId}):`, error);
        return null;
    }
}

/**
 * Thêm / bớt tiền của người dùng.
 * @param {string} userId - Discord ID 
 * @param {number} amount - Số tiền (Âm để trừ tiền)
 * @param {string} type - 'wallet' (ví) hoặc 'bank' (ngân hàng)
 * @returns {boolean} - Trạng thái thành công
 */
async function addMoney(userId, amount, type = 'wallet') {
    try {
        const user = await getUser(userId);
        if (!user) return false;

        // Tính số tiền mới (dùng BigInt qua chuỗi để an toàn, hoặc dùng logic JS)
        // Vì CSDL là BigInt, trả ra API JS sẽ là string hoặc number nếu nhỏ.
        const currentMoney = Number(user[type]);
        const newMoney = currentMoney + amount;

        // Nếu trừ tiền thì không được để âm
        if (newMoney < 0) return false;

        const { error } = await supabase
            .from('users')
            .update({ [type]: newMoney })
            .eq('user_id', userId);

        if (error) throw error;
        return true;

    } catch (error) {
        console.error(`[DATABASE ERROR] Lỗi addMoney(${userId}):`, error);
        return false;
    }
}

/**
 * Thêm / bớt điểm kinh nghiệm.
 * @param {string} userId - Discord ID
 * @param {number} expAmount - Điểm EXP muốn cộng thêm
 */
async function updateExp(userId, expAmount) {
    try {
        const user = await getUser(userId);
        if (!user) return false;

        const newExp = Number(user.exp) + expAmount;

        const { error } = await supabase
            .from('users')
            .update({ exp: newExp })
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error(`[DATABASE ERROR] Lỗi updateExp():`, error);
        return false;
    }
}

/**
 * Kiểm tra xem người dùng có đang bị dính thời gian chờ (cooldown) hay không.
 * @param {string} userId - Discord ID
 * @param {string} command - Tên lệnh (vidu: 'work')
 * @returns {boolean|number} - Trả về false nếu KHÔNG BỊ COOLDOWN, trả về timestamp hết hạn nếu ĐANG BỊ.
 */
async function checkCooldown(userId, command) {
    try {
        const { data, error } = await supabase
            .from('cooldowns')
            .select('*')
            .eq('user_id', userId)
            .eq('command', command)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Bỏ qua lỗi ko tìm thấy dòng
        
        if (data) {
            const now = new Date();
            const expiresAt = new Date(data.expires_at);

            // Nếu thời điểm hiện tại nhỏ hơn hạn bị cấm -> Đang bị cooldown
            if (now < expiresAt) {
                return expiresAt.getTime();
            }
        }
        
        return false;

    } catch (error) {
        console.error(`[DATABASE ERROR] Lỗi checkCooldown():`, error);
        return false;
    }
}

/**
 * Thiết lập thời gian chờ (cooldown).
 * @param {string} userId - Discord ID
 * @param {string} command - Tên lệnh
 * @param {number} durationMinutes - Thời gian cấm (tính bằng phút)
 */
async function setCooldown(userId, command, durationMinutes) {
    try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + durationMinutes * 60000); // Đổi phút ra ms

        // Dùng upsert để nếu có sẵn thì update đè lên, chưa có thì insert.
        const { error } = await supabase
            .from('cooldowns')
            .upsert({ 
                user_id: userId, 
                command: command, 
                expires_at: expiresAt.toISOString() 
            }, { onConflict: 'user_id,command' });

        if (error) throw error;
        return true;

    } catch (error) {
        console.error(`[DATABASE ERROR] Lỗi setCooldown():`, error);
        return false;
    }
}

module.exports = {
    supabase,
    getUser,
    addMoney,
    updateExp,
    checkCooldown,
    setCooldown
};
