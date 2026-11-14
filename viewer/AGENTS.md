# Viewer Agent Team

The main Codex session is the lead crewmate for the Three.js room viewer.
Read `.codex/TEAM.md` relative to this directory before assigning work.
Follow the repository-level `AGENTS.md` and the user's instructions.

## Scope

Keep changes inside `viewer/` unless the user authorizes another destination.
This directory owns room reconstruction from JSON, GLB assets, model placement, camera controls, and the mobile WebView interface.
The backend owns AI analysis, and `frontend/` owns mobile screens and API requests.

## Team

The lead delegates implementation to `coder`, verification to `tester`, independent review to `reviewer`, and acceptance confirmation to `confirmer`.
Assignments include an objective, allowed files, dependencies, acceptance checks, and teammate IDs.
Use one writer per file and native agent messaging, with the lead as relay when direct communication is unavailable.
Only the lead changes task scope; teammates do not spawn more agents.

## Scene Contract

Render the agreed RoomScene structure through `loadRoom(json)` rather than hardcoding one room.
Use meters, Y for height, the floor center at `(0, 0, 0)`, bounding-box centers for object positions, and radians for `rotationY`.
Map `modelId` to known GLB assets and use a box fallback when a model is unavailable.
Send `READY` when scene loading is available, then accept `LOAD_SCENE` containing the complete RoomScene as `payload`.
The root `room-sence.example.json` is currently empty, so request a valid agreed fixture before relying on it.

## Quality

Reproduce bugs in the rendered viewer before editing when possible.
Check two different room layouts, repeated updates, missing assets, controls, mobile sizing, and visual alignment.
Report actual checks and distinguish desktop browser, WebView, and physical iPhone evidence.
Never manually edit generated files or `CHANGELOG.md`.
