# RoomScene MVP Contract

`example.json` is synthetic input for developing the backend, mobile screens, and native renderer independently.
It replaces the previous empty root placeholder and follows the `room` and `objects` shape from the supplied native-rendering plan, with example scene and model identifiers.
It is a synthetic fixture; the implemented Pydantic models in `backend/schemas.py` define the accepted backend structure.

## Fields and Coordinates

| Field | Meaning |
| --- | --- |
| `sceneId` | Scene identifier, preserved by `/design`; no server-side session storage |
| `room` | `width`, `length`, `height` in meters and `wallColor` as a hex color |
| `objects` | Furniture entries identified by a unique `id` |
| `type`, `modelId` | Furniture kind and catalog key; a model ID is not a URL or a generated model |
| `position` | Object bounding-box center in meters, using `x`, `y`, and `z` |
| `size` | Bounding-box dimensions in meters along `x`, `y`, and `z` |
| `rotationY` | Rotation around the vertical axis in radians |
| `color` | Object color as a hex string |
| `confidence` | Example estimate from 0 to 1; synthetic values do not represent measured AI accuracy |

Y is vertical and the room floor center is `(0, 0, 0)`.
The floor spans `x = -width/2` to `width/2` and `z = -length/2` to `length/2`.
The backend requires finite coordinates, positive dimensions, unique object IDs, and rotated bounding boxes inside the room.
Room width/length are limited to 100 meters, height to 20 meters, and scenes to 100 objects.
Additional wall, door, and window fields remain outside the MVP contract.
The renderer must show a box fallback when a catalog entry or its GLB is unavailable.

## Ownership and Use

The backend produces and validates scenes; the mobile app will store them in React state and `Room3D` will consume them through `sceneData`.
Keep the fixture as shared input rather than copying different versions into each module or hardcoding its room layout.
When the Expo app is initialized, configure shared-file access consistently with the chosen Expo and Metro versions.
Create a second layout in an assigned test fixture when implementing rendering tests.

Validate syntax from the repository root:

```sh
python3 -m json.tool shared/example.json
```

This syntax check does not validate a formal schema or prove that the app renders the scene.
Agree API request fields and contract changes across all three teams before implementing or changing consumers.

## HTTP Contract

`POST /scan` accepts multipart field `video` and returns the complete RoomScene.
`POST /design` accepts `{ "scene": <complete RoomScene>, "prompt": "..." }` and returns a complete updated RoomScene with the same `sceneId`.
The mobile app sends the current scene on every design request; the backend does not store it between requests.
See [backend API instructions](../backend/README.md) for request examples and error handling.
