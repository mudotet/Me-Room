# Viewer Crewmates

## Start

From the repository root, start a new session with:

```sh
codex -C viewer "Use the viewer crewmates to implement and verify <task>."
```

Trust the project if prompted so its `.codex/config.toml` can load.
All paths below are relative to `viewer/` unless stated otherwise.
The primary session is the lead; role files define teammates created on demand, not persistent workers.
Use the user's requested model and reasoning level when available and report any availability limitation without silently substituting another model.
If custom roles are unavailable, the lead can pass the relevant `.codex/agents/*.toml` instructions to supported native subagents and report the fallback.

## Roles

| Crewmate | Responsibility | Edits |
| --- | --- | --- |
| Lead | Define scope, assign tasks, agree contracts, integrate, and report | Integration within assigned scope |
| `coder` | Implement Three.js room construction, GLB mapping, placement, and controls | Assigned implementation and test files |
| `tester` | Reproduce bugs and verify rendering, scene updates, and WebView integration | Explicitly assigned tests and fixtures |
| `reviewer` | Independently inspect rendering correctness, resource use, security, and contracts | None |
| `confirmer` | Check each acceptance criterion and the evidence supporting completion | None |

## Coordination

1. The lead reads applicable `AGENTS.md` files, current code, and Git status before delegating.
2. Each task includes an ID, objective, allowed paths, dependencies, acceptance checks, and known teammate IDs.
3. Assign one writer per file, including tests, assets, and configuration; preserve others' work.
4. Share actual teammate IDs and communicate through native messaging using `[TASK-ID] question|contract|blocked|result: <evidence>; need: <action>`.
5. Keep the lead informed; if peer messaging is unavailable, use the lead as relay and use supported follow-up tools to wake idle teammates.
6. Only the lead changes scope, priorities, and ownership; teammates do not spawn agents.
7. Stay within runtime concurrency limits and close finished teammates before starting the next phase when necessary.
8. Reproduce bugs in the visible viewer before editing where possible, then implement, test, review, resolve findings, and obtain confirmation.
9. Every handoff includes changed files, checks and outcomes, blockers, and remaining risks; the lead resolves conflicting reports before claiming completion.

## Rendering and shared contracts

Build a standalone Three.js web viewer with `loadRoom(json)` for initial loading and later scene replacements.
Render walls, floor, doors, windows, and furniture from the agreed RoomScene contract.
The repository-root `room-sence.example.json` is empty and the pasted plan only includes fragments; request a complete agreed fixture rather than inventing a schema.
Use meters, Y for height, the room floor center at `(0, 0, 0)`, object bounding-box centers for `position`, and radians for `rotationY`.
Normalize GLB orientation, bounds, and scale so geometry matches JSON position and size.
Map `modelId` through the agreed asset catalog; unknown or failed models must produce a correctly sized box fallback rather than a crashed viewer.
Send `READY` once the bridge can receive scenes, agree encoding with the mobile owner, and validate `LOAD_SCENE` with the complete RoomScene in `payload`.
Do not fetch arbitrary model URLs from untrusted scene data or silently change frontend and backend contracts.
Handle repeated scene loads and stale asynchronous asset results, disposing unused geometries, materials, and textures without breaking shared assets.
Provide camera orbit, zoom, and movement suitable for the room and mobile touch controls.
Relay cross-module questions through the module leads or the user when those teams are not in the same runtime.

## Verification and limits

No viewer application, package scripts, GLB catalog, or test framework exists yet; document actual commands when scaffolding arrives.
Verify at least two distinct room layouts from data, plus correct model dimensions, rotations, placement, and box fallbacks.
Check malformed input, missing assets, repeated loads, READY ordering, and mobile resizing and touch controls.
Inspect clipping, floating furniture, lighting, and visual alignment in the rendered output.
Distinguish desktop browser checks from Expo WebView and physical iPhone checks, and report missing dependencies or device access.
A deployed HTTPS viewer URL is the intended integration deliverable; prepare and verify locally, then obtain explicit user authorization before deployment.
Do not push, read secrets, or perform destructive actions without explicit authorization.
Confirmation assesses completion and never grants permission for external actions.
