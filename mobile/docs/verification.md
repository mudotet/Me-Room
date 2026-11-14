# Kiểm thử Me Room — 14/11/2026

## Nâng cấp Expo SDK 58

- Expo 58.0.25, React 19.3.0, React Native 0.88.1, TypeScript 6.0.3; các module Expo được đồng bộ bằng `expo install --fix`.
- Đăng ký config plugin `expo-asset`, `expo-font`, `expo-status-bar` theo yêu cầu SDK mới.
- Thay `StyleSheet.absoluteFillObject` bằng `StyleSheet.absoluteFill` để tương thích Strict TypeScript API.
- Góc nhìn thứ nhất kiểm tra kích thước cửa sổ thật để hiển thị hướng dẫn ngang khi hệ điều hành không thực hiện khóa hướng.
- `expo-doctor`: **20/20 đạt**. TypeScript đạt. **22/22 tests đạt**. Export Web và iOS/Hermes đạt.
- API trực tiếp bên dưới đã kiểm tra trước nâng cấp; lần nâng cấp không gọi lại scan/design hoặc gửi video. Tests API của lần này dùng mock/loopback.
- Chưa chạy simulator hoặc iPhone thật với SDK 58.

## API thật, dùng cấu hình từ `.env`

Lệnh: `node --import tsx scripts/test-api.mjs --full --video test-results/synthetic-room.mp4`.

| Yêu cầu | HTTP | Thời gian | Kiểm tra |
| --- | --- | --- | --- |
| `GET /health` | 200 | 40 ms | Trạng thái hợp lệ |
| `GET /openapi.json` | 200 | 19 ms | Xác nhận upload field `video`, thiết kế `{scene,prompt}` |
| `POST /scan` | 200 | 16.657 s | RoomScene hợp lệ |
| `POST /design` | 200 | 3.631 s | RoomScene hợp lệ, đầu vào từ lần scan trên |

Đầu vào là video đồ họa tổng hợp không âm thanh, không dùng bản ghi cá nhân. Kết quả xác nhận backend trả đúng hợp đồng trong lần gọi này; không đo độ chính xác dựng phòng thực tế. Địa chỉ máy chủ, nội dung phản hồi và khóa không được ghi vào báo cáo.

## Kiểm tra mã và bundle

- TypeScript: đạt (`npm.cmd run typecheck`).
- 22 tests Node đạt: hai bố cục, clone/freeze dữ liệu, đầu vào sai, màu/ID/kích thước, multipart video, lỗi HTTP/mạng, timeout, hủy request, retry, cập nhật thiết kế và script smoke qua máy chủ giả lập loopback.
- `expo install --check`: dependencies tương thích.
- Export Web: đạt.
- Export iOS/Hermes: đạt; đây không phải build IPA hoặc chạy simulator.
- Review độc lập phát hiện và đã sửa dấu quay trái/phải cùng khôi phục quyền camera sau khi quay lại từ Settings.
- Các đường dừng quay có xử lý lỗi đồng bộ để không ngăn hủy/đóng màn hình.

## Chưa xác nhận trên thiết bị

- Công cụ browser không khả dụng; điều khiển Brave bị dừng vì không xác định được URL đủ chắc chắn. Không có screenshot runtime hoặc kiểm chứng trực quan toàn bộ màn hình.
- Chưa chạy simulator hoặc iPhone vật lý: quay video, quyền camera, safe area, bàn phím, khóa ngang/dọc và tương tác GPU cần kiểm tra thật.
- Không có GLB được cung cấp; chưa kiểm tra textured GLB. Renderer hiện dùng hình khối dự phòng.
- Preflight CORS cho web (`OPTIONS /design`, origin localhost:8081) hết thời gian chờ; kiểm tra lại `/health` và OpenAPI vẫn trả 200. Các lần POST thành công bên trên là từ Node, chưa xác nhận API trong trình duyệt. Backend cần cho phép origin của bản web.

## Checklist iPhone khi có thiết bị

1. Cấp/từ chối quyền camera; mở Settings cấp lại và quay về ứng dụng.
2. Quay 5–15 giây không âm thanh, đổi camera, thử flash; hủy hoặc đưa app nền không được tự upload.
3. Gửi video thật được chủ sở hữu cho phép, thử mạng mất kết nối, hủy và retry.
4. Mở cả phòng ngủ và phòng khách, đổi góc 1 để khóa ngang rồi thoát để về dọc.
5. Kéo camera, zoom, tiến/lùi và quay trái/phải; kiểm tra nút không bị notch che.
6. Gửi chat thay màu/bố cục; scene mới cập nhật, phản hồi cũ không thay thế scene mới.
7. Kiểm tra bàn phím và VoiceOver; bổ sung GLB đã được cấp phép trước khi xác nhận tải texture.
