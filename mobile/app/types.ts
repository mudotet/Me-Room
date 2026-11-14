/** RoomScene contract; dimensions are metres, Y is up, rotationY is radians. */
export type Vector3 = Readonly<{ x: number; y: number; z: number }>;

export type RoomObject = Readonly<{
  id: string;
  type: string;
  modelId: string;
  position: Vector3;
  size: Vector3;
  rotationY: number;
  color: string;
  confidence: number;
}>;

export type RoomScene = Readonly<{
  sceneId: string;
  room: Readonly<{ width: number; length: number; height: number; wallColor: string }>;
  objects: readonly RoomObject[];
}>;

export type Capture = Readonly<{
  uri: string;
  mimeType: string;
  fileName: string;
  webFile?: Blob;
  /** Optional picker metadata used for local upload size validation. */
  fileSize?: number;
}>;

export type SceneResult = Readonly<{ scene: RoomScene; message?: string }>;
