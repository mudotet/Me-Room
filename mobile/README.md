# Me Room

Expo mobile app for room capture, 3D previews, and AI-assisted design, backed by FastAPI.

## Run on macOS

Requirements: Node.js 22.13+, npm, and Expo Go compatible with SDK 58.

Start the backend from the repository root:

```sh
cd backend
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001
```

Start Expo from another terminal:

```sh
cd mobile
npm ci
npm start -- --lan --port 8082
```

Connect the iPhone and Mac to the same Wi-Fi, then open Expo Go from the QR code.

## iPhone API setup

Set both entries in `mobile/.env` to the Mac's current Wi-Fi address:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.84:8001
API_BASE_URL=http://192.168.1.84:8001
```

`EXPO_PUBLIC_API_BASE_URL` is inlined by Metro; `API_BASE_URL` is the app-config fallback.
The backend uses port `8001`; Expo Go uses `8082`.
On iPhone, `localhost` points to the phone, so use the Mac's LAN IP.
After changing `.env`, restart Expo and reload the app.
Check backend access on iPhone at `http://192.168.1.84:8001/health`.

Native video uploads use `File` from `expo-file-system` inside `FormData`, as required by Expo 58's default fetch implementation.
The older React Native `{ uri, name, type }` upload object fails with `Unsupported FormDataPart implementation` before reaching the backend.
See the [Expo file upload documentation](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/#uploading-files-using-expofetch).

For production, use HTTPS and keep OpenAI credentials on the backend.

## App notes

The scanner records up to 120 seconds at 720p without audio; selected videos may include audio.
Both capture paths accept files up to 250 MiB, with a three-minute upload and analysis timeout.
An iOS 0.5× ultra-wide lens is available only when the device reports that lens.
Third-person view is portrait; first-person view requests landscape on native and shows a rotate/resize notice on portrait web.
The left joystick moves relative to the camera direction; dragging the room changes the viewing direction.
Movement stops when touches end, controls are cancelled, chat opens, or the app leaves the foreground.
Movement stays inside room boundaries; furniture collision is not modeled.
No GLB models are bundled yet, so furniture uses box fallbacks.

See the [root README screenshots](../README.md); they are web captures at an iPhone 13 viewport, not physical-device evidence.

## Checks

```sh
npm run typecheck
npm test
```
