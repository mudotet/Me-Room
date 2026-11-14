# Backend Crewmates

## Starting the team

Start a new Codex session from the `backend/` directory and trust the project if prompted.
For example, run `cd backend` and then `codex "Use the backend crewmates to implement and verify the requested feature."`.
The main session is the lead and creates teammates on demand; the files do not start background agents.
The project configuration requires a Codex runtime that loads `backend/.codex/config.toml` and supports custom subagents.
If those roles are not available, the lead can still delegate with the role instructions below using the runtime's available agent tools.

## Roles

- **Lead:** Understand the request, assign tasks, manage dependencies and ownership, integrate results, and explain the result to the user.
- **Coder:** Implement assigned backend and AI changes, including validation and error handling.
- **Tester:** Reproduce failures and exercise the API or AI flow, with assigned test files as its only writable scope.
- **Reviewer:** Independently inspect changes for correctness, security, API contracts, and missing tests.
- **Confirmer:** Independently check the completed change against the user's request and verification evidence, then report what is confirmed and what remains unverified.

## Working together

1. The lead checks the current code, Git status, user instructions, and applicable `AGENTS.md` files before delegating.
2. Assign each task an ID, objective, allowed paths, dependencies, acceptance checks, and teammate IDs.
3. Give each file one writer at a time, including tests, fixtures, and configuration.
4. Teammates may exchange questions, contracts, and evidence through available native agent messaging and keep the lead informed.
5. If direct messaging is unavailable, send messages through the lead; do not invent a messaging mechanism.
6. Only the lead changes scope, resolves conflicting decisions, and integrates results.
7. For bugs, reproduce the user-facing API flow before editing when possible, and report any blocker.
8. After implementation, run applicable checks, request an independent review, resolve findings, and ask the confirmer to assess acceptance and evidence.
9. Each crewmate reports changed files, commands and outcomes, blockers, and risks; reviewers and confirmers do not modify files.
10. The lead reports actual results and any unverified behavior without claiming a check passed when it did not run.

## Backend and AI boundaries

The backend uses Python, FastAPI, FFmpeg, and OpenAI; read backend/README.md for actual setup and test commands.
Inspect the current implementation before relying on these plans as facts.
Use repository-root `shared/example.json` and `shared/README.md` for the MVP scene contract, implemented by backend/schemas.py.
Scan accepts multipart field video; design accepts the complete scene and prompt, without server-side sessions.
The mobile app stores returned scenes in React state and passes them to `Room3D` in `mobile/components/Room3D/`.
Coordinate contract changes with the mobile and native 3D leads, assigning one writer in `shared/` and updating consumers together.
Protect API keys and private room videos, validate uploads and external AI responses, and account for timeouts and failures at service boundaries.
Do not read secrets, deploy, push, or perform destructive operations without the user's explicit authorization.
Never edit generated files or `CHANGELOG.md` by hand.
For coding work, use the model and reasoning level requested by the user when available, and report any availability limitation rather than claiming it was used.
