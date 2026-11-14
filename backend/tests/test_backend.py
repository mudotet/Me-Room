import copy
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from main import create_app
from schemas import RoomScene
from settings import Settings

ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture
def scene():
    return json.loads((ROOT / "shared/example.json").read_text())


class FakeAI:
    def __init__(self, scene):
        self.scene = scene
        self.frames = []

    async def scan(self, frames):
        self.frames = frames
        return RoomScene.model_validate(self.scene)

    async def design(self, scene, prompt):
        changed = scene.model_copy(deep=True)
        changed.room.wallColor = "#AABBCC"
        return changed


def test_health_without_key():
    with TestClient(create_app(Settings(api_key=""))) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["openai_configured"] is False


@pytest.mark.parametrize(
    ("origin", "method", "path"),
    [
        ("http://localhost:8081", "GET", "/health"),
        ("http://localhost:8081", "POST", "/design"),
        ("http://127.0.0.1:8081", "GET", "/health"),
        ("http://127.0.0.1:8081", "POST", "/design"),
        ("http://localhost:8082", "GET", "/health"),
        ("http://localhost:8082", "POST", "/design"),
        ("http://127.0.0.1:8082", "GET", "/health"),
        ("http://127.0.0.1:8082", "POST", "/design"),
    ],
)
def test_local_web_preflight(origin, method, path):
    with TestClient(create_app(Settings(api_key=""))) as client:
        response = client.options(
            path,
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": method,
                "Access-Control-Request-Headers": "content-type",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin
    assert set(response.headers["access-control-allow-methods"].split(", ")) == {
        "GET",
        "POST",
        "OPTIONS",
    }
    assert "content-type" in response.headers["access-control-allow-headers"].lower()
    assert "access-control-allow-credentials" not in response.headers


def test_local_web_preflight_rejects_other_origins():
    with TestClient(create_app(Settings(api_key=""))) as client:
        response = client.options(
            "/design",
            headers={
                "Origin": "https://example.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_scan_rejects_invalid_video(scene):
    with TestClient(create_app(Settings(api_key="test"), FakeAI(scene))) as client:
        response = client.post(
            "/scan", files={"video": ("x.mp4", b"not a video", "video/mp4")}
        )
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "invalid_video"


def test_scan_size_limit(scene):
    with TestClient(
        create_app(Settings(api_key="test", max_upload_bytes=10), FakeAI(scene))
    ) as client:
        response = client.post(
            "/scan", files={"video": ("x.mp4", b"x" * 11, "video/mp4")}
        )
    assert response.status_code == 413


def test_default_upload_limit_is_250_mib_without_allocating_body(scene):
    limit = 250 * 1024 * 1024
    assert Settings().max_upload_bytes == limit

    with TestClient(create_app(Settings(api_key="test"), FakeAI(scene))) as client:
        response = client.post(
            "/scan",
            content=b"",
            headers={"Content-Length": str(limit + 65536 + 1)},
        )

    assert response.status_code == 413


def test_scan_real_video_with_mock_ai(scene):
    video = ROOT / "video.mp4"
    if not video.exists():
        pytest.skip("Local sample video unavailable")
    ai = FakeAI(scene)
    with (
        TestClient(create_app(Settings(api_key="test"), ai)) as client,
        video.open("rb") as stream,
    ):
        response = client.post(
            "/scan", files={"video": ("../../unsafe.mp4", stream, "video/mp4")}
        )
    assert response.status_code == 200, response.text
    RoomScene.model_validate(response.json())
    assert len(ai.frames) == 6
    assert all(frame.startswith(b"\xff\xd8") for frame in ai.frames)


def test_design_updates_scene_without_mutating_input(scene):
    original = copy.deepcopy(scene)
    with TestClient(create_app(Settings(api_key="test"), FakeAI(scene))) as client:
        response = client.post(
            "/design", json={"scene": scene, "prompt": "Đổi màu tường"}
        )
    assert response.status_code == 200, response.text
    assert response.json()["room"]["wallColor"] == "#AABBCC"
    assert response.json()["sceneId"] == scene["sceneId"]
    assert scene == original


def test_design_rejects_blank_prompt(scene):
    with TestClient(create_app(Settings(api_key="test"), FakeAI(scene))) as client:
        response = client.post("/design", json={"scene": scene, "prompt": "   "})
    assert response.status_code == 422


@pytest.mark.parametrize(
    "mutation", ["duplicate", "negative", "nan", "outside", "rotated"]
)
def test_rejects_invalid_scene(scene, mutation):
    obj = scene["objects"][0]
    if mutation == "duplicate":
        scene["objects"].append(copy.deepcopy(obj))
    elif mutation == "negative":
        obj["size"]["x"] = -1
    elif mutation == "nan":
        obj["position"]["x"] = float("nan")
    elif mutation == "outside":
        obj["position"]["x"] = 99
    else:
        obj["position"]["x"] = 1.1
        obj["rotationY"] = 1.57079632679
    with pytest.raises(ValidationError):
        RoomScene.model_validate(scene)


def test_missing_key_returns_safe_error(scene):
    with TestClient(create_app(Settings(api_key=""))) as client:
        response = client.post(
            "/design", json={"scene": scene, "prompt": "Đổi màu tường"}
        )
    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "openai_not_configured"


def test_invalid_nonfinite_json_returns_422_not_server_error(scene):
    scene["objects"][0]["position"]["x"] = float("nan")
    with TestClient(
        create_app(Settings(api_key="test"), FakeAI(scene)),
        raise_server_exceptions=False,
    ) as client:
        response = client.post(
            "/design",
            content=json.dumps({"scene": scene, "prompt": "change"}),
            headers={"Content-Type": "application/json"},
        )
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "invalid_request"


def test_request_body_limit_applies_before_video_parsing(scene):
    with TestClient(
        create_app(Settings(api_key="test", max_upload_bytes=10), FakeAI(scene))
    ) as client:
        response = client.post(
            "/scan",
            content=b"x" * 70000,
            headers={"Content-Type": "application/octet-stream"},
        )
    assert response.status_code == 413


def test_local_playlist_is_not_accepted_as_video(scene):
    payload = "ffconcat version 1.0\nfile " + str(ROOT / "video.mp4") + "\n"
    with TestClient(create_app(Settings(api_key="test"), FakeAI(scene))) as client:
        response = client.post(
            "/scan", files={"video": ("x.mp4", payload.encode(), "video/mp4")}
        )
    assert response.status_code == 422


def test_chunked_multipart_upload_limit(scene):
    def body():
        yield b'--boundary\r\nContent-Disposition: form-data; name="video"; filename="clip.mp4"\r\nContent-Type: video/mp4\r\n\r\n'
        for _ in range(8):
            yield b"x" * 10000
        yield b"\r\n--boundary--\r\n"

    with TestClient(
        create_app(Settings(api_key="test", max_upload_bytes=10), FakeAI(scene))
    ) as client:
        response = client.post(
            "/scan",
            content=body(),
            headers={"Content-Type": "multipart/form-data; boundary=boundary"},
        )
    assert response.status_code == 413
    assert response.json()["detail"]["code"] == "upload_too_large"
