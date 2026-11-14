import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    api_key: str = field(default="", repr=False)
    scan_model: str = "gpt-6.1-sol"
    design_model: str = "gpt-6-luna"
    max_upload_bytes: int = 250 * 1024 * 1024
    max_duration_seconds: float = 120
    frame_count: int = 6
    process_timeout_seconds: float = 30
    ai_timeout_seconds: float = 90

    @classmethod
    def from_env(cls):
        load_dotenv(Path(__file__).with_name(".env"))
        return cls(
            api_key=os.getenv("OPENAI_API_KEY", ""),
            scan_model=os.getenv("OPENAI_SCAN_MODEL", "gpt-6.1-sol"),
            design_model=os.getenv("OPENAI_DESIGN_MODEL", "gpt-6-luna"),
        )
