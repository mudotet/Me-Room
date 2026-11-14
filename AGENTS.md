# Repository Guidelines

## Project Structure & Module Organization

Me Room is a planned AI-assisted room design prototype.
The root `README.md` describes the intended mobile, backend, and 3D viewer architecture.
`video.mp4` is a sample video, and `room-sence.example.json` is currently an empty placeholder, not a valid JSON fixture.
The local `backend/`, `frontend/`, and `viewer/` directories are empty and are not tracked by Git.
The README refers to `mobile/`, which does not currently exist; resolve that naming difference when adding the mobile application.

## Build, Test, and Development Commands

There is no runnable application, dependency manifest, build configuration, or test suite in the current checkout.
The setup commands in the README describe the intended stack and cannot run until the corresponding projects and dependencies are added.
Use `git status --short` to inspect local changes and `git ls-files` to see tracked files.
When implementing a module, document its prerequisites and working install, run, build, and test commands in its own README or the root README.

## Coding Style & Naming Conventions

The planned stack uses TypeScript with React Native and Expo for mobile, Python with FastAPI for the backend, and Three.js for the viewer.
No formatter, linter, indentation rule, or code naming convention is configured yet.
Follow the conventions established within each module, and add shared formatting configuration when introducing code.
Keep scene data contracts consistent across the backend and viewer, and provide a valid example when the format is defined.

## Testing Guidelines

No testing framework or coverage target is configured yet.
Add focused tests alongside new functionality and document how to run them.
For changes to the room scanning and rendering flow, exercise the user-facing capture, analysis, and visualization path when the components are available.

## Commits & Pull Requests

Recent commit subjects are short, lowercase descriptions, such as `add video and json schema`.
Use a concise, imperative subject that describes the change.
Pull requests should explain the behavior changed, list verification performed, link relevant issues when available, and include screenshots or video for visible UI changes.

## Configuration & Security

The proposed backend requires an OpenAI API key.
Keep credentials in local environment variables or an untracked `.env` file, and never commit real keys or private room recordings.
