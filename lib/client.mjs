/**
 * HTTP Client Module
 *
 * Sends requests to Ollama API or returns mock responses.
 * Includes RecoveryParser for malformed tool_calls.
 */

import { recordEvent } from './events.mjs';
import { recoverToolCalls, extractToolCallFromText } from './recovery.mjs';

const OLLAMA_URL = 'http://127.0.0.1:11434/api/chat';
const DEFAULT_MODEL = 'qwen3.5:0.8b';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * @typedef {Object} ChatRequest
 * @property {string} model - Model name
 * @property {Array<{role: string, content: string}>} messages - Chat messages
 * @property {boolean} [stream] - Enable streaming
 * @property {Array} [tools] - Tool definitions
 */

/**
 * @typedef {Object} ChatResponse
 * @property {Object} message - Response message
 * @property {string} message.role - Always "assistant"
 * @property {string} [message.content] - Text content
 * @property {Array} [message.tool_calls] - Tool calls
 * @property {string} model - Model used
 * @property {boolean} done - Completion flag
 */

/**
 * Mock response for testing
 * @param {string} userMessage - User's message
 * @returns {ChatResponse}
 */
function createMockResponse(userMessage) {
  const isFileQuery = /файл|file|найди|find|список|list/i.test(userMessage);

  if (isFileQuery) {
    return {
      message: {
        role: 'assistant',
        content: '',
        tool_calls: [{
          function: {
            name: 'list_directory',
            arguments: JSON.stringify({ path: '.' })
          }
        }]
      },
      model: 'mock',
      done: true,
      _mock: true
    };
  }

  return {
    message: {
      role: 'assistant',
      content: `[MOCK] Это тестовый ответ на: "${userMessage}". Ollama не вызывается в mock-режиме.`
    },
    model: 'mock',
    done: true,
    _mock: true
  };
}

/**
 * Send chat request
 * @param {ChatRequest} request - Chat request
 * @param {Object} options - Options
 * @param {boolean} [options.mock=false] - Use mock mode
 * @param {number} [options.timeout] - Request timeout in ms
 * @returns {Promise<ChatResponse>}
 */
export async function chat(request, options = {}) {
  const { mock = false, timeout = DEFAULT_TIMEOUT } = options;

  await recordEvent('request_sent', {
    model: request.model || DEFAULT_MODEL,
    message_count: request.messages?.length || 0,
    has_tools: !!request.tools?.length,
    mock
  });

  // Mock mode
  if (mock) {
    const lastMessage = request.messages?.[request.messages.length - 1];
    const userMessage = lastMessage?.content || '';

    await new Promise(resolve => setTimeout(resolve, 100));

    const response = createMockResponse(userMessage);

    await recordEvent('response_received', {
      has_content: !!response.message.content,
      has_tool_calls: !!response.message.tool_calls,
      model: response.model,
      mock: true
    });

    return response;
  }

  // Real Ollama request
  const body = {
    model: request.model || DEFAULT_MODEL,
    messages: request.messages,
    stream: false,
    options: {
      temperature: 0,        // Greedy decoding for better tool calling
      num_predict: 512,      // Max tokens
      num_ctx: 2048          // Context window
    }
  };

  // Add tools if provided
  if (request.tools?.length) {
    body.tools = request.tools;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const startTime = Date.now();

    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      throw new Error(`Ollama error: ${res.status} ${res.statusText} - ${errorText}`);
    }

    let response = await res.json();
    const latency = Date.now() - startTime;

    await recordEvent('response_received', {
      has_content: !!response.message?.content,
      has_tool_calls: !!response.message?.tool_calls,
      model: response.model,
      latency_ms: latency
    });

    // Apply RecoveryParser for tool_calls
    if (response.message?.tool_calls) {
      response = await recoverToolCalls(response);
    }

    // Try to extract tool call from text if no tool_calls but tools were requested
    if (!response.message?.tool_calls && request.tools?.length && response.message?.content) {
      const extracted = extractToolCallFromText(response.message.content);
      if (extracted.found) {
        await recordEvent('tool_extracted_from_text', {
          tool: extracted.tool_call.function.name
        });

        response = {
          ...response,
          message: {
            ...response.message,
            tool_calls: [extracted.tool_call]
          },
          _extracted: true
        };
      }
    }

    return response;

  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      await recordEvent('request_timeout', { timeout_ms: timeout });
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    await recordEvent('request_error', { error: err.message });
    throw err;
  }
}

/**
 * Check Ollama availability
 * @returns {Promise<{available: boolean, version?: string, error?: string}>}
 */
export async function checkOllama() {
  try {
    const res = await fetch('http://127.0.0.1:11434/api/version', {
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) {
      return { available: false, error: `Status ${res.status}` };
    }

    const data = await res.json();
    return { available: true, version: data.version };

  } catch (err) {
    return { available: false, error: err.message };
  }
}
