import assert from 'node:assert/strict';
import test from 'node:test';
import * as camera from '../components/Room3D/CameraControls.tsx';

test('first-person forward and strafe follow the current camera yaw', () => {
  const forward = camera.moveWalker({ x: 0, z: 0, yaw: 0 }, { forward: 1, turn: 0 }, Math.PI / 2, 0.5, 10, 10);
  const strafe = camera.moveWalker({ x: 0, z: 0, yaw: 0 }, { forward: 0, strafe: 1, turn: 0 }, 0, 0.5, 10, 10);

  assert.ok(Math.abs(forward.x - 0.8) < 1e-9);
  assert.ok(Math.abs(forward.z) < 1e-9);
  assert.ok(Math.abs(strafe.x - 0.8) < 1e-9);
  assert.ok(Math.abs(strafe.z) < 1e-9);
});

test('diagonal movement is normalized and stays inside room bounds', () => {
  const diagonal = camera.moveWalker({ x: 0, z: 0, yaw: 0 }, { forward: 1, strafe: 1, turn: 0 }, 0, 0.5, 10, 10);
  const bounded = camera.moveWalker({ x: 0.7, z: 0, yaw: 0 }, { forward: 0, strafe: 1, turn: 0 }, 0, 1, 2, 2);

  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.z) - 0.8) < 1e-9);
  assert.ok(Math.abs(bounded.x - 0.78) < 1e-9);
});

test('orbit distance fits every room corner for the actual viewport aspect', () => {
  const room = { width: 4, length: 5, height: 2.8, fov: 42, yaw: Math.PI / 5, elevation: 0.85 };
  const portraitAspect = 0.48;
  const landscapeAspect = 1.8;
  const portraitDistance = camera.fitOrbitDistance(room.width, room.length, room.height, portraitAspect, room.fov, room.yaw, room.elevation);
  const landscapeDistance = camera.fitOrbitDistance(room.width, room.length, room.height, landscapeAspect, room.fov, room.yaw, room.elevation);

  assert.ok(portraitDistance > landscapeDistance);
  for (const [aspect, distance] of [[portraitAspect, portraitDistance], [landscapeAspect, landscapeDistance]]) {
    const verticalHalfFov = room.fov * Math.PI / 360;
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * aspect);
    const direction = [Math.cos(room.elevation) * Math.sin(room.yaw), Math.sin(room.elevation), Math.cos(room.elevation) * Math.cos(room.yaw)];
    const right = [Math.cos(room.yaw), 0, -Math.sin(room.yaw)];
    const up = [-Math.sin(room.elevation) * Math.sin(room.yaw), Math.cos(room.elevation), -Math.sin(room.elevation) * Math.cos(room.yaw)];

    for (const x of [-room.width / 2, room.width / 2]) {
      for (const y of [-room.height / 2, room.height / 2]) {
        for (const z of [-room.length / 2, room.length / 2]) {
          const point = [x, y, z];
          const dot = (basis) => point.reduce((sum, value, index) => sum + value * basis[index], 0);
          const depth = distance - dot(direction);
          assert.ok(depth > 0);
          assert.ok(Math.abs(dot(right)) <= depth * Math.tan(horizontalHalfFov));
          assert.ok(Math.abs(dot(up)) <= depth * Math.tan(verticalHalfFov));
        }
      }
    }
  }
});
