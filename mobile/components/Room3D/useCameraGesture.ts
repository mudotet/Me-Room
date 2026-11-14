import { useMemo, useRef } from 'react';
import { PanResponder } from 'react-native';
import type { CameraGesture } from './types';

/** Keep continuous gesture values outside React render state. */
export function useCameraGesture() {
  const gesture = useRef<CameraGesture>({ yaw: 0, pitch: 0 });
  const origin = useRef<CameraGesture>({ yaw: 0, pitch: 0 });
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, state) => Math.abs(state.dx) + Math.abs(state.dy) > 3,
    onPanResponderGrant: () => { origin.current = { ...gesture.current }; },
    onPanResponderMove: (_, state) => {
      gesture.current.yaw = origin.current.yaw - state.dx * 0.006;
      gesture.current.pitch = Math.max(-0.65, Math.min(0.65, origin.current.pitch + state.dy * 0.004));
    },
    onPanResponderTerminationRequest: () => true,
  }), []);
  return { gesture, panHandlers: responder.panHandlers };
}
