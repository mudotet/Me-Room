# Hướng dẫn làm việc cho Khải, Tú và Quang

## 1. Mục tiêu và trạng thái hiện tại

Luồng demo cần hoàn thành: quay phòng trên iPhone → backend phân tích video → trả RoomScene → hiển thị 3D trong app → nhập yêu cầu decor → cập nhật phòng.
Nhóm dùng một app Expo, một backend FastAPI và một contract JSON chung.
Backend đã có `/health`, `/scan`, `/design` và bộ test; xem [hướng dẫn backend](../backend/README.md) để chạy.
App mobile và model GLB vẫn cần triển khai.
Các checklist bên dưới mô tả trách nhiệm và tiêu chí nghiệm thu; kiểm tra code và bằng chứng trước khi đánh dấu hoàn thành.

## 2. Contract hiện tại và các việc cần phối hợp

Cả ba đọc [contract MVP](../shared/README.md) và [JSON mẫu](../shared/example.json).
JSON mẫu là dữ liệu giả lập để làm việc độc lập.
Backend đã chốt `/scan` nhận multipart field `video`; `/design` nhận `{ "scene": <RoomScene hiện tại>, "prompt": "..." }` và trả RoomScene mới.
Không có lưu phiên phía server; Khải giữ scene trong state và gửi lại khi gọi `/design`.

| Việc cần thống nhất | Người tổng hợp | Người phối hợp |
| --- | --- | --- |
| Cấu trúc RoomScene, field bắt buộc và cách báo dữ liệu không hợp lệ | Tú | Khải và Quang |
| Tên field multipart của `/scan`, định dạng lỗi và giới hạn video | Tú | Khải |
| `/design` nhận scene hiện tại hay dùng scene lưu theo `sceneId` | Tú | Khải |
| Export của `Room3D`, prop `sceneData` và cách báo loading/lỗi model | Quang | Khải |
| Phiên bản Expo, React, R3F và cấu hình Metro | Khải | Quang |
| Danh sách `modelId` có asset tương ứng và cách fallback | Quang | Tú |

Ghi quyết định vào tài liệu trong `shared/` và cập nhật bên sản xuất lẫn bên sử dụng dữ liệu cùng lúc.
Tú tổng hợp thay đổi contract nhưng cần cả ba thống nhất trước khi đổi field, đơn vị hoặc hệ tọa độ.
Mỗi file chỉ có một người hoặc một agent được giao quyền sửa tại một thời điểm.

## 3. Khải: Mobile app

### Phạm vi

Làm trong `mobile/app/` và các file UI, gọi API, quản lý state của app bên trong `mobile/`.
Phần dựng 3D thuộc Quang ở `mobile/components/Room3D/`; model thuộc `mobile/assets/models/`.
Khải phụ trách tích hợp cấu hình chung của app sau khi thống nhất với Quang.

### Thứ tự thực hiện

1. Khởi tạo một project Expo ngay trong `mobile/`, giữ nguyên các file agent và thư mục Room3D hiện có.
2. Ghi cách cài dependency và chạy app vào `mobile/README.md` sau khi có project thật.
3. Làm các màn hình Home, Scan, Processing, Room và AI Chat.
4. Kết nối dữ liệu mẫu với màn hình Room trước; chỉ tích hợp component thật sau khi thống nhất export với Quang.
5. Làm xin quyền camera, quay video, dừng quay và hiển thị trạng thái upload.
6. Gọi `/scan` theo request đã chốt với Tú và xử lý cả kết quả thành công lẫn lỗi.
7. Lưu RoomScene hợp lệ trong React state rồi truyền xuống `<Room3D sceneData={roomScene} />`.
8. Gửi prompt tới `/design` và thay state bằng RoomScene mới được backend trả về.
9. Chặn hoặc bỏ qua phản hồi cũ khi người dùng đã chuyển sang scene hay yêu cầu mới hơn.

App quản lý dữ liệu và trạng thái màn hình; component 3D quản lý việc dựng vật thể.
Không đưa OpenAI API key vào app hoặc gọi OpenAI trực tiếp từ điện thoại.
Địa chỉ backend trên iPhone phải truy cập được từ điện thoại; `localhost` trên điện thoại không trỏ tới máy chạy backend.

### Bàn giao cho nhóm

- App mở được trên iPhone demo và có hướng dẫn chạy thực tế.
- Quay và upload video được, có loading, báo lỗi và cách thử lại.
- Nhận scene từ backend và truyền đúng prop cho Room3D.
- Chat cập nhật được scene đang hiển thị.
- Có cấu hình địa chỉ backend rõ ràng, không chứa khóa bí mật.

### Tự kiểm tra

