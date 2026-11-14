import asyncio
import shutil
from contextlib import asynccontextmanager
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from ai import SceneAI
from errors import ServiceError
from schemas import DesignRequest, RoomScene
from settings import Settings
from video import extract_frames


class BodySizeLimit:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["path"] not in ("/scan", "/design"):
            return await self.app(scope, receive, send)
        config = scope["app"].state.settings
        limit = config.max_upload_bytes + 65536 if scope["path"] == "/scan" else 262144
        detail = {
            "code": "upload_too_large",
            "message": "Request exceeds the upload size limit.",
        }
        headers = dict(scope["headers"])
        try:
            declared_length = int(headers.get(b"content-length", b"0"))
        except ValueError:
            declared_length = 0
        if declared_length > limit:
            return await JSONResponse(status_code=413, content={"detail": detail})(
                scope, receive, send
            )
        received = 0

        async def limited_receive():
            nonlocal received
            message = await receive()
            received += len(message.get("body", b""))
            if received > limit:
                raise HTTPException(413, detail=detail)
            return message

        await self.app(scope, limited_receive, send)


def create_app(settings: Settings | None = None, ai_service=None) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app):
        config = settings if settings is not None else Settings.from_env()
        app.state.settings = config
        app.state.slots = asyncio.Semaphore(2)
        app.state.ai = (
            ai_service
            if ai_service is not None
            else (SceneAI(config) if config.api_key else None)
        )
        yield
        if ai_service is None and app.state.ai is not None:
            await app.state.ai.close()

    app = FastAPI(title="Me Room Backend", version="0.1.0", lifespan=lifespan)

    app.add_middleware(BodySizeLimit)

    @app.exception_handler(RequestValidationError)
    async def invalid_request(_request, exc):
        errors = [
            {"location": list(error["loc"]), "type": error["type"]}
            for error in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content={
                "detail": {
                    "code": "invalid_request",
                    "message": "Request data is invalid.",
                    "errors": errors,
                }
            },
        )

    @app.exception_handler(ServiceError)
    async def service_error(_request, exc):
        return JSONResponse(
            status_code=exc.status,
            content={"detail": {"code": exc.code, "message": exc.message}},
        )

    @asynccontextmanager
    async def ai_slot(request):
        if request.app.state.ai is None:
            raise ServiceError(
                503, "openai_not_configured", "Set OPENAI_API_KEY on the backend."
            )
        try:
            await asyncio.wait_for(request.app.state.slots.acquire(), timeout=0.1)
        except TimeoutError:
            raise ServiceError(
                503,
                "server_busy",
                "The server is processing other requests. Please retry.",
            ) from None
        try:
            yield request.app.state.ai
        finally:
            request.app.state.slots.release()

    @app.get("/health")
    async def health(request: Request):
        return {
            "status": "ok",
            "openai_configured": bool(request.app.state.settings.api_key),
            "ffmpeg_available": shutil.which("ffmpeg") is not None
            and shutil.which("ffprobe") is not None,
        }

    @app.post("/scan", response_model=RoomScene)
    async def scan(request: Request, video: Annotated[UploadFile, File()]):
        try:
            async with ai_slot(request) as ai:
                with TemporaryDirectory(prefix="me-room-") as directory:
                    path = Path(directory) / "upload.bin"
                    size = 0
                    with path.open("wb") as target:
                        while chunk := await video.read(1024 * 1024):
                            size += len(chunk)
                            if size > request.app.state.settings.max_upload_bytes:
                                raise HTTPException(
                                    413,
                                    detail={
                                        "code": "upload_too_large",
                                        "message": "Video exceeds the upload size limit.",
                                    },
                                )
                            target.write(chunk)
                    if not size:
                        raise ServiceError(
                            422, "invalid_video", "Video must not be empty."
                        )
                    frames = await extract_frames(path, request.app.state.settings)
                    return await ai.scan(frames)
        finally:
            await video.close()

    @app.post("/design", response_model=RoomScene)
    async def design(request: Request, body: DesignRequest):
        async with ai_slot(request) as ai:
            return await ai.design(body.scene, body.prompt)

    return app


app = create_app()
