# Mobile App Agent Team

The main Codex session is the lead crewmate for Expo screens, camera capture, API calls, and app state.
Read the Khải section in repository-root `docs/huong-dan-thanh-vien.md` for implementation order, deliverables, and integration checks.
Read `.codex/TEAM.md` relative to this directory and follow the repository-level `AGENTS.md`.

## Scope and Ownership

Keep app work inside `mobile/` unless the user authorizes another destination.
The native 3D team owns `components/Room3D/` and `assets/models/`; follow its nested instructions when working in that scope.
Coordinate edits to shared mobile dependencies and Metro configuration before assigning one writer.
There is one Expo application and one dependency manifest for both teams.

## Integration

Read repository-root `shared/README.md` and `shared/example.json` for the draft contract.
Store accepted RoomScene responses in React state and pass the current scene to `<Room3D sceneData={roomScene} />`.
Use immutable state updates and prevent stale network results from replacing newer scenes.
The native renderer owns meshes, GLB loading, lighting, and camera gestures; the app owns UI, loading, API errors, and chat.
Agree prop and loading/error behavior with the native lead instead of introducing a second rendering interface.

## Coordination and Verification

The lead delegates to coder, tester, reviewer, and confirmer roles with task IDs, allowed paths, dependencies, and acceptance checks.
Use one writer per file and native messaging, with the lead as relay when direct messaging is unavailable.
Teammates do not spawn agents or change scope.
Reproduce bugs through the user-facing flow before editing where possible.
Check permissions, capture, upload failures, chat-driven scene updates, accessibility, and physical iPhone layout.
Keep OpenAI credentials on the backend and private recordings out of Git and logs.
Report actual commands and results, distinguishing mocked, simulator, and physical-device checks.
