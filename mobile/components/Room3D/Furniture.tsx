import type { RoomScene } from '../../app/types';

type FurnitureItem = RoomScene['objects'][number];
type BoxProps = {
  position?: [number, number, number];
  size: [number, number, number];
  color: string;
};

function Box({ position = [0, 0, 0], size, color }: BoxProps) {
  return <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={0.88} />
  </mesh>;
}

/**
 * The draft catalog contains IDs but no GLBs. These are box fallbacks, not
 * reconstructions of a scanned room. Details stay inside the supplied bounds.
 */
export function Furniture({ item }: { item: FurnitureItem }) {
  const { x: w, y: h, z: d } = item.size;
  const position: [number, number, number] = [item.position.x, item.position.y, item.position.z];
  const common = { position, rotation: [0, item.rotationY, 0] as [number, number, number] };

  if (item.type === 'bed') {
    return <group {...common}>
      <Box size={[w, h * 0.5, d]} position={[0, -h * 0.25, 0]} color={item.color} />
      <Box size={[w * 0.97, h * 0.5, d * 0.98]} position={[0, h * 0.25, 0]} color="#F5EEE9" />
      <Box size={[w * 0.98, h * 0.08, d * 0.56]} position={[0, h * 0.45, d * 0.18]} color={item.color} />
      <Box size={[w * 0.36, h * 0.13, d * 0.19]} position={[-w * 0.23, h * 0.43, -d * 0.32]} color="#FEFCF8" />
      <Box size={[w * 0.36, h * 0.13, d * 0.19]} position={[w * 0.23, h * 0.43, -d * 0.32]} color="#FEFCF8" />
    </group>;
  }
  if (item.type === 'sofa') {
    return <group {...common}>
      <Box size={[w, h * 0.4, d]} position={[0, -h * 0.3, 0]} color={item.color} />
      <Box size={[w, h * 0.62, d * 0.24]} position={[0, h * 0.19, -d * 0.38]} color={item.color} />
      {[-1, 1].map(side => <Box key={side} size={[w * 0.12, h * 0.7, d]} position={[side * w * 0.44, -h * 0.15, 0]} color={item.color} />)}
      {[-1, 1].map(side => <Box key={side} size={[w * 0.35, h * 0.14, d * 0.7]} position={[side * w * 0.19, -h * 0.02, d * 0.1]} color="#E5DAEA" />)}
    </group>;
  }
  if (item.type === 'desk' || item.type === 'table' || item.type === 'coffee_table') {
    const leg = Math.min(w, d) * 0.09;
    return <group {...common}>
      <Box size={[w, h * 0.12, d]} position={[0, h * 0.44, 0]} color={item.color} />
      {[-1, 1].flatMap(x => [-1, 1].map(z => <Box key={`${x}-${z}`} size={[leg, h * 0.88, leg]} position={[x * (w / 2 - leg), -h * 0.06, z * (d / 2 - leg)]} color={item.color} />))}
    </group>;
  }
  if (item.type === 'chair') {
    return <group {...common}>
      <Box size={[w, h * 0.12, d]} color={item.color} />
      <Box size={[w, h * 0.5, d * 0.14]} position={[0, h * 0.25, -d * 0.43]} color={item.color} />
      {[-1, 1].flatMap(x => [-1, 1].map(z => <Box key={`${x}-${z}`} size={[w * 0.12, h * 0.44, d * 0.12]} position={[x * w * 0.38, -h * 0.28, z * d * 0.38]} color="#897460" />))}
    </group>;
  }
  if (item.type === 'wardrobe') {
    return <group {...common}>
      <Box size={[w, h, d]} color={item.color} />
      <Box size={[w * 0.018, h * 0.92, d * 0.008]} position={[0, 0, d * 0.498]} color="#8B7568" />
      {[-1, 1].map(side => <Box key={side} size={[w * 0.025, h * 0.11, d * 0.018]} position={[side * w * 0.07, 0, d * 0.49]} color="#EAD9B6" />)}
    </group>;
  }
  return <group {...common}><Box size={[w, h, d]} color={item.color} /></group>;
}
