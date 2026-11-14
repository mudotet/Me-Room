# Me Room

Ứng dụng Expo bằng TypeScript, chuyển thiết kế trong `main.zip` và năm ảnh tham chiếu sang mobile. Header dùng **Me Room**. Trợ lý giữ tên **Roomie**.

## Chạy dự án

Yêu cầu Node.js 22.13+ (đã kiểm tra bằng Node 24.12), npm và thiết bị/Expo Go tương thích SDK 58. Windows dùng `npm.cmd` và `npx.cmd` nếu PowerShell chặn `npm.ps1`.

```powershell
npm.cmd ci
npm.cmd start
```

Mở QR bằng Expo Go tương thích hoặc dùng development build. iOS development build cần macOS/Xcode hoặc quy trình build riêng; chưa tạo IPA trong tác vụ này.

Xem bản web:

```powershell
npm.cmd run web
```

Native dùng camera thật; bản web cho chọn video có sẵn. Trình duyệt cần WebGL để xem phòng 3D.
Để gọi API từ web, backend phải cho phép origin của trang (khi chạy mặc định: `http://localhost:8081`) qua CORS. Native không dùng cơ chế CORS của trình duyệt.

## Cấu hình API

Tạo `.env` trong `mobile/` dựa trên `.env.example`:

```dotenv
API_BASE_URL=http://192.168.1.100:8000
```

Dùng địa chỉ backend thật. Khi chạy trên điện thoại, `localhost` là điện thoại, không phải máy tính. Hai thiết bị cần truy cập được cùng backend. Khởi động lại Expo sau khi đổi `.env`. Bản build phát hành nên dùng HTTPS; cấu hình HTTP nội bộ cần được kiểm tra trên thiết bị đích.

Chỉ địa chỉ API được đưa vào `extra.apiBaseUrl`; `.env` được Git bỏ qua. Không đặt khóa OpenAI trong ứng dụng hoặc biến `EXPO_PUBLIC_*`.

Hợp đồng đã đối chiếu với OpenAPI của backend được cấu hình ngày 14/11/2026:

| Endpoint | Dữ liệu | Kết quả |
| --- | --- | --- |
| `GET /health` | Không có | JSON `status: ok` hoặc `healthy` |
| `POST /scan` | Multipart `video` (MP4/MOV/WebM) | `RoomScene` |
| `POST /design` | JSON `{scene, prompt}` | `RoomScene` |

Client cũng chấp nhận `{scene, message?}`. Video native quay 5–15 giây, 720p, không thu âm. Video được chọn từ thư viện có thể chứa âm thanh; giao diện thông báo trước khi gửi. Giới hạn client là 50 MB. Upload chỉ diễn ra sau khi người dùng quay/chọn video. Thời hạn quét 120 giây, thiết kế 60 giây; có hủy và thử lại, không tự thay bằng dữ liệu mẫu khi lỗi.

## Các màn hình

- **Trang chủ:** logo Me Room, thẻ Roomie màu tím, hai phòng mẫu có nhãn rõ ràng, thông báo và điều hướng.
- **Quét phòng:** xin quyền camera, quay/dừng, đèn flash, đổi camera, chọn video; khôi phục quyền khi quay lại từ Settings.
- **Đang xử lý:** vòng tải, hủy, lỗi và thử lại; không hiển thị phần trăm giả.
- **Phòng 3D:** góc 3 dọc, kéo để xoay và nút zoom; góc 1 khóa ngang trên native, kéo để nhìn và giữ mũi tên để di chuyển. Thoát sẽ trở lại dọc. Bản web dùng khung ngang, tự xoay khung xem trên màn hình hẹp.
- **Chat:** gửi yêu cầu thiết kế, nhận scene mới và cập nhật React state. Request bị hủy hoặc cũ không được ghi đè scene hiện tại.
- **Hồ sơ:** hướng dẫn và trạng thái kết nối, chưa có tài khoản hoặc đồng bộ lịch sử.

## Cấu trúc

`app/App.tsx` quản lý điều hướng/state; `app/screens` chứa giao diện; `app/api.ts` gọi API; `app/scene.ts` kiểm tra dữ liệu; `components/Room3D` sở hữu renderer, ánh sáng và điều khiển camera. Một Expo project, một manifest. Metro đọc fixture chuẩn từ `../shared/example.json`; phòng khách là fixture tổng hợp thứ hai.

`Room3D` nhận `sceneData` bất biến, dùng R3F native và adapter web trong cùng project. Chưa có GLB trong nguồn được cung cấp: nội thất dùng hình khối dự phòng, không tải URL model từ phản hồi API. Xem `components/Room3D/README.md`.

## Kiểm tra

```powershell
npm.cmd run typecheck
npm.cmd test
npx.cmd expo install --check
npm.cmd run export:web
npm.cmd run export:ios
npm.cmd run test:api
```

`export:ios` tạo JavaScript/Hermes bundle, không phải bằng chứng chạy trên iPhone. Export được lưu riêng trong `dist/web` và `dist/ios`.

Smoke đầy đủ chỉ dùng video tổng hợp tại đường dẫn được giới hạn:

```powershell
npm.cmd run test:api -- --full --video test-results/synthetic-room.mp4
```

Video tổng hợp đã được tạo tại đường dẫn trên trong workspace này; không được commit. Khi clone mới, có thể dùng FFmpeg để tạo clip 6 giây không có dữ liệu riêng tư rồi đặt đúng tên. Không trỏ script vào bản ghi cá nhân. Nếu không truyền video, script vẫn thử `/design` bằng fixture và báo kết quả một phần. Script không in địa chỉ backend, secrets hoặc nội dung phản hồi.

Kết quả và giới hạn kiểm thử: [docs/verification.md](docs/verification.md).

Phiên bản đã nâng cấp và xác nhận: Expo 58.0.25, React 19.3.0, React Native 0.88.1, R3F 9.8.2, TypeScript 6.0.3. Chạy `npm.cmd start -- --clear` lần đầu sau nâng cấp để xóa cache Metro cũ. Development build cũ cần được build lại cho SDK 58.

Trên iOS 27, cửa sổ có thể thay đổi kích thước và hệ điều hành có thể không thực hiện yêu cầu khóa ngang. App vẫn yêu cầu góc 1 ngang, đồng thời kiểm tra kích thước cửa sổ thật và hướng dẫn xoay/mở rộng cửa sổ khi cần. Tham chiếu: [Expo SDK 58](https://expo.dev/changelog/sdk-58), [R3F native](https://r3f.docs.pmnd.rs/getting-started/installation), [Expo Camera](https://docs.expo.dev/versions/v58.0.0/sdk/camera/), [khóa hướng màn hình](https://docs.expo.dev/versions/v58.0.0/sdk/screen-orientation/).
