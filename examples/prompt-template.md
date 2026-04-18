# Prompt Template Example

```text
<openviking-memory>
Relevant long-term memories:
{{memories}}
</openviking-memory>
```

Memory items should be short, concrete, and related to the current user message.

Prefer:

```text
- Evelyn promised to keep the brass key hidden in her glove after the clocktower scene.
```

Avoid:

```text
- A long transcript chunk that repeats several pages of old dialogue.
```

