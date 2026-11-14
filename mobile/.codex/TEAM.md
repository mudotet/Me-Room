# Mobile App Crewmates

## Start and Scope

From the repository root, run:

```sh
codex -C mobile "Use the mobile crewmates to implement and verify <task>."
```

Trust the project if prompted so its `.codex/config.toml` can load.
The main session is the lead and creates teammates on demand; these files do not launch persistent workers.
Use the user's requested model and reasoning level when available and report availability limitations without silently substituting another model.
If custom roles are unavailable, pass their instructions to supported native subagents and disclose the fallback.

Khải's app team owns `mobile/app/`, API calls, scene state, Home, Scan, Processing, room screens, and AI Chat.
Quang's native 3D team owns `mobile/components/Room3D/` and `mobile/assets/models/` in the same Expo project.
Assign one writer for app dependencies, the lockfile, and Metro configuration after agreeing changes with the native lead.

## Roles

| Crewmate | Responsibility | Edits |
| --- | --- | --- |
| Lead | Assign tasks, agree interfaces, integrate, and report | Assigned app scope |
| `coder` | Implement capture, UI, networking, state, and Room3D integration | Assigned implementation and test files |
| `tester` | Reproduce bugs and verify app flows and failure states | Assigned tests and fixtures only |
| `reviewer` | Independently review behavior, privacy, accessibility, and contracts | None |
| `confirmer` | Match completed work and evidence to acceptance criteria | None |

## Coordination

Each assignment includes a task ID, objective, allowed files, dependencies, acceptance checks, and teammate IDs.
Use one writer per file and preserve others' changes.
Communicate through native messaging as `[TASK-ID] question|contract|blocked|result: <evidence>; need: <action>` and keep the lead informed.
Use the lead as relay if direct messaging is unavailable, and supported follow-up tools to wake idle teammates.
Only the lead changes scope or ownership; teammates do not spawn more agents.
Respect runtime concurrency limits and run confirmation after implementation, tests, review, and fixes.
Each handoff reports changed files, actual checks and results, blockers, and risks.
Cross-team communication requires shared runtime access; otherwise relay through the leads or user.

## Data and Verification

Read repository-root `shared/README.md` and `shared/example.json` before implementing clients.
The planned APIs are `POST /scan`, `POST /design`, and `GET /health`; agree request fields and error responses with the backend.
Store the current scene in React state and pass it as the `sceneData` prop to `Room3D`.
Agree the component export and any additional props with the native lead before using them.

Check camera denial, capture, upload and backend failures, retries, loading, scene replacement, and chat updates.
Inspect safe areas, keyboard overlap, accessible controls, and touch interaction alongside the native canvas.
Separate mocks, simulator evidence, and physical iPhone evidence.
No app, dependencies, or tests exist yet; document actual commands when implementation arrives.
Keep keys on the backend and private videos out of logs and fixtures.
Do not push, deploy, read secrets, or perform destructive operations without explicit user authorization.
Confirmation checks completion and does not authorize external actions.
