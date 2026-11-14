import { useCallback, useEffect, useMemo, useRef, useState, type ElementRef } from 'react';
import { AppState, PanResponder, View, type GestureResponderEvent } from 'react-native';
import type { CameraGesture, MovementInput } from './types';

const JOYSTICK_SIZE = 132;
const JOYSTICK_OFFSET = 18;
const JOYSTICK_RADIUS = 44;
const STOPPED: MovementInput = { forward: 0, strafe: 0, turn: 0 };

type TouchPoint = { identifier: number; pageX: number; pageY: number };
type TrackedTouch = { kind: 'look' | 'move' | 'ignore'; x: number; y: number };

/** One responder routes each finger independently so joystick and look can run together. */
export function useCameraGesture(allowPinchZoom = true, joystickEnabled = false, controlsEnabled = true) {
  const gesture = useRef<CameraGesture>({ yaw: 0, pitch: 0, zoom: 1 });
  const movement = useRef<MovementInput>(STOPPED);
  const touches = useRef(new Map<number, TrackedTouch>());
  const bounds = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const viewRef = useRef<ElementRef<typeof View>>(null);
  const pinchDistance = useRef(0);
  const [stick, setStick] = useState({ x: 0, y: 0 });

  const clearMovement = useCallback(() => {
    movement.current = STOPPED;
    setStick({ x: 0, y: 0 });
  }, []);
  const clearTouches = useCallback(() => {
    touches.current.clear();
    pinchDistance.current = 0;
    clearMovement();
  }, [clearMovement]);
  const onLayout = useCallback(() => {
    viewRef.current?.measureInWindow((x, y, width, height) => { bounds.current = { x, y, width, height }; });
  }, []);
  const localPoint = useCallback((touch: TouchPoint) => ({
    x: touch.pageX - bounds.current.x,
    y: touch.pageY - bounds.current.y,
  }), []);
  const registerTouches = useCallback((event: GestureResponderEvent) => {
    const changed = Array.from(event.nativeEvent.changedTouches || []) as TouchPoint[];
    const active = Array.from(event.nativeEvent.touches || []) as TouchPoint[];
    for (const touch of [...changed, ...active]) {
      if (touches.current.has(touch.identifier)) continue;
      const point = localPoint(touch);
      const inJoystick = joystickEnabled
        && point.x <= JOYSTICK_OFFSET + JOYSTICK_SIZE
        && point.y >= bounds.current.height - JOYSTICK_OFFSET - JOYSTICK_SIZE;
      const kind = inJoystick ? 'move' : joystickEnabled && point.x < bounds.current.width / 2 ? 'ignore' : 'look';
      touches.current.set(touch.identifier, { kind, ...point });
    }
  }, [joystickEnabled, localPoint]);
  const moveTouches = useCallback((event: GestureResponderEvent) => {
    if (!controlsEnabled) return;
    registerTouches(event);
    const active = Array.from(event.nativeEvent.touches || []) as TouchPoint[];
    const tracked = active.map(touch => [touch, touches.current.get(touch.identifier)] as const);
    const joystickTouch = tracked.find(([, item]) => item?.kind === 'move')?.[0];
    const lookTouches = tracked.filter(([, item]) => item?.kind === 'look');
    const pinching = allowPinchZoom && lookTouches.length > 1;

    for (const [touch, item] of tracked) {
      if (!item) continue;
      const point = localPoint(touch);
      if (item.kind === 'move' && joystickTouch?.identifier === touch.identifier) {
        const dx = point.x - JOYSTICK_OFFSET - JOYSTICK_SIZE / 2;
        const dy = point.y - bounds.current.height + JOYSTICK_OFFSET + JOYSTICK_SIZE / 2;
        const distance = Math.hypot(dx, dy);
        const scale = distance > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / distance : 1;
        const x = dx * scale;
        const y = dy * scale;
        setStick({ x, y });
        movement.current = { forward: -y / JOYSTICK_RADIUS, strafe: x / JOYSTICK_RADIUS, turn: 0 };
      } else if (item.kind === 'look' && !pinching && lookTouches[0]?.[0].identifier === touch.identifier) {
        gesture.current.yaw -= (point.x - item.x) * 0.006;
        gesture.current.pitch = Math.max(-0.65, Math.min(0.65, gesture.current.pitch + (point.y - item.y) * 0.004));
      }
      item.x = point.x;
      item.y = point.y;
    }

    if (pinching) {
      const first = lookTouches[0][1]!;
      const second = lookTouches[1][1]!;
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      if (pinchDistance.current > 0) gesture.current.zoom = Math.max(0.7, Math.min(2, gesture.current.zoom * distance / pinchDistance.current));
      pinchDistance.current = distance;
    } else {
      pinchDistance.current = 0;
    }
  }, [allowPinchZoom, controlsEnabled, localPoint, registerTouches]);
  const endTouches = useCallback((event: GestureResponderEvent) => {
    let stoppedJoystick = false;
    for (const touch of Array.from(event.nativeEvent.changedTouches || []) as TouchPoint[]) {
      if (touches.current.get(touch.identifier)?.kind === 'move') stoppedJoystick = true;
      touches.current.delete(touch.identifier);
    }
    if (stoppedJoystick) clearMovement();
    pinchDistance.current = 0;
  }, [clearMovement]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') clearTouches(); });
    return () => subscription.remove();
  }, [clearTouches]);
  useEffect(() => {
    if (!controlsEnabled || !joystickEnabled) clearTouches();
    return () => { touches.current.clear(); movement.current = STOPPED; pinchDistance.current = 0; };
  }, [controlsEnabled, joystickEnabled, clearTouches]);

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => controlsEnabled,
    onStartShouldSetPanResponderCapture: () => controlsEnabled,
    onMoveShouldSetPanResponder: () => controlsEnabled,
    onPanResponderGrant: registerTouches,
    onPanResponderMove: moveTouches,
    onPanResponderRelease: clearTouches,
    onPanResponderTerminate: clearTouches,
    onPanResponderTerminationRequest: () => true,
  }), [clearTouches, controlsEnabled, moveTouches, registerTouches]);

  return {
    gesture,
    movement: joystickEnabled ? movement : undefined,
    stick,
    viewRef,
    onLayout,
    onTouchEnd: endTouches,
    onTouchCancel: endTouches,
    panHandlers: responder.panHandlers,
  };
}
