import { Canvas } from '@react-three/fiber/native';
import { StyleSheet, View } from 'react-native';
import { RoomSceneContents } from './RoomScene';
import { RenderBoundary } from './RenderBoundary';
import { useCameraGesture } from './useCameraGesture';
import type { Room3DProps } from './types';

export default function Room3D(props: Room3DProps) {
  const { gesture, panHandlers } = useCameraGesture();
  return <View style={styles.canvas} {...panHandlers} accessibilityLabel="Mô hình căn phòng 3D. Vuốt để thay đổi góc nhìn.">
    <RenderBoundary key={props.sceneData.sceneId} onError={props.onError}>
      <Canvas shadows camera={{ position: [7, 8, 9], fov: 42 }} gl={{ antialias: true }}>
        <RoomSceneContents {...props} gesture={gesture} />
      </Canvas>
    </RenderBoundary>
  </View>;
}

const styles = StyleSheet.create({ canvas: { flex: 1, backgroundColor: '#DCD3E3' } });
