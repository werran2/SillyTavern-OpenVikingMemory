import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanCapturedText, serializeChatTurn } from '../src/openviking/cleanup.js';

test('removes OpenViking memory blocks', () => {
    const input = 'Hello\n<openviking-memory>\nold memory\n</openviking-memory>\nWorld';
    assert.equal(cleanCapturedText(input), 'Hello\nWorld');
});

test('removes relevant memory blocks from other tools', () => {
    const input = '<relevant-memories>\nnoise\n</relevant-memories>\nActual line';
    assert.equal(cleanCapturedText(input), 'Actual line');
});

test('serializes only useful chat text', () => {
    const result = serializeChatTurn([
        { name: 'User', is_user: true, mes: 'I found the key.' },
        { name: 'Evelyn', is_user: false, mes: 'She hides it in her glove.' },
        { name: 'System', is_system: true, mes: 'internal' },
    ]);

    assert.equal(result, 'User: I found the key.\n\nEvelyn: She hides it in her glove.');
});

