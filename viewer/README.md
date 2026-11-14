# Me Room Viewer

Responsive Three.js room viewer for a mobile browser or React Native WebView. Furniture positions use meters and the scene can be replaced by importing a JSON file or by sending the WebView `LOAD_SCENE` message.

## Requirements and commands

- Node.js 20.19+ or 22.12+
- `npm install` — install Three.js and Vite
- `npm run dev` — start the local viewer
- `npm run build` — create a production build in `dist/`
- `npm run preview` — serve the production build locally

## RoomScene format

See [`room-scene.example.json`](./room-scene.example.json). Dimensions and positions are meters. The floor center is `(0, 0, 0)`, Y is height, object `position` is the bounding-box center, and `rotationY` is radians. Unrecognized `modelId` values render a correctly sized box. The viewer validates required room dimensions, positions, and sizes before replacing the current scene.

```json
{
  "name": "Phòng khách",
  "room": { "width": 5.2, "depth": 4.4, "height": 2.8 },
  "objects": [
    {
      "id": "sofa-1",
      "modelId": "sofa",
      "position": { "x": 0, "y": 0.42, "z": -1.4 },
      "size": { "width": 2.2, "height": 0.84, "depth": 0.9 },
      "rotationY": 0
    }
  ]
}
```

## WebView bridge

Once loaded, the viewer posts `{ "type": "READY" }`. Send a complete scene as `{ "type": "LOAD_SCENE", "payload": <RoomScene> }` using the WebView's message API. For React Native WebView, `window.ReactNativeWebView.postMessage` sends readiness to the native host. The page also listens for browser `message` events.
