import asyncio
import json
import sys

import pytest

import video
from errors import ServiceError
from settings import Settings


def test_timed_out_process_is_terminated():
    with pytest.raises(ServiceError) as error:
        asyncio.run(
            video.run_process(
                [sys.executable, "-c", "import time; time.sleep(10)"], 0.02
            )
        )
    assert error.value.code == "video_timeout"
    assert error.value.status == 422


def test_overlong_video_rejected_before_frame_extraction(monkeypatch, tmp_path):
    calls = []

    async def probe(args, timeout):
        calls.append(args)
        return json.dumps(
            {
                "format": {"duration": "121"},
                "streams": [{"codec_type": "video", "width": 640, "height": 480}],
            }
        ).encode()

    monkeypatch.setattr(video, "run_process", probe)
    with pytest.raises(ServiceError) as error:
        asyncio.run(video.extract_frames(tmp_path / "upload.bin", Settings()))
    assert error.value.code == "video_too_long"
    assert len(calls) == 1
    assert calls[0][0] == "ffprobe"
