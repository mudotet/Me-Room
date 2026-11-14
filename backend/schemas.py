import math
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, model_validator

Number = Annotated[float, Field(allow_inf_nan=False, strict=True)]
Positive = Annotated[float, Field(gt=0, allow_inf_nan=False, strict=True)]
Color = Annotated[str, Field(pattern=r"^#[0-9a-fA-F]{6}$")]
Identifier = Annotated[
    str, Field(min_length=1, max_length=100, pattern=r"^[a-zA-Z0-9_-]+$")
]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Position(StrictModel):
    x: Number
    y: Number
    z: Number


class Size(StrictModel):
    x: Positive
    y: Positive
    z: Positive


class Room(StrictModel):
    width: Annotated[float, Field(gt=0, le=100, allow_inf_nan=False, strict=True)]
    length: Annotated[float, Field(gt=0, le=100, allow_inf_nan=False, strict=True)]
    height: Annotated[float, Field(gt=0, le=20, allow_inf_nan=False, strict=True)]
    wallColor: Color


class Furniture(StrictModel):
    id: Identifier
    type: Identifier
    modelId: Identifier
    position: Position
    size: Size
    rotationY: Number
    color: Color
    confidence: Annotated[float, Field(ge=0, le=1, allow_inf_nan=False, strict=True)]


class RoomScene(StrictModel):
    sceneId: Identifier
    room: Room
    objects: Annotated[list[Furniture], Field(max_length=100)]

    @model_validator(mode="after")
    def check_geometry(self):
        ids = [obj.id for obj in self.objects]
        if len(ids) != len(set(ids)):
            raise ValueError("Object IDs must be unique")
        for obj in self.objects:
            cosine, sine = abs(math.cos(obj.rotationY)), abs(math.sin(obj.rotationY))
            half_x = (cosine * obj.size.x + sine * obj.size.z) / 2
            half_z = (sine * obj.size.x + cosine * obj.size.z) / 2
            if (
                abs(obj.position.x) + half_x > self.room.width / 2 + 1e-6
                or abs(obj.position.z) + half_z > self.room.length / 2 + 1e-6
                or obj.position.y - obj.size.y / 2 < -1e-6
                or obj.position.y + obj.size.y / 2 > self.room.height + 1e-6
            ):
                raise ValueError(f"Object {obj.id} extends outside room bounds")
        return self


class DesignRequest(StrictModel):
    scene: RoomScene
    prompt: Annotated[str, Field(min_length=1, max_length=2000)]

    @model_validator(mode="after")
    def check_prompt(self):
        if not self.prompt.strip():
            raise ValueError("Prompt must not be blank")
        return self
