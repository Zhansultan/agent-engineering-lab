/**
 * Context Builder Module
 *
 * Manages conversation history and builds requests for the model.
 */

import { recordEvent } from './events.mjs';
import { getToolDefinitions } from './executor.mjs';

const DEFAULT_MODEL = 'qwen3.5:0.8b';
const MAX_TURNS = 10;  // Prevent infinite loops

const SYSTEM_PROMPT = `You are a helpful assistant with access to file system tools.
When asked about files, use the available tools to find and read them.
After using a tool, analyze the result and provide a helpful response.
Be concise and direct.`;

/**
 * @typedef {Object} Message
 * @property {string} role - 'system' | 'user' | 'assistant' | 'tool'
 * @property {string} content - Message content
 * @property {Array} [tool_calls] - Tool calls (assistant only)
 */

/**
 * @typedef {Object} Context
 * @property {string} model - Model name
 * @property {Message[]} messages - Conversation history
 * @property {Array} tools - Tool definitions
 * @property {number} turn - Current turn number
 */

/**
 * Create new context for a conversation
 * @param {Object} options
 * @param {string} [options.model] - Model to use
 * @param {boolean} [options.mock] - Mock mode
 * @returns {Context}
 */
export function createContext(options = {}) {
  const { model = DEFAULT_MODEL, mock = false } = options;

  const context = {
    model: mock ? 'mock' : model,
    messages: [],
    tools: mock ? [] : getToolDefinitions(),
    turn: 0,
    mock
  };

  // Add system prompt for real mode
  if (!mock) {
    context.messages.push({
      role: 'system',
      content: SYSTEM_PROMPT
    });
  }

  return context;
}

/**
 * Add user message to context
 * @param {Context} context
 * @param {string} content - User message
 * @returns {Context}
 */
export function addUserMessage(context, content) {
  context.messages.push({
    role: 'user',
    content
  });

  recordEvent('context_user_added', {
    message_length: content.length,
    total_messages: context.messages.length
  });

  return context;
}

/**
 * Add assistant response to context
 * @param {Context} context
 * @param {Object} response - Model response
 * @returns {Context}
 */
export function addAssistantResponse(context, response) {
  const message = response.message || response;

  context.messages.push({
    role: 'assistant',
    content: message.content || '',
    ...(message.tool_calls ? { tool_calls: message.tool_calls } : {})
  });

  context.turn++;

  recordEvent('context_assistant_added', {
    has_content: !!message.content,
    has_tool_calls: !!message.tool_calls,
    turn: context.turn
  });

  return context;
}

/**
 * Add tool result to context
 * @param {Context} context
 * @param {Object} toolResult - Tool execution result
 * @returns {Context}
 */
export function addToolResult(context, toolResult) {
  context.messages.push({
    role: 'tool',
    content: toolResult.content
  });

  recordEvent('context_tool_added', {
    content_length: toolResult.content.length,
    total_messages: context.messages.length
  });

  return context;
}

/**
 * Build request object for model
 * @param {Context} context
 * @returns {Object} - Request for chat API
 */
export function buildRequest(context) {
  const request = {
    model: context.model,
    messages: context.messages
  };

  if (context.tools.length > 0) {
    request.tools = context.tools;
  }

  recordEvent('context_request_built', {
    model: request.model,
    message_count: request.messages.length,
    has_tools: !!request.tools
  });

  return request;
}

/**
 * Check if context should continue (more turns allowed)
 * @param {Context} context
 * @returns {{continue: boolean, reason?: string}}
 */
export function shouldContinue(context) {
  if (context.turn >= MAX_TURNS) {
    return {
      continue: false,
      reason: `Max turns reached (${MAX_TURNS})`
    };
  }

  return { continue: true };
}

/**
 * Get context summary for debugging
 * @param {Context} context
 * @returns {Object}
 */
export function getContextSummary(context) {
  return {
    model: context.model,
    mock: context.mock,
    turn: context.turn,
    message_count: context.messages.length,
    messages: context.messages.map(m => ({
      role: m.role,
      content_length: m.content?.length || 0,
      has_tool_calls: !!m.tool_calls
    }))
  };
}
