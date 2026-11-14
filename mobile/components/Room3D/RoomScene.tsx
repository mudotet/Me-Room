import { useEffect, type RefObject } from 'react';
import { BackSide } from 'three';
import { CameraControls } from './CameraControls';
import { Furniture } from './Furniture';
import type { CameraGesture, Room3DProps } from './types';

export function RoomSceneContents(props: Room3DProps & { gesture: RefObject<CameraGesture> }) {
  const { sceneData, viewMode = 'third', onReady } = props;
  const { width, length, height, wallColor } = sceneData.room;
  useEffect(() => { onReady?.(); }, [sceneData, onReady]);
  return <>
    <color attach="background" args={['#DCD3E3']} />
    <ambientLight intensity={0.9} />
    <hemisphereLight args={['#FFFAF3', '#B7A6CA', 1.8]} />
    <directionalLight position={[width, height * 3, length]} intensity={2.1} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-width} shadow-camera-right={width} shadow-camera-top={length} shadow-camera-bottom={-length} shadow-normalBias={0.04} />
    <CameraControls {...props} />
    <mesh position={[0, -0.075, 0]} receiveShadow>
      <boxGeometry args={[width + 0.16, 0.15, length + 0.16]} />
      <meshStandardMaterial color="#CBB7A6" roughness={0.9} />
    </mesh>
    {/* Floor boards are a rendering material treatment, not inferred room data. */}
    {Array.from({ length: Math.ceil(width / 0.45) }, (_, index) => {
      const x = -width / 2 + index * 0.45;
      const boardWidth = Math.min(0.44, width / 2 - x);
      return <mesh key={index} position={[x + boardWidth / 2, 0.001, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[boardWidth, length]} />
        <meshStandardMaterial color={index % 3 === 0 ? '#DDCFC0' : '#E4D7C9'} roughness={0.95} />
      </mesh>;
    })}
    {/* Inward-facing walls reveal the interior when orbiting from outside. */}
    <mesh position={[0, height / 2, -length / 2]} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial color={wallColor} roughness={0.95} />
    </mesh>
    <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
      <planeGeometry args={[length, height]} />
      <meshStandardMaterial color={wallColor} roughness={0.95} />
    </mesh>
    {viewMode === 'first' && <>
      <mesh position={[width / 2 + 0.04, height / 2, 0]} receiveShadow><boxGeometry args={[0.08, height, length]} /><meshStandardMaterial color={wallColor} /></mesh>
      <mesh position={[0, height / 2, length / 2 + 0.04]} receiveShadow><boxGeometry args={[width, height, 0.08]} /><meshStandardMaterial color={wallColor} /></mesh>
      <mesh position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[width, length]} /><meshStandardMaterial color="#FAF5F3" side={BackSide} /></mesh>
    </>}
    <mesh position={[0, 0.055, -length / 2 + 0.015]}><boxGeometry args={[width, 0.11, 0.035]} /><meshStandardMaterial color="#FAF5F3" /></mesh>
    <mesh position={[-width / 2 + 0.015, 0.055, 0]}><boxGeometry args={[0.035, 0.11, length]} /><meshStandardMaterial color="#FAF5F3" /></mesh>
    {sceneData.objects.map(item => <Furniture key={item.id} item={item} />)}
  </>;
}
