import asyncio
import json
import math
from pathlib import Path

from errors import ServiceError
from settings import Settings


async def run_process(args: list[str], timeout: float) -> bytes:
    try:
        process = await asyncio.create_subprocess_exec(
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )
    except FileNotFoundError:
        raise ServiceError(
            503, "video_tools_missing", "FFmpeg and FFprobe must be installed."
        ) from None
    try:
        stdout, _ = await asyncio.wait_for(process.communicate(), timeout)
    except (TimeoutError, asyncio.CancelledError) as exc:
        if process.returncode is None:
            process.kill()
        await process.communicate()
        if isinstance(exc, asyncio.CancelledError):
            raise
        raise ServiceError(
            422, "video_timeout", "Video processing exceeded the time limit."
        ) from None
    if process.returncode:
        raise ServiceError(
            422, "invalid_video", "The upload is not a supported, readable video."
        )
    return stdout


async def extract_frames(path: Path, settings: Settings) -> list[bytes]:
    metadata = await run_process(
        [
            "ffprobe",
            "-v",
            "error",
            "-f",
            "mov",
            "-protocol_whitelist",
            "file,pipe",
            "-show_entries",
            "format=duration:stream=codec_type,width,height",
            "-of",
            "json",
            str(path),
        ],
        settings.process_timeout_seconds,
    )
    try:
        probe = json.loads(metadata)
        duration = float(probe["format"]["duration"])
        streams = [s for s in probe["streams"] if s["codec_type"] == "video"]
        if not streams or not math.isfinite(duration) or duration <= 0:
            raise ValueError
        if any(s.get("width", 0) > 7680 or s.get("height", 0) > 7680 for s in streams):
            raise ServiceError(
                422, "video_resolution", "Video resolution exceeds the supported limit."
            )
    except (ValueError, KeyError, TypeError):
        raise ServiceError(
            422, "invalid_video", "The upload has no readable video stream or duration."
        ) from None
    if duration > settings.max_duration_seconds:
        raise ServiceError(
            422, "video_too_long", "Video must be at most 120 seconds long."
        )
    frames = []
    # Seek independently so short clips still yield the requested number of samples.
    for index in range(settings.frame_count):
        timestamp = duration * (index + 0.5) / settings.frame_count
        output = path.parent / f"frame-{index}.jpg"
        await run_process(
            [
                "ffmpeg",
                "-hide_banner",
                "-loglevel",
                "error",
                "-nostdin",
                "-f",
                "mov",
                "-protocol_whitelist",
                "file,pipe",
                "-ss",
                str(timestamp),
                "-i",
                str(path),
                "-map",
                "0:v:0",
                "-frames:v",
                "1",
                "-an",
                "-threads",
                "1",
                "-vf",
                "scale=w='min(1024,iw)':h='min(1024,ih)':force_original_aspect_ratio=decrease",
                "-q:v",
                "3",
                "-y",
                str(output),
            ],
            settings.process_timeout_seconds,
        )
        if not output.is_file() or output.stat().st_size == 0:
            raise ServiceError(
                422, "invalid_video", "Could not extract a frame from the video."
            )
        frames.append(output.read_bytes())
    return frames
