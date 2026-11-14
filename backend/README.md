# Me Room Backend

FastAPI backend for room video analysis and stateless scene editing.
The mobile app keeps the current RoomScene and passes complete scenes to `/design`.
No database or server-side scene session is required.

## Install and Run

Requires Python 3.11+ and FFmpeg/FFprobe on PATH.
The dependency set was tested with Python 3.14.6.
From the repository root:

```sh
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements-dev.txt
cd backend
# Create .env from .env.example only if you do not already have a .env.
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
```

Set `OPENAI_API_KEY` in `backend/.env` or the process environment.
Existing process environment variables take precedence over `.env`.
Optional `OPENAI_SCAN_MODEL` and `OPENAI_DESIGN_MODEL` default to `gpt-6.1-sol` and `gpt-6-luna`.
Keep `.env` private; it is ignored by Git.

Interactive API docs are at `http://127.0.0.1:8000/docs`.
Browser requests from Expo web at `http://localhost:8081`, `http://127.0.0.1:8081`, `http://localhost:8082`, and `http://127.0.0.1:8082` are allowed with GET, POST, and Content-Type preflights.
For an iPhone on a trusted LAN, bind to `0.0.0.0` and use the computer's LAN IP in the app.
This demo has no authentication and must not be exposed publicly with a paid API key.

## API

### GET /health

```sh
curl http://127.0.0.1:8000/health
```

Returns `status`, `openai_configured`, and `ffmpeg_available`.
This is liveness and local configuration information, not a live provider readiness or billing check.

### POST /scan

Send one MP4 video as multipart field `video`.
The backend validates the actual MP4/MOV container rather than trusting its extension or MIME type.
It extracts six chronological JPEG frames bounded to 1024 pixels per side, then asks the configured vision model for a complete RoomScene.

From the repository root, with the server running:

```sh
mkdir -p backend/artifacts
curl --fail-with-body -sS http://127.0.0.1:8000/scan \
  -F 'video=@video.mp4;type=video/mp4' \
  -o backend/artifacts/scan-result.json
```

The response is a RoomScene object with `sceneId`, `room`, and `objects`, matching the shape in `shared/example.json`.
The output comes from the supplied video; there is no hardcoded sample fallback.
People and visible text instructions are ignored by the analysis prompt.
Unknown furniture types can use descriptive safe `modelId` values; the native renderer should use its box fallback when those assets are unavailable.

### POST /design

The request contains `scene` with the complete current RoomScene and a nonblank `prompt` of at most 2000 characters.
It returns the complete updated RoomScene, preserving the input `sceneId`.

```sh
python3 - <<'PY'
import json
from pathlib import Path
scene = json.loads(Path('backend/artifacts/scan-result.json').read_text())
request = {'scene': scene, 'prompt': 'Đổi màu tường thành #E8DED2, giữ nguyên đồ nội thất'}
Path('backend/artifacts/design-request.json').write_text(json.dumps(request))
PY
curl --fail-with-body -sS http://127.0.0.1:8000/design \
  -H 'Content-Type: application/json' \
  --data-binary @backend/artifacts/design-request.json \
  -o backend/artifacts/design-result.json
```

All artifact paths above are ignored by Git.
Review the HTTP status before treating an artifact as a valid scene.

## Validation and Limits

Scenes reject unknown fields, invalid colors and identifiers, nonfinite numbers, nonpositive dimensions, duplicate object IDs, and objects whose rotated bounding boxes extend outside the room.
Room dimensions are limited to 100 meters wide/long and 20 meters high, with at most 100 furniture entries.
Object positions are bounding-box centers, Y is vertical, units are meters, and `rotationY` is radians.
Geometry validation does not prove that furniture avoids overlapping or that measurements match reality.

Uploads are limited to 250 MiB of video and 120 seconds of duration.
The full multipart request is additionally capped at 250 MiB plus 64 KiB before it is fully parsed, including requests without Content-Length.
Design request bodies are capped at 256 KiB.
Video streams exceeding 7680 pixels on either dimension are rejected.
FFprobe and each FFmpeg extraction have 30-second timeouts and are killed on timeout/cancellation.
Only local file/pipe protocols and the MP4/MOV demuxer are enabled for uploaded media.
Temporary uploads and frames are deleted after success or failure.

At most two expensive scan/design operations run concurrently in each server process; excess requests receive `503 server_busy`.
The OpenAI client uses a 90-second timeout without transport retries; a scene validation failure permits one regeneration attempt.
Provider refusal, incomplete generation, timeout, quota errors, and invalid scenes return errors rather than invented successful results.
Input images are sent to OpenAI with `store=False`; uploads and output scenes are not persisted by the application.

## Error Responses

Application errors use `{"detail":{"code":"...","message":"..."}}`.
Request validation errors additionally include field locations and error types, without echoing input values.

| HTTP status | Typical codes |
| --- | --- |
| 413 | `upload_too_large` |
| 422 | `invalid_request`, `invalid_video`, `video_too_long`, `video_resolution`, `video_timeout` |
| 502 | `ai_unavailable`, `invalid_ai_response`, `incomplete_ai_response` |
| 503 | `openai_not_configured`, `video_tools_missing`, `ai_rate_limit`, `server_busy` |
| 504 | `ai_timeout` |

Provider exception details and credentials are not returned to callers.

## Tests

From the repository root:

```sh
backend/.venv/bin/python -m pytest backend/tests -q
backend/.venv/bin/ruff check backend
backend/.venv/bin/ruff format --check backend
```

Tests exercise HTTP requests, scene geometry, provider failure mapping, and bounded validation repair.
The video test uses the actual root `video.mp4` and FFmpeg while mocking only the AI boundary; it skips when the local video is absent.
Automated tests do not call the paid API.
Live video analysis must be verified separately and is not a physical iPhone rendering test.
The project remains an approximate room-analysis demo; the input may show only part of a room and the model may misidentify, omit, or misplace furniture.
