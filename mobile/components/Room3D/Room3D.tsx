import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

type Vector3Data = { x: number; y: number; z: number };
export type RoomObject = {
  id: string;
  type: string;
  modelId?: string;
  position: Vector3Data;
  size: Vector3Data;
  rotationY?: number;
  color?: string;
};
export type RoomScene = {
  sceneId?: string;
  room: { width: number; length: number; height: number; wallColor?: string };
  objects: RoomObject[];
};

type Props = { sceneData: RoomScene; style?: StyleProp<ViewStyle> };
const MIN_ZOOM = 3;
const MAX_ZOOM = 16;

function validDimension(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0.1;
}

function Furniture({ item }: { item: RoomObject }) {
  const size: [number, number, number] = [
    validDimension(item.size.x),
    validDimension(item.size.y),
    validDimension(item.size.z),
  ];
  const position: [number, number, number] = [item.position.x, item.position.y, item.position.z];
  const color = item.color || (item.type === 'bed' ? '#c9b49e' : item.type === 'wardrobe' ? '#b89d7c' : '#98734f');

  // No GLBs are checked into the model catalog yet. Keep geometry data-driven;
  // replace this mesh with the catalog GLTF once those bundled assets exist.
  return (
    <mesh position={position} rotation={[0, item.rotationY || 0, 0]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.78} metalness={0.02} />
    </mesh>
  );
}

function CameraRig({ yaw, pitch, zoom }: { yaw: number; pitch: number; zoom: number }) {
  useFrame(({ camera }) => {
    const radius = zoom;
    camera.position.set(
      Math.sin(yaw) * radius,
      Math.max(0.7, Math.sin(pitch) * radius + 1.2),
      Math.cos(yaw) * radius,
    );
    camera.lookAt(0, 0.6, 0);
  });
  return null;
}

function Room({ sceneData }: { sceneData: RoomScene }) {
  const width = validDimension(sceneData.room.width);
  const length = validDimension(sceneData.room.length);
  const height = validDimension(sceneData.room.height);
  const wall = sceneData.room.wallColor || '#e8ded2';
  return (
    <>
      <color attach="background" args={['#f2eee9']} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 7, 3]} intensity={1.35} castShadow />
      <hemisphereLight args={['#fff8ed', '#81776c', 0.35]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#d8d0c5" roughness={0.92} />
      </mesh>
      {/* Two walls leave the room open toward the camera for inspection. */}
      <mesh position={[-width / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[0.08, height, length]} />
        <meshStandardMaterial color={wall} roughness={0.9} />
      </mesh>
      <mesh position={[0, height / 2, -length / 2]} receiveShadow>
        <boxGeometry args={[width, height, 0.08]} />
        <meshStandardMaterial color={wall} roughness={0.9} />
      </mesh>
      {sceneData.objects.map((item) => <Furniture key={item.id} item={item} />)}
    </>
  );
}

/** Native, data-driven room preview. Drag to orbit and pinch to zoom. */
export default function Room3D({ sceneData, style }: Props) {
  const [camera, setCamera] = useState({ yaw: 0.72, pitch: 0.28, zoom: 8 });
  const gestureStart = useRef({ yaw: 0.72, pitch: 0.28, zoom: 8, distance: 0 });
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const touches = event.nativeEvent.touches || [];
      const distance = touches.length > 1
        ? Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY)
        : 0;
      gestureStart.current = { ...camera, distance };
    },
    onPanResponderMove: (event, gesture) => {
      const touches = event.nativeEvent.touches || [];
      if (touches.length > 1) {
        const distance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
        const start = gestureStart.current;
        if (start.distance === 0) {
          gestureStart.current = { ...start, distance };
          return;
        }
        setCamera((current) => ({ ...current, zoom: THREE.MathUtils.clamp(start.zoom * start.distance / Math.max(distance, 1), MIN_ZOOM, MAX_ZOOM) }));
        return;
      }
      setCamera((current) => ({
        ...current,
        yaw: gestureStart.current.yaw - gesture.dx * 0.006,
        pitch: THREE.MathUtils.clamp(gestureStart.current.pitch + gesture.dy * 0.004, -0.35, 0.9),
      }));
    },
  }), [camera]);

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      <Canvas shadows camera={{ position: [5, 4, 6], fov: 42 }}>
        <CameraRig {...camera} />
        <Room sceneData={sceneData} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, overflow: 'hidden', backgroundColor: '#f2eee9' } });
