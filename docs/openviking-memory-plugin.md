# OpenViking Memory Plugin

This extension uses a local OpenViking server as long-term memory for SillyTavern roleplay chats.

## Requirements

- Python 3.10 or newer.
- OpenViking 0.3.8 or newer.
- SillyTavern running normally.
- OpenViking listening on `http://127.0.0.1:1933`.

## Start OpenViking

```bash
python -m pip install --upgrade "openviking>=0.3.8"
openviking-server
```

**Note**: OpenViking requires additional configuration including embedding model setup. Please refer to the [OpenViking documentation](https://openviking.ai/docs) for detailed configuration instructions.

## Enable

Open SillyTavern, enable OpenViking Memory, set the URL to `http://127.0.0.1:1933`, then click Test connection.

## Sync Current Chat

Open a character chat and click Sync current chat. The extension sends chat messages in batches and asks OpenViking to commit them into long-term memory.

## Recall Behavior

Before generation, the extension searches OpenViking using the latest user message and injects a bounded `<openviking-memory>` block when relevant memories are found.

## Failure Behavior

If OpenViking is stopped or unreachable, generation continues without long-term memory.
