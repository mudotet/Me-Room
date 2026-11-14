import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { RoomSceneContents } from './RoomScene';
import { RenderBoundary } from './RenderBoundary';
import { useCameraGesture } from './useCameraGesture';
import type { Room3DProps } from './types';

function WebGLUnavailable({ onError }: Pick<Room3DProps, 'onError'>) {
  useEffect(() => { onError?.('Trình duyệt không hỗ trợ WebGL. Hãy thử trên ứng dụng Me Room.'); }, [onError]);
  return <p>Trình duyệt không hỗ trợ WebGL. Hãy thử trên ứng dụng Me Room.</p>;
}

export default function Room3D(props: Room3DProps) {
  const { gesture, panHandlers } = useCameraGesture();
  return <View style={styles.canvas} {...panHandlers} accessibilityLabel="Mô hình căn phòng 3D. Kéo để thay đổi góc nhìn.">
    <RenderBoundary key={props.sceneData.sceneId} onError={props.onError}>
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [7, 8, 9], fov: 42 }} gl={{ antialias: true }} fallback={<WebGLUnavailable onError={props.onError} />}>
        <RoomSceneContents {...props} gesture={gesture} />
      </Canvas>
    </RenderBoundary>
  </View>;
}

const styles = StyleSheet.create({ canvas: { flex: 1, backgroundColor: '#DCD3E3' } });
