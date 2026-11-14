import { useEffect, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, PerspectiveCamera, Vector3 } from 'three';
import type { CameraGesture, Room3DProps } from './types';

type Props = Room3DProps & { gesture: RefObject<CameraGesture> };

export function CameraControls({ sceneData, viewMode = 'third', zoom = 1, movement, gesture }: Props) {
  const { camera } = useThree();
  const walker = useRef({ x: 0, z: 0, yaw: 0 });
  const target = useRef(new Vector3());
  const look = useRef(new Vector3());
  const { width, length, height } = sceneData.room;

  useEffect(() => {
    walker.current = { x: 0, z: length * 0.33, yaw: 0 };
    gesture.current.yaw = 0;
    gesture.current.pitch = 0;
    if (camera instanceof PerspectiveCamera) {
      camera.fov = viewMode === 'first' ? 68 : 42;
      camera.near = 0.03;
      camera.far = Math.max(width, length, height) * 12;
      camera.updateProjectionMatrix();
    }
  }, [camera, sceneData.sceneId, width, length, height, viewMode, gesture]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (viewMode === 'first') {
      walker.current.yaw += (movement?.turn ?? 0) * delta * 1.4;
      const yaw = walker.current.yaw + gesture.current.yaw;
      const distance = (movement?.forward ?? 0) * delta * 1.6;
      const padding = Math.min(0.22, width / 5, length / 5);
      walker.current.x = MathUtils.clamp(walker.current.x + Math.sin(yaw) * distance, -width / 2 + padding, width / 2 - padding);
      walker.current.z = MathUtils.clamp(walker.current.z - Math.cos(yaw) * distance, -length / 2 + padding, length / 2 - padding);
      const eyeHeight = Math.min(1.58, height * 0.65);
      camera.position.set(walker.current.x, eyeHeight, walker.current.z);
      look.current.set(camera.position.x + Math.sin(yaw), eyeHeight - Math.sin(gesture.current.pitch), camera.position.z - Math.cos(yaw));
      camera.lookAt(look.current);
      return;
    }
    const radius = Math.max(width, length) * 1.7 / MathUtils.clamp(zoom, 0.7, 2);
    const yaw = Math.PI / 5 + gesture.current.yaw;
    const elevation = MathUtils.clamp(0.85 + gesture.current.pitch, 0.35, 1.35);
    target.current.set(
      Math.sin(yaw) * radius * Math.cos(elevation),
      Math.sin(elevation) * radius + height * 0.15,
      Math.cos(yaw) * radius * Math.cos(elevation),
    );
    camera.position.lerp(target.current, 1 - Math.exp(-10 * delta));
    look.current.set(0, height * 0.15, 0);
    camera.lookAt(look.current);
  });
  return null;
}