Kiểm tra từ chối quyền camera, backend không truy cập được, upload lỗi, gửi prompt lỗi và thao tác thử lại.
Kiểm tra bàn phím không che ô chat, nút không nằm dưới vùng tai thỏ/home indicator và thao tác cảm ứng không xung đột với canvas.
Ghi rõ kết quả nào chạy bằng dữ liệu mẫu, kết quả nào dùng API thật và kết quả nào đã thử trên iPhone.

## 4. Tú: Backend và AI

### Phạm vi

Làm trong `backend/`; phụ trách FastAPI, FFmpeg, OpenAI, chuẩn hóa scene và kiểm tra dữ liệu.
Tổng hợp contract trong `shared/` sau khi thống nhất với hai thành viên còn lại.
Không sửa màn hình mobile hay renderer để xử lý lệch contract một cách âm thầm.

### Thứ tự thực hiện

1. Khởi tạo backend và dependency manifest, ghi lệnh cài/chạy/test thật vào `backend/README.md`.
2. Xây model kiểm tra dữ liệu từ contract đã chốt, dùng `shared/example.json` làm một fixture hợp lệ.
3. Làm `GET /health` để Khải kiểm tra kết nối tới backend.
4. Làm `POST /scan`: nhận video theo field đã thống nhất, kiểm tra đầu vào và lưu tạm an toàn.
5. Dùng FFmpeg trích khoảng 6-10 frame đại diện theo kế hoạch demo, với giới hạn thời gian và tài nguyên phù hợp.
6. Gửi frame cho OpenAI để phân tích rồi chuẩn hóa phản hồi thành RoomScene.
7. Kiểm tra kích thước, tọa độ, màu sắc, ID và `modelId` trước khi trả dữ liệu cho app.
8. Làm `POST /design` theo cơ chế scene đã thống nhất, xử lý prompt và trả scene mới đã kiểm tra.
9. Xóa dữ liệu tạm sau xử lý và bổ sung các kiểm tra lỗi quan trọng.

Phản hồi AI là dữ liệu đầu vào cần kiểm tra, không được mặc định là JSON đúng hoặc tọa độ hợp lệ.
Nếu dùng lưu scene theo `sceneId`, ghi rõ thời gian tồn tại, hành vi khi backend khởi động lại và lỗi khi không tìm thấy scene.
Thống nhất với Quang các `modelId` được hỗ trợ; không yêu cầu AI tự sinh file GLB.

### Bàn giao cho nhóm

- API `/health`, `/scan`, `/design` cùng request, response, lỗi và ví dụ gọi thực tế.
- Một luồng `/scan` đã thử bằng video thật, ghi rõ giới hạn nhận diện và độ gần đúng.
- Ví dụ đổi màu tường và di chuyển một vật thể qua `/design`.
- Hướng dẫn thiết lập biến môi trường bằng giá trị mẫu, không đưa API key thật vào Git hoặc log.
- Kết quả test đầu vào hợp lệ, video không hợp lệ, AI lỗi và scene sai cấu trúc.

### Tự kiểm tra

Kiểm tra file giả video, upload quá giới hạn, FFmpeg thất bại, OpenAI timeout và phản hồi sai cấu trúc.
Kiểm tra không trả scene chứa số không hữu hạn, kích thước âm hoặc vật thể vượt giới hạn phòng theo quy tắc đã chốt.
Nếu chưa thể gọi AI thật, báo rõ phần nào đang mock và điều kiện còn thiếu để kiểm chứng.

## 5. Quang: Native 3D

### Phạm vi

Làm trong `mobile/components/Room3D/` và `mobile/assets/models/`.
Viết component trong cùng app Expo của Khải; không khởi tạo app hay package độc lập bên trong Room3D.
Gửi yêu cầu chỉnh dependency và Metro cho Khải để tránh hai người cùng sửa cấu hình.

### Thứ tự thực hiện

1. Cùng Khải kiểm tra phiên bản thư viện và làm phép thử R3F Native trên iPhone demo trong 20-30 phút đầu sau khi Expo chạy được.
2. Thử một hình hộp, điều khiển camera bằng cảm ứng, nhiều vật thể từ JSON và một GLB có texture.
3. Nếu phép thử thất bại, gửi thiết bị, phiên bản, lỗi và cách tái hiện cho nhóm trước khi mở rộng renderer.
4. Viết `Room3D.tsx` với prop `sceneData`; tách `Furniture.tsx` và `CameraControls.tsx` khi cần.
5. Dựng sàn, tường và vật thể từ contract; chỉ thêm cửa/cửa sổ sau khi thống nhất field tương ứng.
6. Ánh xạ `modelId` sang GLB có sẵn trong catalog, chuẩn hóa hướng, scale và tâm model.
7. Dùng khối hộp đúng kích thước khi chưa có model hoặc model tải lỗi.
8. Cập nhật cảnh khi `sceneData` thay đổi, giữ nguyên dữ liệu prop đầu vào và xử lý việc tải model bất đồng bộ.
9. Kiểm tra thay scene nhiều lần và dọn tài nguyên GPU không còn dùng mà không làm hỏng asset đang chia sẻ.

