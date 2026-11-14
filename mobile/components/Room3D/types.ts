import type { StyleProp, ViewStyle } from 'react-native';
import type { RoomScene } from '../../app/types';

export interface Room3DProps {
  sceneData: RoomScene;
  style?: StyleProp<ViewStyle>;
  viewMode?: 'first' | 'third';
  /** Screen zoom is the baseline; pinch zoom adjusts it while orbiting. */
  zoom?: number;
  movement?: MovementInput;
  showJoystick?: boolean;
  controlsEnabled?: boolean;
  onReady?: () => void;
  onError?: (message: string) => void;
}

export type MovementInput = { forward: number; turn: number; strafe?: number };

export interface CameraGesture {
  yaw: number;
  pitch: number;
  zoom: number;
}
