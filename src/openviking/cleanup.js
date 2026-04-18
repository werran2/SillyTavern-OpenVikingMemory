const BLOCK_PATTERNS = [
    /<openviking-memory>[\s\S]*?<\/openviking-memory>/gi,
    /<relevant-memories>[\s\S]*?<\/relevant-memories>/gi,
];

export function cleanCapturedText(value) {
    let text = String(value ?? '');
    for (const pattern of BLOCK_PATTERNS) {
        text = text.replace(pattern, '');
    }
    return text
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{2,}/g, '\n')
        .trim();
}

export function serializeChatTurn(messages) {
    if (!Array.isArray(messages)) {
        return '';
    }

    return messages
        .filter((message) => !message?.is_system)
        .map((message) => {
            const text = cleanCapturedText(message?.mes);
            if (!text) {
                return '';
            }
            const name = cleanCapturedText(message?.name || (message?.is_user ? 'User' : 'Assistant'));
            return `${name}: ${text}`;
        })
        .filter(Boolean)
        .join('\n\n')
        .trim();
}
