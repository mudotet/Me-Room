import { Canvas } from '@react-three/fiber/native';
import { StyleSheet, View } from 'react-native';
import { RoomSceneContents } from './RoomScene';
import { RenderBoundary } from './RenderBoundary';
import { useCameraGesture } from './useCameraGesture';
import type { Room3DProps } from './types';

export type { RoomObject, RoomScene } from '../../app/types';

export default function Room3D(props: Room3DProps) {
  const { gesture, panHandlers } = useCameraGesture(props.zoom === undefined);
  return <View style={[styles.canvas, props.style]} {...panHandlers} accessibilityLabel="Mô hình căn phòng 3D. Vuốt để thay đổi góc nhìn.">
    <RenderBoundary key={props.sceneData.sceneId} onError={props.onError}>
      <Canvas shadows camera={{ position: [7, 8, 9], fov: 42 }} gl={{ antialias: true }}>
        <RoomSceneContents {...props} gesture={gesture} />
      </Canvas>
    </RenderBoundary>
  </View>;
}

const styles = StyleSheet.create({ canvas: { flex: 1, overflow: 'hidden', backgroundColor: '#DCD3E3' } });
