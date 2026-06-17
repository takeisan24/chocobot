// Kịch bản /work theo từng nghề. Placeholder: {amount} = số tiền, {job} = tên nghề.
// 3 nhóm: success (thắng), fail (xui), jackpot (trúng lớn). Thiếu nhóm nào -> dùng default.

module.exports = {
    default: {
        success: [
            '✅ Cậu chăm chỉ làm **{job}** và kiếm được **{amount}**.',
            '✅ Một ngày làm **{job}** suôn sẻ, bỏ túi **{amount}**.',
        ],
        fail: [
            '⚠️ Hôm nay làm **{job}** không suôn sẻ, cậu mất **{amount}**.',
            '⚠️ Xui ghê, làm **{job}** gặp trục trặc, đi mất **{amount}**.',
        ],
        jackpot: [
            '🤑 TRÚNG QUẢ ĐẬM! Làm **{job}** mà gặp may bất ngờ, hốt nguyên **{amount}**!',
        ],
    },
    nhat_ve_chai: {
        success: ['✅ Cậu lượm được mớ ve chai ngon, bán ve chai được **{amount}**.'],
        fail: ['⚠️ Bị đồng nghiệp tranh mất bãi rác ngon, hôm nay lỗ **{amount}**.'],
        jackpot: ['🤑 Nhặt được cái loa cũ còn xài tốt, bán lại lời to **{amount}**!'],
    },
    ban_tra_da: {
        success: ['✅ Cậu bán trà đá vỉa hè, khách đông nghịt, thu **{amount}**.'],
        fail: ['⚠️ Công an phường dẹp lòng lề đường, cậu ôm thùng đá chạy, mất **{amount}**.'],
        jackpot: ['🤑 Cả đội bóng ghé uống trà đá xem world cup, cậu trúng lớn **{amount}**!'],
    },
    phu_ho: {
        success: ['✅ Cậu trộn hồ xây tường cả ngày, nhận công **{amount}**.'],
        fail: ['⚠️ Lỡ tay làm đổ bao xi măng, bị trừ lương **{amount}**.'],
    },
    shipper: {
        success: ['✅ Cậu giao 20 đơn đúng giờ, khách bo thêm, được **{amount}**.'],
        fail: ['⚠️ Khách bom hàng 5 ly trà sữa, cậu ôm lỗ **{amount}**.'],
        jackpot: ['🤑 Giao đơn cho đại gia, được tip cực mạnh **{amount}**!'],
    },
    sinh_vien: {
        success: ['✅ Cậu làm thêm part-time ở quán, nhận lương **{amount}**.'],
        fail: ['⚠️ Mải làm thêm quên deadline, rớt môn, tốn tiền học lại **{amount}**.'],
    },
    xe_om: {
        success: ['✅ Cậu chạy một cuốc xe ôm từ Cầu Giấy qua Hai Bà Trưng, khách bo thêm. +**{amount}**.'],
        fail: ['⚠️ Trời mưa ế khách, lại còn thủng săm, mất **{amount}** tiền vá xe.'],
        jackpot: ['🤑 Trúng cuốc xe đường dài đi sân bay, khách boa hẳn **{amount}**!'],
    },
    tho_sua_xe: {
        success: ['✅ Cậu sửa cả chục cái xe, tay lấm dầu nhưng túi rủng rỉnh **{amount}**.'],
        fail: ['⚠️ Sửa nhầm làm hỏng máy khách, phải đền **{amount}**.'],
    },
    streamer: {
        success: ['✅ Buổi stream nay vui, donate đều tay, cậu nhận **{amount}**.'],
        fail: ['⚠️ Đang code dạo thì khu phố mất điện chưa kịp lưu stream. Mất **{amount}**.'],
        jackpot: ['🤑 Một mạnh thường quân donate cả chục triệu! Cậu hốt **{amount}**!'],
    },
    moi_gioi: {
        success: ['✅ Cậu chốt được căn chung cư, ăn hoa hồng **{amount}**.'],
        fail: ['⚠️ Khách bùng kèo phút chót, công cốc, lại mất phí cọc **{amount}**.'],
        jackpot: ['🤑 Bán được nguyên lô đất nền cho đại gia, hoa hồng khủng **{amount}**!'],
    },
    dev: {
        success: ['✅ Cậu fix xong con bug to, client duyệt, nhận **{amount}**.'],
        fail: ['⚠️ Đang code thì mất điện chưa kịp Ctrl+S, công sức bay sạch, lỗ **{amount}**.'],
        jackpot: ['🤑 Ship sản phẩm thành công, client thưởng nóng **{amount}**!'],
    },
    chu_tich: {
        success: ['✅ Cậu "chủ tịch" đi ký vài hợp đồng, nhẹ nhàng thu **{amount}**.'],
        fail: ['⚠️ Bị lộ là chủ tịch giả danh, mất mặt và mất luôn **{amount}**.'],
        jackpot: ['🤑 Thương vụ thế kỷ chốt thành công, cậu đút túi **{amount}**!'],
    },
    dai_gia: {
        success: ['✅ Dự án bất động sản sinh lời, cậu ung dung nhận **{amount}**.'],
        fail: ['⚠️ Thị trường đóng băng, một dự án lỗ nặng **{amount}**.'],
        jackpot: ['🤑 Sốt đất! Cả khu đất của cậu tăng giá gấp bội, lời **{amount}**!'],
    },
};
