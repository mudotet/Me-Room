import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, PerspectiveCamera, Vector3 } from 'three';
import type { CameraGesture, MovementInput, Room3DProps } from './types';

type Props = Room3DProps & { gesture: RefObject<CameraGesture>; liveMovement?: RefObject<MovementInput> };
type Walker = { x: number; z: number; yaw: number };

export function moveWalker(walker: Walker, movement: MovementInput, lookYaw: number, delta: number, width: number, length: number): Walker {
  const yaw = walker.yaw + movement.turn * delta * 1.4;
  const magnitude = Math.hypot(movement.forward, movement.strafe ?? 0);
  const scale = magnitude > 1 ? 1 / magnitude : 1;
  const forward = movement.forward * scale;
  const strafe = (movement.strafe ?? 0) * scale;
  const direction = yaw + lookYaw;
  const padding = Math.min(0.22, width / 5, length / 5);
  return {
    yaw,
    x: MathUtils.clamp(walker.x + (Math.sin(direction) * forward + Math.cos(direction) * strafe) * delta * 1.6, -width / 2 + padding, width / 2 - padding),
    z: MathUtils.clamp(walker.z + (-Math.cos(direction) * forward + Math.sin(direction) * strafe) * delta * 1.6, -length / 2 + padding, length / 2 - padding),
  };
}

export function fitOrbitDistance(width: number, length: number, height: number, aspect: number, fov: number, yaw: number, elevation: number): number {
  const verticalHalfFov = fov * Math.PI / 360;
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * Math.max(aspect, 0.001));
  const direction = [Math.cos(elevation) * Math.sin(yaw), Math.sin(elevation), Math.cos(elevation) * Math.cos(yaw)];
  const right = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const up = [-Math.sin(elevation) * Math.sin(yaw), Math.cos(elevation), -Math.sin(elevation) * Math.cos(yaw)];
  const targetY = height / 2;
  const corners = [-width / 2, width / 2].flatMap(x => [-0.15, height].flatMap(y => [-length / 2, length / 2].map(z => [x, y - targetY, z])));
  let distance = 0;
  for (const point of corners) {
    const dot = (basis: number[]) => point.reduce((sum, value, index) => sum + value * basis[index], 0);
    const towardCamera = dot(direction);
    distance = Math.max(
      distance,
      towardCamera + Math.abs(dot(right)) / Math.tan(horizontalHalfFov),
      towardCamera + Math.abs(dot(up)) / Math.tan(verticalHalfFov),
    );
  }
  return distance * 1.08;
}

export function CameraControls({ sceneData, viewMode = 'third', zoom, movement, gesture, liveMovement }: Props) {
  const { camera, size } = useThree();
  const walker = useRef({ x: 0, z: 0, yaw: 0 });
  const target = useRef(new Vector3());
  const look = useRef(new Vector3());
  const { width, length, height } = sceneData.room;

  useEffect(() => {
    const padding = Math.min(0.22, width / 5, length / 5);
    walker.current = { x: 0, z: Math.min(length * 0.33, length / 2 - padding), yaw: 0 };
    gesture.current.yaw = 0;
    gesture.current.pitch = 0;
    gesture.current.zoom = 1;
    if (camera instanceof PerspectiveCamera) {
      camera.fov = viewMode === 'first' ? 68 : 42;
      camera.aspect = size.width / Math.max(size.height, 1);
      camera.near = 0.03;
      camera.far = Math.max(width, length, height) * 12;
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height, sceneData.sceneId, width, length, height, viewMode, gesture]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (viewMode === 'first') {
      walker.current = moveWalker(walker.current, liveMovement?.current ?? movement ?? { forward: 0, turn: 0 }, gesture.current.yaw, delta, width, length);
      const yaw = walker.current.yaw + gesture.current.yaw;
      const eyeHeight = Math.min(1.58, height * 0.65);
      camera.position.set(walker.current.x, eyeHeight, walker.current.z);
      look.current.set(camera.position.x + Math.sin(yaw), eyeHeight - Math.sin(gesture.current.pitch), camera.position.z - Math.cos(yaw));
      camera.lookAt(look.current);
      return;
    }
    const yaw = Math.PI / 5 + gesture.current.yaw;
    const elevation = MathUtils.clamp(0.85 + gesture.current.pitch, 0.35, 1.35);
    const radius = fitOrbitDistance(width, length, height, size.width / Math.max(size.height, 1), 42, yaw, elevation)
      / MathUtils.clamp((zoom ?? 1) + gesture.current.zoom - 1, 0.7, 2);
    look.current.set(0, height / 2, 0);
    target.current.set(
      look.current.x + Math.sin(yaw) * radius * Math.cos(elevation),
      look.current.y + Math.sin(elevation) * radius,
      look.current.z + Math.cos(yaw) * radius * Math.cos(elevation),
    );
    camera.position.lerp(target.current, 1 - Math.exp(-10 * delta));
    camera.lookAt(look.current);
  });
  return null;
}
