import crypto from 'node:crypto';

const MAX_SEGMENT_LENGTH = 80;

function shortHash(value) {
    return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
}

export function normalizeRouteSegment(value) {
    const raw = String(value ?? '').trim();
    const normalized = raw
        .replace(/[\\/:*?"<>|#%{}[\]^~`]+/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');

    if (!normalized || /^[._]+$/.test(normalized)) {
        return `id_${shortHash(raw)}`;
    }

    if (normalized.length > MAX_SEGMENT_LENGTH) {
        return `${normalized.slice(0, 48)}_${shortHash(raw)}`;
    }

    return normalized;
}

export function buildOpenVikingRoute({ userHandle, characterId, characterName, chatId, groupId }) {
    const accountId = 'sillytavern';
    const userId = normalizeRouteSegment(userHandle || 'default-user');
    const characterSegment = normalizeRouteSegment(`${characterId || 'character'}_${characterName || 'unknown'}`);
    const groupSegment = groupId ? `group_${normalizeRouteSegment(groupId)}` : '';
    const agentId = groupSegment ? `${groupSegment}_${characterSegment}` : characterSegment;
    const sessionId = normalizeRouteSegment(chatId || 'current-chat');

    return {
        accountId,
        userId,
        agentId,
        sessionId,
        memoryUri: `viking://user/${accountId}/${userId}/agents/${agentId}/memories`,
        sessionUri: `viking://session/${accountId}/${userId}/${agentId}/${sessionId}`,
    };
}
