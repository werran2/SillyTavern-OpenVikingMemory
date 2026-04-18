# SillyTavern OpenViking Memory

A third-party SillyTavern extension that connects roleplay chats to OpenViking long-term memory.

The project goal is simple: keep SillyTavern as the roleplay interface, keep OpenViking as the external context database, and build a small bridge that can sync old chats, recall relevant memories, and inject them into the prompt without modifying SillyTavern core.

## Status

MVP code has been migrated from a local SillyTavern implementation.

The repository now contains:

- a SillyTavern browser extension in `extension/`
- reusable OpenViking bridge utilities in `src/openviking/`
- server-side SillyTavern bridge files in `sillytavern-bridge/`
- tests for routing, cleanup, and the OpenViking client in `tests/`

OpenViking API compatibility still needs real-service verification.

## Planned MVP

- Connect to a local OpenViking service.
- Sync the current SillyTavern chat in batches.
- Store memories per user, character, and chat session.
- Recall relevant long-term memories before generation.
- Inject a bounded `<openviking-memory>` block into the prompt.
- Keep generation working when OpenViking is unavailable.

## Non-Goals

- Forking or vendoring OpenViking.
- Forking SillyTavern.
- Replacing SillyTavern Vector Storage.
- Building a full visual memory editor in the first version.
- Importing `.ovpack` files in the first version.

## Repository Layout

```text
extension/       SillyTavern browser extension files
sillytavern-bridge/
                 Server-side bridge files copied into a SillyTavern checkout
src/openviking/  Reusable route, cleanup, and client helpers
tests/           Node test runner tests for bridge helpers
docs/            Design, implementation plan, API notes
examples/        Prompt templates and sample memory formatting
```

## Install for Testing

Copy or symlink `extension/` into your SillyTavern third-party extensions directory as `SillyTavern-OpenVikingMemory`:

```text
SillyTavern/public/scripts/extensions/third-party/SillyTavern-OpenVikingMemory
```

The current extension expects a SillyTavern backend endpoint at:

```text
/api/openviking
```

See `sillytavern-bridge/README.md` for the files Giro implemented for that bridge.

## Development Direction

The preferred architecture is:

```text
SillyTavern extension
  -> SillyTavern local bridge endpoint or server plugin
  -> local OpenViking service
```

The bridge should expose a small provider interface:

```text
status()
recall()
capture()
commit()
```

That keeps the UI independent from OpenViking API drift and leaves room for a simple local-memory provider later.

## OpenViking

OpenViking is expected to run as a separate local service. This project should not copy OpenViking source code into the extension repository.

If the PyPI package or CLI name changes, document the working startup command in `docs/openviking-setup.md`.

## Development

Run helper tests:

```bash
npm test
```

Run syntax checks:

```bash
npm run check
```

## Contributing

Good first areas:

- Test OpenViking installation on Windows.
- Verify the current OpenViking HTTP API paths.
- Improve the memory prompt template.
- Add Chinese UI strings.
- Implement batch chat sync.
- Compare recall quality with SillyTavern Vector Storage.

See `CONTRIBUTING.md` and `docs/IMPLEMENTATION_PLAN.md`.

## License

AGPL-3.0. This matches the license family used by SillyTavern and OpenViking.