Quy ước chung: kích thước tính bằng mét, trục Y là chiều cao, tâm sàn là `(0, 0, 0)`, `position` là tâm hộp giới hạn và `rotationY` tính bằng radian.
Không hardcode layout của `shared/example.json` vào component.

### Bàn giao cho nhóm

- Component Khải import được qua `<Room3D sceneData={roomScene} />`.
- Hai bố cục phòng khác nhau dựng được chỉ bằng thay dữ liệu đầu vào.
- Catalog ghi `modelId`, tên file, kích thước/hướng gốc và quyền sử dụng asset khi thêm GLB.
- Camera xoay, zoom và di chuyển phù hợp với cảm ứng, kèm cách sử dụng.
- Kết quả trên iPhone thật cho render cơ bản và GLB có texture, hoặc báo cụ thể phần chưa đạt.

### Tự kiểm tra

Kiểm tra giường/tủ không nổi trên sàn, sai scale, xoay sai hướng hoặc bị camera cắt mất bất thường.
Kiểm tra thiếu model, đổi màu, di chuyển vật thể, thêm/xóa vật thể và thay scene liên tục.
Ghi riêng bằng chứng từ test mock, simulator và iPhone thật.

## 6. Ghép ba phần theo thứ tự

| Mốc | Khải | Tú | Quang | Điều kiện đạt |
| --- | --- | --- | --- | --- |
| A: dữ liệu mẫu | Mở màn hình Room với state mẫu | Kiểm tra draft contract | Dựng scene mẫu trên iPhone | App truyền JSON vào component và hiển thị được |
| B: scan thật | Quay, upload và nhận scene | Xử lý video thật qua AI | Dựng được scene trả về | Không thay response scan bằng JSON hardcode |
| C: chỉnh sửa | Gửi prompt, cập nhật state | Trả scene đã chỉnh hợp lệ | Render theo prop mới | Đổi màu/di chuyển thấy được trên cùng màn hình |
| D: demo | Kiểm tra UI và thao tác lỗi | Kiểm tra API và điều kiện chạy | Kiểm tra model, camera, hiệu năng | Nhóm chạy lại được toàn bộ luồng trên iPhone demo |

Khi có lỗi, ghi rõ bước tái hiện, dữ liệu đầu vào, kết quả mong đợi, kết quả thực tế và log không chứa thông tin riêng tư.
Người sở hữu phần bị lỗi xử lý nguyên nhân; hai bên không tự sửa contract khác nhau để né lỗi tích hợp.

## 7. Dùng đội agent của từng thành viên

Chạy từ thư mục gốc repo trong các phiên Codex riêng:

```sh
# Tú
codex -C backend "Đọc docs/huong-dan-thanh-vien.md từ gốc repo và hướng dẫn team backend. Dùng crewmates để triển khai nhiệm vụ backend được giao."

# Khải
codex -C mobile "Đọc docs/huong-dan-thanh-vien.md từ gốc repo và hướng dẫn team mobile. Dùng crewmates để triển khai nhiệm vụ app được giao."

# Quang
codex -C mobile/components/Room3D "Đọc docs/huong-dan-thanh-vien.md từ gốc repo và hướng dẫn team native 3D. Dùng crewmates để triển khai nhiệm vụ renderer được giao."
```

Trong mỗi phiên, lead nhận yêu cầu cụ thể, chia task, giao file và điều phối các crewmate.
Coder triển khai; tester tái hiện lỗi và kiểm thử; reviewer đọc độc lập để tìm lỗi; confirmer đối chiếu tiêu chí hoàn thành với bằng chứng.
Confirmer không thay người dùng cấp quyền push hoặc deploy.
Agent trao đổi bằng messaging nếu runtime hỗ trợ; nếu không, lead chuyển tiếp thông tin.
Các phiên của ba thành viên không tự có kênh nhắn tin chung; thành viên cần chuyển thông tin hoặc dùng kênh runtime đã được xác nhận.

Mỗi lần giao task cần ghi: mục tiêu, file được sửa, phần phụ thuộc, tiêu chí đạt và lệnh kiểm tra có thể chạy.
Mỗi lần bàn giao cần ghi: đã đổi gì, đã chạy kiểm tra nào, kết quả, phần chưa kiểm chứng và việc cần thành viên khác tiếp nhận.

## 8. Giới hạn xác nhận hoàn thành

Không báo demo hoàn thành chỉ vì JSON parse được hoặc unit test pass.
Luồng cần được chạy lại trên iPhone với backend và renderer thật, còn phần mock phải được chỉ rõ.
Chỉ commit, push hoặc deploy theo phạm vi người dùng đã cho phép; thay đổi local chưa tự xuất hiện trên remote.
