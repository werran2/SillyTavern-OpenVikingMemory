import {
    eventSource, event_types, getCurrentChatId, getRequestHeaders,
    saveSettingsDebounced, characters, this_chid, chat, name1,
    setExtensionPrompt, extension_prompt_types, extension_prompt_roles,
} from '../../../../script.js';
import {
    extension_settings, renderExtensionTemplateAsync,
} from '../../../extensions.js';
import {
    selected_group,
} from '../../../group-chats.js';

const EXTENSION_NAME = 'third-party/SillyTavern-OpenVikingMemory';
const PROMPT_TAG = 'openviking_memory';

let lastCapturedMessageIndex = -1;
let lastCapturedMessageHash = '';

function getSettings() {
    if (!extension_settings[EXTENSION_NAME]) {
        extension_settings[EXTENSION_NAME] = {
            enabled: false,
            baseUrl: 'http://127.0.0.1:1933',
            topK: 5,
            promptBudgetChars: 3000,
            template: '<openviking-memory>\n{{memories}}\n</openviking-memory>',
        };
    }
    return extension_settings[EXTENSION_NAME];
}

function buildRequestContext() {
    const settings = getSettings();
    const character = characters[this_chid];
    const chatId = getCurrentChatId();

    return {
        characterId: character?.avatar || 'unknown',
        characterName: character?.name || 'Unknown',
        chatId: chatId || 'current-chat',
        groupId: selected_group || '',
        baseUrl: settings.baseUrl,
    };
}

async function postJson(url, body) {
    const response = await fetch(url, {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(body),
    });
    return await response.json();
}

function extractItems(result) {
    if (Array.isArray(result?.items)) return result.items;
    if (Array.isArray(result?.memories)) return result.memories;
    if (Array.isArray(result?.data)) return result.data;
    return [];
}

function formatMemoryPrompt(items) {
    const settings = getSettings();
    const budget = settings.promptBudgetChars;
    let used = 0;
    const selected = [];

    for (const item of items) {
        const text = String(item?.text || item?.content || '');
        if (!text) continue;

        const itemLength = text.length + 2;
        if (used + itemLength > budget) {
            if (selected.length === 0 && text.length > budget) {
                selected.push(text.slice(0, budget));
            }
            break;
        }

        selected.push(text);
        used += itemLength;
    }

    if (selected.length === 0) return '';

    const memories = selected.join('\n\n');
    return settings.template.replace('{{memories}}', memories);
}

async function recallForGeneration(chatToGenerate, contextSize, abort, type) {
    const settings = getSettings();

    setExtensionPrompt(PROMPT_TAG, '', extension_prompt_types.IN_PROMPT, 4, false, extension_prompt_roles.SYSTEM);

    if (!settings.enabled || type === 'quiet') {
        return;
    }

    try {
        const lastMessage = chatToGenerate[chatToGenerate.length - 1];
        const query = lastMessage?.mes || '';

        if (!query) return;

        const context = buildRequestContext();
        const result = await postJson('/api/openviking/recall', {
            ...context,
            query,
            topK: settings.topK,
        });

        if (!result.ok) {
            console.warn('OpenViking recall failed:', result.error);
            return;
        }

        const items = extractItems(result.result);
        if (items.length === 0) return;

        const prompt = formatMemoryPrompt(items);
        if (prompt) {
            setExtensionPrompt(
                PROMPT_TAG,
                prompt,
                extension_prompt_types.IN_PROMPT,
                4,
                false,
                extension_prompt_roles.SYSTEM
            );
        }
    } catch (error) {
        console.warn('OpenViking recall skipped:', error);
    }
}

function hashMessage(message) {
    const text = String(message?.mes || '');
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash = hash & hash;
    }
    return hash.toString(36);
}

async function captureLastTurn() {
    const settings = getSettings();
    if (!settings.enabled || chat.length === 0) return;

    const lastMessage = chat[chat.length - 1];
    const messageIndex = chat.length - 1;
    const messageHash = hashMessage(lastMessage);

    if (messageIndex === lastCapturedMessageIndex && messageHash === lastCapturedMessageHash) {
        return;
    }

    lastCapturedMessageIndex = messageIndex;
    lastCapturedMessageHash = messageHash;

    try {
        const context = buildRequestContext();
        const text = lastMessage?.mes || '';

        if (!text) return;

        const name = lastMessage?.name || (lastMessage?.is_user ? name1 : 'Assistant');
        const formattedText = `${name}: ${text}`;

        await postJson('/api/openviking/capture', {
            ...context,
            text: formattedText,
        });
    } catch (error) {
        console.warn('OpenViking capture failed:', error);
    }
}

