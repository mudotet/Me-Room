# Native 3D Crewmates

## Start and Scope

From the repository root, run:

```sh
codex -C mobile/components/Room3D "Use the native 3D crewmates to implement and verify <task>."
```

Trust the project if prompted so its `.codex/config.toml` can load.
The main session is the lead and creates teammates on demand; these files do not launch persistent workers.
Use the user's requested model and reasoning level when available and report availability limitations without silently substituting another model.
If custom roles are unavailable, pass their instructions to supported native subagents and disclose the fallback.

Quang's team owns this component directory and repository-root `mobile/assets/models/`.
Khải's team owns app screens, API calls, and React state.
Both teams share one Expo application; coordinate dependencies, the lockfile, and Metro configuration through the mobile lead with one assigned writer.
Do not create a separate package manifest in this component directory.

## Roles

| Crewmate | Responsibility | Edits |
| --- | --- | --- |
| Lead | Assign rendering tasks, agree props, integrate, and report | Assigned native 3D scope |
| `coder` | Implement Room3D, furniture, native touch controls, and model loading | Assigned implementation, assets, and tests |
| `tester` | Reproduce bugs and verify scene, model, and device behavior | Assigned tests and fixtures only |
| `reviewer` | Independently review contracts, transforms, resources, and native compatibility | None |
| `confirmer` | Match completed work and evidence to acceptance criteria | None |

## Coordination

Each assignment includes a task ID, objective, allowed files, dependencies, acceptance checks, and teammate IDs.
Use one writer per file, including assets and configuration, and preserve others' changes.
Communicate through native messaging as `[TASK-ID] question|contract|blocked|result: <evidence>; need: <action>` and keep the lead informed.
Use the lead as relay if direct messaging is unavailable, and supported follow-up tools to wake idle teammates.
Only the lead changes scope or ownership; teammates do not spawn more agents.
Respect runtime concurrency limits and run confirmation after implementation, tests, review, and fixes.
Each handoff reports changed files, actual checks and results, blockers, and risks.
Cross-team communication requires shared runtime access; otherwise relay through the leads or user.

## Rendering Contract

Implement `Room3D.tsx`, `Furniture.tsx`, and `CameraControls.tsx` as needed inside this directory.
Expose `<Room3D sceneData={roomScene} />`, import Canvas from `@react-three/fiber/native`, and update rendering when props change.
Read repository-root `shared/README.md` and `shared/example.json`; agree extra wall, door, and window fields before using them.
Use meters, vertical Y, floor center `(0, 0, 0)`, bounding-box object centers, and radians for `rotationY`.
Map known `modelId` values to bundled GLB assets, normalize transforms, and render box fallbacks for unavailable models.
Handle loading errors and release unused GPU resources without disposing still-shared assets.
Do not mutate scene props or fetch arbitrary model URLs from untrusted scene data.
Agree any extra component props or loading/error callbacks with the mobile lead.

## Verification and Limits

Before expanding the renderer, spend the first 20-30 minutes testing a box with camera control, multiple JSON objects, and a textured GLB on the demo iPhone.
If those fail, report exact device, versions, and errors before reconsidering the rendering architecture with the team.
Verify two different layouts, repeated prop updates, model dimensions and rotation, fallbacks, mobile gestures, and resource cleanup.
Inspect clipping, floating furniture, lighting, and touch interaction with app controls.
Distinguish mocked component checks, simulator results, and actual physical-device rendering.
No native implementation, GLB models, or tests exist yet; document actual checks as they become available.
Do not push, deploy, read secrets, or perform destructive actions without explicit user authorization.
Confirmation checks completion and does not authorize external actions.
