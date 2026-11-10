/**
 * Response Parser Module
 *
 * Extracts content or tool_calls from model response.
 */

import { recordEvent } from './events.mjs';

/**
 * @typedef {Object} ParsedResponse
 * @property {'text'|'tool_call'|'error'} type - Response type
 * @property {string} [content] - Text content (if type='text')
 * @property {Object} [tool_call] - Tool call (if type='tool_call')
 * @property {string} [error] - Error message (if type='error')
 * @property {boolean} [mock] - True if mock response
 */

/**
 * Parse model response
 * @param {Object} response - Raw response from client
 * @returns {Promise<ParsedResponse>}
 */
export async function parseResponse(response) {
  if (!response || !response.message) {
    await recordEvent('parse_error', { error: 'Invalid response structure' });
    return {
      type: 'error',
      error: 'Invalid response: missing message'
    };
  }

  const { message } = response;
  const isMock = response._mock === true;

  // Check for tool calls first
  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];

    await recordEvent('parsed', {
      type: 'tool_call',
      tool_name: toolCall.function?.name,
      mock: isMock
    });

    return {
      type: 'tool_call',
      tool_call: toolCall,
      mock: isMock
    };
  }

  // Text response
  if (message.content) {
    await recordEvent('parsed', {
      type: 'text',
      content_length: message.content.length,
      mock: isMock
    });

    return {
      type: 'text',
      content: message.content,
      mock: isMock
    };
  }

  // Empty response
  await recordEvent('parse_error', { error: 'Empty response' });
  return {
    type: 'error',
    error: 'Empty response: no content or tool_calls'
  };
}

/**
 * Validate user input
 * @param {string} message - User message
 * @returns {{valid: boolean, error?: string}}
 */
export function validateInput(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (trimmed.length > 4096) {
    return { valid: false, error: 'Message too long (max 4096 chars)' };
  }

  return { valid: true };
}
