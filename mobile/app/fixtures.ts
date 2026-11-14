import sharedBedroom from '../../shared/example.json';
import { parseRoomScene } from './scene';

/** Synthetic preview data, never presented as an AI scan result or measured accuracy. */
export const bedroomScene = parseRoomScene(sharedBedroom);

/** Second independent layout exercises scene replacement and renderer bounds. */
export const livingScene = parseRoomScene({
  sceneId: 'demo-living-001',
  room: { width: 5.2, length: 5.8, height: 3, wallColor: '#DED6EF' },
  objects: [
    { id: 'sofa-1', type: 'sofa', modelId: 'sofa-soft-01', position: { x: -1.75, y: 0.48, z: -0.65 }, size: { x: 1.15, y: 0.96, z: 2.5 }, rotationY: 0, color: '#A793D7', confidence: 0.9 },
    { id: 'table-1', type: 'table', modelId: 'table-round-01', position: { x: -0.1, y: 0.23, z: -0.55 }, size: { x: 1.15, y: 0.46, z: 1.15 }, rotationY: 0, color: '#CAA88C', confidence: 0.88 },
    { id: 'chair-1', type: 'chair', modelId: 'chair-lounge-01', position: { x: 1.3, y: 0.5, z: 0.65 }, size: { x: 0.85, y: 1, z: 0.85 }, rotationY: -0.45, color: '#E8BF8E', confidence: 0.85 },
    { id: 'cabinet-1', type: 'cabinet', modelId: 'cabinet-low-01', position: { x: 1.85, y: 0.45, z: -1.65 }, size: { x: 0.6, y: 0.9, z: 1.7 }, rotationY: 0, color: '#8E7D74', confidence: 0.84 },
    { id: 'rug-1', type: 'rug', modelId: 'rug-soft-01', position: { x: -0.05, y: 0.015, z: -0.2 }, size: { x: 2.6, y: 0.03, z: 3.5 }, rotationY: 0, color: '#C4B6D9', confidence: 0.86 },
  ],
});