async function syncCurrentChat() {
    const settings = getSettings();
    const statusEl = document.getElementById('openviking_memory_status');

    if (!settings.enabled) {
        if (statusEl) statusEl.textContent = 'OpenViking memory is disabled.';
        return;
    }

    try {
        if (statusEl) statusEl.textContent = 'Syncing chat history...';

        const context = buildRequestContext();
        const batchSize = 100;
        let synced = 0;

        for (let i = 0; i < chat.length; i += batchSize) {
            const batch = chat.slice(i, i + batchSize);
            const isLast = i + batchSize >= chat.length;

            const result = await postJson('/api/openviking/sync', {
                ...context,
                messages: batch,
                wait: isLast,
            });

            if (!result.ok) {
                throw new Error(result.error || 'Sync failed');
            }

            synced += batch.length;
            if (statusEl) statusEl.textContent = `Synced ${synced} messages...`;
        }

        if (statusEl) statusEl.textContent = `Successfully synced ${synced} messages.`;
    } catch (error) {
        console.error('OpenViking sync failed:', error);
        if (statusEl) statusEl.textContent = `Sync failed: ${error.message}`;
    }
}

async function testConnection() {
    const settings = getSettings();
    const statusEl = document.getElementById('openviking_memory_status');

    try {
        if (statusEl) statusEl.textContent = 'Testing connection...';

        const result = await postJson('/api/openviking/status', {
            baseUrl: settings.baseUrl,
        });

        if (result.ok) {
            if (statusEl) statusEl.textContent = 'OpenViking is reachable.';
        } else {
            if (statusEl) statusEl.textContent = `Connection failed: ${result.error}`;
        }
    } catch (error) {
        console.error('OpenViking connection test failed:', error);
        if (statusEl) statusEl.textContent = `Connection failed: ${error.message}`;
    }
}

async function loadSettings() {
    console.log('[OpenViking] loadSettings called');
    const settings = getSettings();
    console.log('[OpenViking] Current settings:', settings);

    // Create container for third-party extension
    const container = document.createElement('div');
    container.id = 'openviking_memory_container';
    container.className = 'extension_container';
    const extensionsSettings2 = document.getElementById('extensions_settings2');
    console.log('[OpenViking] extensions_settings2 element:', extensionsSettings2);

    if (extensionsSettings2) {
        extensionsSettings2.appendChild(container);
        console.log('[OpenViking] Container appended to extensions_settings2');
    } else {
        console.error('[OpenViking] extensions_settings2 element not found!');
        return;
    }

    try {
        const html = await renderExtensionTemplateAsync(EXTENSION_NAME, 'settings');
        console.log('[OpenViking] Template rendered, length:', html.length);
        container.insertAdjacentHTML('beforeend', html);
        console.log('[OpenViking] HTML inserted into container');
    } catch (error) {
        console.error('[OpenViking] Error rendering template:', error);
        return;
    }

    const enabledEl = document.getElementById('openviking_memory_enabled');
    const baseUrlEl = document.getElementById('openviking_memory_base_url');
    const topKEl = document.getElementById('openviking_memory_top_k');
    const budgetEl = document.getElementById('openviking_memory_budget');
    const templateEl = document.getElementById('openviking_memory_template');
    const testBtn = document.getElementById('openviking_memory_test');
    const syncBtn = document.getElementById('openviking_memory_sync');

    if (enabledEl) {
        enabledEl.checked = settings.enabled;
        enabledEl.addEventListener('change', () => {
            settings.enabled = enabledEl.checked;
            saveSettingsDebounced();
        });
    }

    if (baseUrlEl) {
        baseUrlEl.value = settings.baseUrl;
        baseUrlEl.addEventListener('input', () => {
            settings.baseUrl = baseUrlEl.value;
            saveSettingsDebounced();
        });
    }

    if (topKEl) {
        topKEl.value = settings.topK;
        topKEl.addEventListener('input', () => {
            settings.topK = parseInt(topKEl.value) || 5;
            saveSettingsDebounced();
        });
    }

    if (budgetEl) {
        budgetEl.value = settings.promptBudgetChars;
        budgetEl.addEventListener('input', () => {
            settings.promptBudgetChars = parseInt(budgetEl.value) || 3000;
            saveSettingsDebounced();
        });
    }

    if (templateEl) {
        templateEl.value = settings.template;
        templateEl.addEventListener('input', () => {
            settings.template = templateEl.value;
            saveSettingsDebounced();
        });
    }

    if (testBtn) {
        testBtn.addEventListener('click', testConnection);
    }

    if (syncBtn) {
        syncBtn.addEventListener('click', syncCurrentChat);
    }
}

console.log('[OpenViking] Extension module loaded');
globalThis.openVikingMemory_beforeGeneration = recallForGeneration;

jQuery(async () => {
    console.log('[OpenViking] jQuery ready, loading settings + registering listeners');
    await loadSettings();
    eventSource.on(event_types.MESSAGE_SENT, captureLastTurn);
    eventSource.on(event_types.MESSAGE_RECEIVED, captureLastTurn);
    console.log('[OpenViking] Ready');
});
