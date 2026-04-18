import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOpenVikingRoute, normalizeRouteSegment } from '../src/openviking/routing.js';

test('normalizes readable route segments', () => {
    assert.equal(normalizeRouteSegment('Alice Wang / main.chat'), 'Alice_Wang_main.chat');
});

test('hashes unusable route segments', () => {
    assert.match(normalizeRouteSegment('../..'), /^id_[a-f0-9]{16}$/);
    assert.match(normalizeRouteSegment('...'), /^id_[a-f0-9]{16}$/);
});

test('builds separate memory and session URIs', () => {
    const route = buildOpenVikingRoute({
        userHandle: 'local-user',
        characterId: 'char-001',
        characterName: 'Evelyn',
        chatId: '2026-04-18.jsonl',
        groupId: '',
    });

    assert.equal(route.accountId, 'sillytavern');
    assert.equal(route.userId, 'local-user');
    assert.equal(route.agentId, 'char-001_Evelyn');
    assert.equal(route.sessionId, '2026-04-18.jsonl');
    assert.equal(route.memoryUri, 'viking://user/sillytavern/local-user/agents/char-001_Evelyn/memories');
    assert.equal(route.sessionUri, 'viking://session/sillytavern/local-user/char-001_Evelyn/2026-04-18.jsonl');
});

test('marks group chats in agent id', () => {
    const route = buildOpenVikingRoute({
        userHandle: 'local-user',
        characterId: 'char-001',
        characterName: 'Evelyn',
        chatId: 'group-log',
        groupId: 'party-7',
    });

    assert.equal(route.agentId, 'group_party-7_char-001_Evelyn');
});

