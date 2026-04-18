import express from 'express';
import { getConfigValue } from '../util.js';
import { createOpenVikingClient } from '../openviking/client.js';
import { buildOpenVikingRoute } from '../openviking/routing.js';
import { cleanCapturedText, serializeChatTurn } from '../openviking/cleanup.js';

export const router = express.Router();

function getClient(body = {}) {
    return createOpenVikingClient({
        baseUrl: String(body.baseUrl || getConfigValue('openviking.baseUrl', 'http://127.0.0.1:1933')),
        apiKey: String(getConfigValue('openviking.apiKey', '')),
    });
}

function getRoute(req) {
    return buildOpenVikingRoute({
        userHandle: req.user?.profile?.handle || 'default-user',
        characterId: req.body.characterId,
        characterName: req.body.characterName,
        chatId: req.body.chatId,
        groupId: req.body.groupId,
    });
}

router.post('/status', async (req, res) => {
    try {
        return res.json(await getClient(req.body).status());
    } catch (error) {
        return res.status(502).json({ ok: false, error: String(error.message || error) });
    }
});

router.post('/recall', async (req, res) => {
    try {
        const query = cleanCapturedText(req.body.query);
        if (!query) return res.json({ ok: true, items: [] });
        const route = getRoute(req);
        const topK = Math.min(Math.max(Number(req.body.topK) || 5, 1), 20);
        const result = await getClient(req.body).recall({ route, query, topK, uri: route.memoryUri });
        return res.json({ ok: true, route, result });
    } catch (error) {
        return res.status(502).json({ ok: false, error: String(error.message || error) });
    }
});

router.post('/capture', async (req, res) => {
    try {
        const text = cleanCapturedText(req.body.text);
        if (!text) return res.json({ ok: true, skipped: true });
        const route = getRoute(req);
        const result = await getClient(req.body).capture({ route, sessionUri: route.sessionUri, text });
        return res.json({ ok: true, route, result });
    } catch (error) {
        return res.status(502).json({ ok: false, error: String(error.message || error) });
    }
});

router.post('/sync', async (req, res) => {
    try {
        const route = getRoute(req);
        const client = getClient(req.body);
        const text = serializeChatTurn(req.body.messages);
        if (text) {
            await client.capture({ route, sessionUri: route.sessionUri, text });
        }
        const commitResult = await client.commit({ route, sessionUri: route.sessionUri, wait: Boolean(req.body.wait) });
        return res.json({ ok: true, route, capturedChars: text.length, commitResult });
    } catch (error) {
        return res.status(502).json({ ok: false, error: String(error.message || error) });
    }
});
