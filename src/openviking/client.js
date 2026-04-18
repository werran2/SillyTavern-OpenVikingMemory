const DEFAULT_TIMEOUT_MS = 15000;

function assertLocalBaseUrl(baseUrl) {
    const url = new URL(baseUrl);
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    if (!['127.0.0.1', 'localhost', '::1'].includes(hostname)) {
        throw new Error('Only local OpenViking base URLs are allowed in the MVP.');
    }
}

function joinUrl(baseUrl, path) {
    return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

export function createOpenVikingClient({ baseUrl, apiKey = '', timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = globalThis.fetch }) {
    assertLocalBaseUrl(baseUrl);
    if (typeof fetchImpl !== 'function') {
        throw new Error('fetch is not available in this runtime.');
    }

    async function request(path, { method = 'GET', route, body } = {}) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
        if (route) {
            headers['X-OpenViking-Account'] = route.accountId;
            headers['X-OpenViking-User'] = route.userId;
            headers['X-OpenViking-Agent'] = route.agentId;
        }

        try {
            const response = await fetchImpl(joinUrl(baseUrl, path), {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(`OpenViking ${response.status}: ${JSON.stringify(data)}`);
            }
            return data;
        } finally {
            clearTimeout(timeout);
        }
    }

    return {
        async status() {
            const data = await request('/health');
            return { ok: true, data };
        },
        recall: ({ route, query, topK, uri }) => request('/api/v1/memories/search', {
            method: 'POST',
            route,
            body: { query, top_k: topK, uri },
        }),
        capture: ({ route, sessionUri, text }) => request('/api/v1/sessions/append', {
            method: 'POST',
            route,
            body: { uri: sessionUri, text },
        }),
        commit: ({ route, sessionUri, wait }) => request('/api/v1/sessions/commit', {
            method: 'POST',
            route,
            body: { uri: sessionUri, wait: Boolean(wait) },
        }),
    };
}
