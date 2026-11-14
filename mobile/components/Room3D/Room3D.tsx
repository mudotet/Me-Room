import { Canvas } from '@react-three/fiber/native';
import { StyleSheet, View } from 'react-native';
import { RoomSceneContents } from './RoomScene';
import { RenderBoundary } from './RenderBoundary';
import { useCameraGesture } from './useCameraGesture';
import type { Room3DProps } from './types';

export type { RoomObject, RoomScene } from '../../app/types';

export default function Room3D(props: Room3DProps) {
  const { gesture, movement, stick, viewRef, onLayout, onTouchEnd, onTouchCancel, panHandlers } = useCameraGesture(props.viewMode !== 'first', Boolean(props.showJoystick), props.controlsEnabled ?? true);
  return <View ref={viewRef} onLayout={onLayout} onTouchEnd={onTouchEnd} onTouchCancel={onTouchCancel} style={[styles.canvas, props.style]} {...panHandlers} accessibilityLabel="Mô hình căn phòng 3D. Kéo để nhìn, dùng joystick bên trái để di chuyển.">
    <RenderBoundary key={props.sceneData.sceneId} onError={props.onError}>
      <Canvas shadows camera={{ position: [7, 8, 9], fov: 42 }} gl={{ antialias: true }}>
        <RoomSceneContents {...props} gesture={gesture} liveMovement={movement} />
      </Canvas>
    </RenderBoundary>
    {props.showJoystick && <View pointerEvents="none" style={styles.joystick} accessible accessibilityLabel="Joystick di chuyển">
      <View style={styles.joystickRing} />
      <View style={[styles.joystickStick, { transform: [{ translateX: stick.x }, { translateY: stick.y }] }]} />
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  canvas: { flex: 1, overflow: 'hidden', backgroundColor: '#DCD3E3' },
  joystick: { position: 'absolute', left: 18, bottom: 18, width: 132, height: 132, justifyContent: 'center', alignItems: 'center' },
  joystickRing: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#35284c66', borderWidth: 1, borderColor: '#ffffffaa' },
  joystickStick: { position: 'absolute', width: 46, height: 46, borderRadius: 23, backgroundColor: '#7356e8', borderWidth: 2, borderColor: '#fbfaff' },
});
