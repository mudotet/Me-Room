# Room3D

One Expo component with platform-specific Canvas entry points. Native imports `@react-three/fiber/native`; the web preview uses `@react-three/fiber`. Both consume the same scene and camera code.

```tsx
<Room3D
  sceneData={roomScene}
  viewMode="third"
  zoom={1}
  showJoystick={false}
  controlsEnabled={true}
  onReady={() => setLoading(false)}
  onError={setError}
/>
```

`viewMode` defaults to `third`; combined button and pinch zoom is constrained to 0.7–2.
Set `showJoystick` in first-person mode to enable the built-in left joystick.
One responder tracks each touch independently so movement and look gestures can run together.
Set `controlsEnabled={false}` when a chat panel covers the renderer.
Optional external movement uses `{forward, turn, strafe?}` values in the range -1–1.
The screen owns orientation, loading status, and overlay controls.
Dragging the canvas changes orbit or first-person look without updating camera angles in React state every frame.
The camera stays within room boundaries; furniture collision is not modeled.

The renderer follows `shared/README.md`: meters, Y up, floor center origin, object bounding-box centers, and rotation around Y in radians. It reads props without modifying them. A new scene updates geometry; a new scene ID resets the camera. No arbitrary model URLs are loaded.

There are no bundled GLB assets in the supplied project. Furniture is shown using box fallbacks, with small type-specific details contained in each object's bounds. Floor boards and skirting are illustrative material treatments, not measurements inferred from a recording. Native textured GLB loading has **not** been implemented or verified.

Run `npm run typecheck` from `mobile/` after dependency installation. Browser checks do not establish native compatibility. Required device follow-up: a physical iPhone should render both fixture layouts, accept repeated scene changes, drag/orbit, move and turn in landscape, restore portrait, and load a licensed textured GLB before adding a production asset catalog.
