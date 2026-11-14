import type { RoomObject, RoomScene, Vector3 } from './types';

export class SceneValidationError extends Error {
  constructor() {
    super('Dữ liệu căn phòng chưa hợp lệ. Vui lòng thử lại hoặc quét một video khác.');
    this.name = 'SceneValidationError';
  }
}

function fail(): never {
  throw new SceneValidationError();
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail();
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(value)) fail();
  return value;
}

function number(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) fail();
  return value;
}

function color(value: unknown): string {
  if (typeof value !== 'string' || !/^#[\da-f]{6}$/i.test(value)) fail();
  return value;
}

function vector(value: unknown, min: number, max: number): Vector3 {
  const source = record(value);
  return Object.freeze({ x: number(source.x, min, max), y: number(source.y, min, max), z: number(source.z, min, max) });
}

/** Validate at the network boundary and copy/freeze accepted values, never freeze caller data. */
export function parseRoomScene(value: unknown): RoomScene {
  const source = record(value);
  const inputRoom = record(source.room);
  const room = Object.freeze({
    width: number(inputRoom.width, 0.5, 100),
    length: number(inputRoom.length, 0.5, 100),
    height: number(inputRoom.height, 0.5, 20),
    wallColor: color(inputRoom.wallColor),
  });
  if (!Array.isArray(source.objects) || source.objects.length > 100) fail();
  const ids = new Set<string>();
  const objects = source.objects.map((input): RoomObject => {
    const object = record(input);
    const id = text(object.id);
    if (ids.has(id)) fail();
    ids.add(id);
    const position = vector(object.position, -100, 100);
    const size = vector(object.size, 0.01, 100);
    const rotationY = number(object.rotationY, -Math.PI * 100, Math.PI * 100);
    // The backend allows estimated geometry to cross room boundaries. Keep finite
    // GPU-safe values without rejecting those estimates or altering their layout.
    return Object.freeze({
      id,
      type: text(object.type),
      modelId: text(object.modelId),
      position,
      size,
      rotationY,
      color: color(object.color),
      confidence: number(object.confidence, 0, 1),
    });
  });
  return Object.freeze({ sceneId: text(source.sceneId), room, objects: Object.freeze(objects) });
}
