# Repository Guidelines

## Project Structure & Module Organization

Me Room is an AI-assisted room design prototype using one Expo app and a FastAPI backend.
`mobile/app/` is reserved for mobile screens, capture, API calls, and chat.
`mobile/components/Room3D/` owns the native 3D component and its agent team.
`mobile/assets/models/` holds the future GLB catalog.
`backend/` owns video processing and AI orchestration.
`shared/example.json` is a synthetic draft RoomScene fixture, with its conventions in `shared/README.md`.
Backend application code, dependency manifests, and tests are in `backend/`; mobile implementation is still pending.

## Architecture & Ownership

The mobile app keeps RoomScene in React state and passes it to `<Room3D sceneData={roomScene} />`.
The renderer uses `@react-three/fiber/native`, Three.js, `expo-gl`, and `expo-asset` inside the same Expo project.
The mobile team owns screens and API calls; the native 3D team owns `Room3D/` and model assets; the backend team owns FastAPI and OpenAI integration.
Coordinate edits to shared contracts and mobile dependencies through the relevant leads, with one writer per file.
Use the nearest `AGENTS.md` and `.codex/TEAM.md` for team scope and instructions.

## Build, Test, and Development Commands

Backend setup and pytest commands are documented in `backend/README.md`; mobile tooling and coverage targets are not configured yet.
Use `git status --short` to inspect changes and `python3 -m json.tool shared/example.json` to check the example's JSON syntax.
When adding implementation, document actual install, run, build, and test commands in the owning module.
Choose compatible Expo, React, and R3F versions before installing dependencies.

## Coding Style & Testing

Use TypeScript for mobile and native 3D, and Python for the backend.
Follow established module conventions and introduce shared formatting configuration when adding code.
Never manually edit generated files or `CHANGELOG.md`.
Reproduce bugs through the user-facing flow before editing when possible.
Add focused checks for new behavior and test two different room layouts.
Verify native rendering and textured GLB loading on a physical iPhone; distinguish device evidence from simulator or mocked results.

## Commits, Pull Requests & Security

Recent commit subjects use short, lowercase descriptions; prefer concise imperative subjects without agent co-authors.
Pull requests should explain behavior, verification, related issues, and include visuals for UI changes.
Keep OpenAI keys on the backend and private recordings out of Git and logs.
Do not push, deploy, read secrets, or perform destructive actions without explicit user authorization.
