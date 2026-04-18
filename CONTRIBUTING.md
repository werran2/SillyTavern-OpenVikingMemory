# Contributing

This project is for a SillyTavern extension that bridges roleplay chats to OpenViking long-term memory.

## Ground Rules

- Keep this repository independent. Do not vendor SillyTavern or OpenViking source code.
- Prefer small pull requests with one clear behavior change.
- Keep the first MVP focused on one character chat, one local OpenViking instance, and reliable failure behavior.
- Document any OpenViking API behavior you verify, including version, install method, OS, and startup command.

## Useful Issue Types

- `api-compatibility`: OpenViking API path or response shape verification.
- `windows`: Windows install or runtime behavior.
- `extension-ui`: SillyTavern extension settings and user-facing controls.
- `memory-quality`: Recall quality, prompt templates, and memory formatting.
- `good first issue`: Small scoped work suitable for new contributors.

## Development Checklist

Before opening a pull request:

- Run the relevant syntax or test command.
- Include the command and result in the PR description.
- Confirm OpenViking failures do not block SillyTavern generation.
- Avoid storing API keys in browser extension settings.

