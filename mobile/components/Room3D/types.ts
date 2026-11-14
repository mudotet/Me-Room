import type { StyleProp, ViewStyle } from 'react-native';
import type { RoomScene } from '../../app/types';

export interface Room3DProps {
  sceneData: RoomScene;
  style?: StyleProp<ViewStyle>;
  viewMode?: 'first' | 'third';
  /** An explicit zoom is controlled by the screen; omit it to enable pinch zoom. */
  zoom?: number;
  movement?: { forward: number; turn: number };
  onReady?: () => void;
  onError?: (message: string) => void;
}

export interface CameraGesture {
  yaw: number;
  pitch: number;
  zoom: number;
}
