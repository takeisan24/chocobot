# Deploy bot Choco 24/7 trên Koyeb (Free)

Deploy thẳng từ GitHub repo `takeisan24/chocobot` — không SSH, không pm2, env vars gõ trên web.
Mỗi lần `git push` về sau Koyeb **tự build lại**.

---

## ⚠️ Bước 0 — Kiểm tra TRƯỚC (hay là lý do bot "không lên")

1. **Bật Privileged Intent trên Discord:** Bot dùng `MessageContent` (privileged). Nếu chưa bật, bot sẽ **crash khi login** với lỗi *"Used disallowed intents"*.
   → Vào https://discord.com/developers/applications → chọn app → **Bot** → bật **MESSAGE CONTENT INTENT** (và SERVER MEMBERS INTENT nếu cần) → Save.

2. **Có sẵn 4 biến môi trường** (lấy từ `.env` máy bạn): `DISCORD_TOKEN`, `CLIENT_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.

> 💡 Bot đã có Express server (`index.js`) lắng nghe `process.env.PORT` → đây **chính là HTTP health-check mà Koyeb cần**. Không cần sửa code.

---

## A. Tạo service trên Koyeb

1. Vào https://www.koyeb.com → **Sign up bằng GitHub** (không cần thẻ tín dụng).
2. **Create Web Service** → chọn **GitHub** → cho phép Koyeb truy cập repo → chọn **`takeisan24/chocobot`**, branch **`master`**.
3. **Instance:** chọn **Free** (`eco` / nano, 512MB) — dư cho bot này.
4. **Region:** chọn **Singapore** (gần Supabase `ap-southeast-1` cho nhanh).
5. **Builder:** để **Buildpack** (Koyeb tự nhận Node, chạy `npm ci` rồi `npm start`). Không cần Dockerfile.

---

## B. Cấu hình Environment variables

Trong phần **Environment variables**, thêm (bấm "secret" cho các giá trị nhạy cảm):

| Key | Value |
|---|---|
| `DISCORD_TOKEN` | (token bot của bạn) |
| `CLIENT_ID` | (application/client ID) |
| `SUPABASE_URL` | `https://kuvlkaxregnanhzgqrbp.supabase.co` |
| `SUPABASE_SERVICE_KEY` | (service_role key) |

> **KHÔNG** cần đặt `PORT` — Koyeb tự cấp (mặc định 8000) và code tự nhận qua `process.env.PORT`.

---

## C. Cấu hình Port / Health check

- **Exposed port:** `8000` (mặc định Koyeb). Code sẽ lắng nghe đúng cổng này nhờ `process.env.PORT`.
- **Health check:** HTTP path `/` (Express trả 200 "Tín hiệu mạng..."). Để mặc định là được.

Bấm **Deploy**.

---

## D. Kiểm tra bot đã lên

Mở tab **Logs** trên Koyeb, chờ build xong. Thành công khi thấy:
```
[HTTP SERVER] Web server đang chạy ở port 8000
Ready! Logged in as <tên-bot>#0000
[SYSTEM] Đã tự động đăng ký lệnh xong! ...
```
Vào Discord gõ `/ping` → bot trả `Pong!` là chạy ngon. 🎉

---

## E. Nếu bot bị "ngủ" (scale-to-zero) trên free tier

Koyeb free có thể tạm dừng service khi không có traffic HTTP. Nếu gặp (bot delay/offline lúc rảnh):
- **Cách 1 (khuyên dùng):** trong Settings của service, đặt **Autoscaling min = 1** (không cho về 0) nếu plan cho phép.
- **Cách 2 (dự phòng):** dùng **UptimeRobot** miễn phí ping URL công khai Koyeb (vd `https://choco-xxx.koyeb.app/`) mỗi 5 phút để giữ thức. (Đây là lý do giữ lại Express server.)

---

## F. Cập nhật bot sau này
Chỉ cần ở máy local:
```bash
git add -A && git commit -m "..." && git push
```
Koyeb tự động build lại bản mới. Xong.

---

## Phụ lục — vì sao không chọn cách khác
- **Render free:** ngủ sau 15 phút → bot offline. Tránh.
- **Oracle Cloud Free:** mạnh & không ngủ nhưng phải SSH + pm2 (lằng nhằng) — xem lịch sử git nếu cần.
- **Fly.io:** free tier đã ngừng với tài khoản mới (2026).
