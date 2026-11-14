# Frontend Crewmates

## Start

From the repository root, start a new session with:

```sh
codex -C frontend "Use the frontend crewmates to implement and verify <task>."
```

Trust the project if prompted so its `.codex/config.toml` can load.
All paths below are relative to `frontend/` unless stated otherwise.
The primary session is the lead; role files define teammates created on demand, not persistent workers.
Use the user's requested model and reasoning level when available and report any availability limitation without silently substituting another model.
If custom roles are unavailable, the lead can pass the relevant `.codex/agents/*.toml` instructions to supported native subagents and report the fallback.

## Roles

| Crewmate | Responsibility | Edits |
| --- | --- | --- |
| Lead | Define scope, assign tasks, agree contracts, integrate, and report | Integration within assigned scope |
| `coder` | Implement mobile UI, recording, networking, chat, and WebView integration | Assigned implementation and test files |
| `tester` | Reproduce bugs and verify user flows and failure states | Explicitly assigned tests and fixtures |
| `reviewer` | Independently inspect behavior, security, accessibility, and contracts | None |
| `confirmer` | Check every acceptance criterion and the evidence supporting completion | None |

## Coordination

1. The lead reads applicable `AGENTS.md` files, current code, and Git status before delegating.
2. Each task includes an ID, objective, allowed paths, dependencies, acceptance checks, and known teammate IDs.
3. Assign one writer per file, including tests and configuration; never overwrite another person's changes.
4. Share actual teammate IDs and communicate through native messaging using `[TASK-ID] question|contract|blocked|result: <evidence>; need: <action>`.
5. Keep the lead informed; if peer messaging is unavailable, use the lead as relay and use supported follow-up tools to wake idle teammates.
6. Only the lead changes scope, priorities, and ownership; teammates do not spawn agents.
7. Stay within runtime concurrency limits and close finished teammates before starting the next phase when necessary.
8. Reproduce bugs through the real mobile flow before editing where possible, then implement, test, review, resolve findings, and obtain confirmation.
9. Every handoff includes changed files, checks and outcomes, blockers, and remaining risks; the lead resolves conflicting reports before claiming completion.

## Mobile and shared contracts

Own Home, Scan, Processing, 3D Viewer, and AI Chat in this directory using Expo, React Native, and TypeScript.
Upload captured video to `POST /scan`, consume its RoomScene response, and use `GET /health` when checking backend connectivity.
For `POST /design`, agree the request with the backend: the supplied plan mentions both current-scene input and a `sceneId` plus `prompt` session approach.
Do not treat those alternatives as interchangeable or invent multipart field names and response fields.
Read the agreed contract before implementation; the repository-root `room-sence.example.json` is empty and the pasted plan does not supply the complete schema.
Agree WebView message encoding and validate incoming message types; after viewer `READY`, send `{ "type": "LOAD_SCENE", "payload": <complete RoomScene> }`.
Resend the latest scene after viewer reload and prevent older network responses from replacing newer accepted edits.
Keep backend and viewer changes with their respective owners; relay contract questions through the module leads or the user when those teams are not in the same runtime.

## Verification and limits

No mobile application, package scripts, or test framework exists yet; document actual commands when scaffolding arrives.
Check camera permission denial, recording and upload failure, loading and retry behavior, valid scan rendering, and chat updating the viewer.
Exercise the READY handshake, viewer reload, malformed messages, and at least two different room layouts.
Inspect safe areas, keyboard overlap, accessible controls, and WebView gestures on iPhone when hardware is available.
Separate mocks, simulator results, and physical-device results, and capture useful UI evidence without exposing private recordings.
Keep API keys on the backend; do not push, deploy, read secrets, or perform destructive actions without explicit user authorization.
Confirmation assesses completion and never grants permission for external actions.
