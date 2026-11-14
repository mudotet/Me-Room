import asyncio
import json
from pathlib import Path
from types import SimpleNamespace

import httpx
import pytest
from openai import APITimeoutError, AuthenticationError, RateLimitError

from ai import SceneAI
from errors import ServiceError
from schemas import RoomScene
from settings import Settings

SCENE = json.loads(
    (Path(__file__).resolve().parents[2] / "shared/example.json").read_text()
)


@pytest.mark.parametrize(
    "exception,code,status",
    [
        (
            APITimeoutError(request=httpx.Request("POST", "https://api.openai.com")),
            "ai_timeout",
            504,
        ),
        (
            RateLimitError(
                "private provider message",
                response=httpx.Response(
                    429, request=httpx.Request("POST", "https://api.openai.com")
                ),
                body=None,
            ),
            "ai_rate_limit",
            503,
        ),
        (
            AuthenticationError(
                "private token",
                response=httpx.Response(
                    401, request=httpx.Request("POST", "https://api.openai.com")
                ),
                body=None,
            ),
            "ai_unavailable",
            502,
        ),
    ],
)
def test_provider_errors_are_sanitized(exception, code, status):
    async def run():
        ai = SceneAI(Settings(api_key="test"))

        async def parse(**kwargs):
            raise exception

        ai.client.responses.parse = parse
        try:
            with pytest.raises(ServiceError) as result:
                await ai.scan([b"jpeg"])
            assert result.value.code == code
            assert result.value.status == status
            assert "private" not in result.value.message
        finally:
            await ai.close()

    asyncio.run(run())


@pytest.mark.parametrize(
    "status,parsed,code",
    [
        ("completed", None, "invalid_ai_response"),
        ("incomplete", RoomScene.model_validate(SCENE), "incomplete_ai_response"),
    ],
)
def test_refusal_or_incomplete_does_not_return_scene(status, parsed, code):
    async def run():
        ai = SceneAI(Settings(api_key="test"))

        async def parse(**kwargs):
            return SimpleNamespace(status=status, output_parsed=parsed)

        ai.client.responses.parse = parse
        try:
            with pytest.raises(ServiceError) as result:
                await ai.scan([b"jpeg"])
            assert result.value.code == code
        finally:
            await ai.close()

    asyncio.run(run())


@pytest.mark.parametrize("repaired", [True, False])
def test_invalid_geometry_has_one_repair_attempt(repaired):
    async def run():
        ai = SceneAI(Settings(api_key="test"))
        calls = []

        async def parse(**kwargs):
            calls.append(kwargs)
            if len(calls) == 1 or not repaired:
                invalid = json.loads(json.dumps(SCENE))
                invalid["objects"][0]["position"]["x"] = 100
                RoomScene.model_validate(invalid)
            return SimpleNamespace(
                status="completed", output_parsed=RoomScene.model_validate(SCENE)
            )

        ai.client.responses.parse = parse
        try:
            if repaired:
                result = await ai.scan([b"jpeg"])
                assert result.sceneId == SCENE["sceneId"]
            else:
                with pytest.raises(ServiceError) as error:
                    await ai.scan([b"jpeg"])
                assert error.value.code == "invalid_ai_response"
            assert len(calls) == 2
        finally:
            await ai.close()

    asyncio.run(run())
