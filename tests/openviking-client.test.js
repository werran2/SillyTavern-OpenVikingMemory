import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpenVikingClient } from '../src/openviking/client.js';

test('status calls local health endpoint', async () => {
    const calls = [];
    const client = createOpenVikingClient({
        baseUrl: 'http://127.0.0.1:1933',
        fetchImpl: async (url, options) => {
            calls.push({ url, options });
            return { ok: true, status: 200, json: async () => ({ status: 'ok' }) };
        },
    });

    const result = await client.status();

    assert.equal(result.ok, true);
    assert.equal(calls[0].url, 'http://127.0.0.1:1933/health');
});

test('recall posts route headers and query body', async () => {
    const calls = [];
    const client = createOpenVikingClient({
        baseUrl: 'http://127.0.0.1:1933/',
        fetchImpl: async (url, options) => {
            calls.push({ url, options });
            return { ok: true, status: 200, json: async () => ({ items: [] }) };
        },
    });

    await client.recall({
        route: { accountId: 'a', userId: 'u', agentId: 'g' },
        query: 'old promise',
        topK: 5,
        uri: 'viking://user/a/u/agents/g/memories',
    });

    assert.equal(calls[0].url, 'http://127.0.0.1:1933/api/v1/memories/search');
    assert.equal(calls[0].options.headers['X-OpenViking-Account'], 'a');
    assert.deepEqual(JSON.parse(calls[0].options.body), {
        query: 'old promise',
        top_k: 5,
        uri: 'viking://user/a/u/agents/g/memories',
    });
});

test('rejects non-local OpenViking URLs', () => {
    assert.throws(() => createOpenVikingClient({ baseUrl: 'https://example.com' }), /local OpenViking/);
});

test('accepts IPv6 loopback', () => {
    assert.doesNotThrow(() => createOpenVikingClient({ baseUrl: 'http://[::1]:1933' }));
});

