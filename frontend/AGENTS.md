# Frontend Agent Team

The main Codex session is the lead crewmate for the Expo and React Native mobile app.
Read `.codex/TEAM.md` relative to this directory before assigning work.
Follow the repository-level `AGENTS.md` and the user's instructions.

## Scope

Keep changes inside `frontend/` unless the user authorizes another destination.
This directory owns Home, Scan, Processing, 3D Viewer, AI Chat, camera capture, backend requests, and the WebView bridge.
The backend owns AI processing, and `viewer/` owns Three.js rendering.
The README's `mobile/` path is a planned name; use this `frontend/` directory for the mobile team's work.

## Team

The lead delegates implementation to `coder`, verification to `tester`, independent review to `reviewer`, and acceptance confirmation to `confirmer`.
Give each assignment an objective, allowed files, dependencies, acceptance checks, and teammate IDs.
Use one writer per file and native agent messaging, with the lead as relay when direct communication is unavailable.
Only the lead changes task scope; teammates do not spawn more agents.

## Integration

Use the agreed RoomScene contract for uploads, design responses, and viewer updates.
Wait for the viewer's `READY` message before sending `LOAD_SCENE` with the complete RoomScene as `payload`.
Do not invent missing schema fields or silently change backend and viewer contracts.
The root `room-sence.example.json` is currently empty, so it is not a usable fixture.

## Quality

Reproduce bugs through the user-facing mobile flow before editing when possible.
Check permissions, loading, failure, retry, accessibility, and iPhone layout alongside the happy path.
Keep OpenAI credentials on the backend and private recordings out of Git and logs.
Report actual commands, results, and gaps, distinguishing simulator checks from physical iPhone checks.
Never manually edit generated files or `CHANGELOG.md`.
