import type { RoomScene } from '../../app/types';

export interface Room3DProps {
  sceneData: RoomScene;
  viewMode?: 'first' | 'third';
  zoom?: number;
  movement?: { forward: number; turn: number };
  onReady?: () => void;
  onError?: (message: string) => void;
}

export interface CameraGesture {
  yaw: number;
  pitch: number;
}
