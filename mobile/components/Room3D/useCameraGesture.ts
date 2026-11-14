import { useMemo, useRef } from 'react';
import { PanResponder, type GestureResponderEvent } from 'react-native';
import type { CameraGesture } from './types';

type GestureOrigin = CameraGesture & { distance: number; dx: number; dy: number };

function touchDistance(event: GestureResponderEvent) {
  const touches = event.nativeEvent.touches || [];
  return touches.length > 1
    ? Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY)
    : 0;
}

/** Keep continuous gesture values outside React render state. */
export function useCameraGesture(allowPinchZoom = true) {
  const gesture = useRef<CameraGesture>({ yaw: 0, pitch: 0, zoom: 1 });
  const origin = useRef<GestureOrigin>({ ...gesture.current, distance: 0, dx: 0, dy: 0 });
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (event, state) => touchDistance(event) > 0 || Math.abs(state.dx) + Math.abs(state.dy) > 3,
    onPanResponderGrant: (event) => {
      origin.current = { ...gesture.current, distance: touchDistance(event), dx: 0, dy: 0 };
    },
    onPanResponderMove: (event, state) => {
      const distance = touchDistance(event);
      const start = origin.current;
      if (distance > 0) {
        if (start.distance === 0) {
          origin.current = { ...gesture.current, distance, dx: state.dx, dy: state.dy };
          return;
        }
        if (allowPinchZoom) {
          gesture.current.zoom = Math.max(0.7, Math.min(2, start.zoom * distance / start.distance));
        }
        return;
      }
      if (start.distance > 0) {
        // Rebase when one finger lifts so orbit resumes without a sudden jump.
        origin.current = { ...gesture.current, distance: 0, dx: state.dx, dy: state.dy };
        return;
      }
      gesture.current.yaw = start.yaw - (state.dx - start.dx) * 0.006;
      gesture.current.pitch = Math.max(-0.65, Math.min(0.65, start.pitch + (state.dy - start.dy) * 0.004));
    },
    onPanResponderTerminationRequest: () => true,
  }), [allowPinchZoom]);
  return { gesture, panHandlers: responder.panHandlers };
}
