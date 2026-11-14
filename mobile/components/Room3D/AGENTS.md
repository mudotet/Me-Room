# Native 3D Agent Team

The main session started in this directory is the lead crewmate for native room rendering.
Read the Quang section in repository-root `docs/huong-dan-thanh-vien.md` for implementation order, deliverables, and integration checks.
Read `.codex/TEAM.md` here, the parent mobile instructions, and the repository-level `AGENTS.md`.

## Scope and Ownership

Own `mobile/components/Room3D/` and the model catalog in `mobile/assets/models/`.
This ownership specializes the parent mobile team's scope.
The mobile app team owns screens, API calls, and RoomScene state.
Do not create a standalone web viewer or a second Expo project.
Coordinate Expo dependencies, the lockfile, and Metro configuration with the mobile lead and assign one writer.

## Native Component Contract

Implement `<Room3D sceneData={roomScene} />` using `@react-three/fiber/native` inside the existing Expo application.
Read repository-root `shared/README.md` and `shared/example.json` before implementing scene consumption.
React prop changes must update rendering; do not mutate the input scene or hardcode one layout.
Use meters, vertical Y, floor center `(0, 0, 0)`, object bounding-box centers, and radians for `rotationY`.
Normalize GLB scale, orientation, and bounds, and provide box fallbacks for unknown or failed models.

## Coordination and Verification

Delegate through coder, tester, reviewer, and confirmer with bounded tasks and one writer per file.
Use native messaging with the lead as relay when needed; teammates do not spawn agents.
Reproduce rendering bugs on the affected device where possible before editing.
Verify two data-driven layouts, scene prop updates, camera gestures, missing-model fallback, and resource cleanup.
Prioritize an actual iPhone spike: a box with camera control, multiple JSON objects, and a textured GLB.
Report simulator and physical-device outcomes separately and never claim unrun rendering checks passed.
