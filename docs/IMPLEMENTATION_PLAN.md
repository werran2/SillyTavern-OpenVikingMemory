# Implementation Plan

This is the working plan for the first MVP. The detailed SillyTavern-local draft lives in the original planning notes; this repo keeps the public contributor version.

## Phase 1: API Reality Check

- Verify OpenViking install command on Windows.
- Verify whether `openviking-server` exists.
- Verify whether `ov status` exists.
- Verify HTTP paths for health, memory search, session append, and session commit.
- Record findings in `docs/openviking-setup.md`.

## Phase 2: Extension Skeleton

- Add `extension/manifest.json`.
- Add `extension/index.js`.
- Add `extension/settings.html`.
- Add `extension/style.css`.
- Load settings in SillyTavern.
- Add a Test Connection button.

## Phase 3: Memory Provider Interface

Define a small provider API:

```js
status()
recall({ route, query, topK })
capture({ route, text })
commit({ route, wait })
```

The extension should call the provider, not raw OpenViking endpoints directly.

## Phase 4: Routing and Isolation

Build stable route identity from:

- SillyTavern user
- character id
- character name
- chat id
- optional group id

The route must prevent path traversal and must not mix memories between characters.

## Phase 5: Generation-Time Recall

- Use SillyTavern `generate_interceptor`.
- Implement the interceptor as `async recallForGeneration(chatToGenerate, contextSize, abort, type)`.
- Skip quiet prompts.
- Catch OpenViking errors.
- Inject with `setExtensionPrompt(key, value, position, depth, scan, role)`.
- Keep prompt injection under a configurable budget.

## Phase 6: Capture and Sync

- Capture new user and assistant messages.
- Dedupe `MESSAGE_SENT` and `MESSAGE_RECEIVED` events.
- Clean injected memory blocks before storing.
- Sync existing chats in batches.

## Phase 7: Manual Verification

- Test with OpenViking running.
- Test with OpenViking stopped.
- Test with one small chat.
- Test with one large chat.
- Compare recall with SillyTavern Vector Storage.

## Done for MVP

- A user can install the extension.
- A user can connect to local OpenViking.
- A user can sync one current chat.
- Relevant memory appears before generation.
- Chat generation still works when OpenViking is down.

