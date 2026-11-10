#!/usr/bin/env node

/**
 * Harness CLI Entry Point
 *
 * Usage:
 *   node harness.mjs "your message"
 *   node harness.mjs --mock "your message"   # Force mock mode
 *   node harness.mjs --real "your message"   # Use Ollama
 *
 * Example:
 *   node harness.mjs --real "What files are in the sandbox?"
 *   node harness.mjs --real "Read the meeting notes"
 */

import { startSession, recordEvent } from './lib/events.mjs';
import { chat } from './lib/client.mjs';
import { parseResponse, validateInput } from './lib/parser.mjs';
import { execute } from './lib/executor.mjs';
import {
  createContext,
  addUserMessage,
  addAssistantResponse,
  addToolResult,
  buildRequest,
  shouldContinue,
  getContextSummary
} from './lib/context.mjs';

/**
 * Main harness loop
 * @param {string} userMessage - User's message
 * @param {Object} options - Options
 * @param {boolean} [options.mock=true] - Use mock mode
 */
async function runHarness(userMessage, options = {}) {
  const { mock = true } = options;

  startSession();
  await recordEvent('session_start', { mock });

  // Validate input
  const validation = validateInput(userMessage);
  if (!validation.valid) {
    await recordEvent('validation_error', { error: validation.error });
    console.error(`\nError: ${validation.error}`);
    process.exit(1);
  }

  // Create context and add user message
  const context = createContext({ mock });
  addUserMessage(context, userMessage);

  console.log('\n' + '─'.repeat(60));
  console.log(`USER: ${userMessage}`);
  console.log('─'.repeat(60));

  try {
    // Main loop
    while (true) {
      const check = shouldContinue(context);
      if (!check.continue) {
        console.log(`\n[STOPPED] ${check.reason}`);
        break;
      }

      // Build and send request
      const request = buildRequest(context);
      const response = await chat(request, { mock });

      // Parse response
      const parsed = await parseResponse(response);

      // Add to context
      addAssistantResponse(context, response);

      if (parsed.type === 'error') {
        // Check if last message was a tool result - model might be done
        const lastMsg = context.messages[context.messages.length - 2];
        if (lastMsg?.role === 'tool') {
          console.log('\n' + '─'.repeat(60));
          console.log('ASSISTANT: [Model finished after tool execution]');
          console.log('Last tool result was shown above.');
          console.log('─'.repeat(60));
          break;
        }
        console.log(`\n[ERROR] ${parsed.error}`);
        break;
      }

      if (parsed.type === 'text') {
        // Final response - show and exit
        console.log('\n' + '─'.repeat(60));
        console.log('ASSISTANT:');
        console.log(parsed.content);
        console.log('─'.repeat(60));

        if (parsed.mock) {
          console.log('[MOCK] This was a test response');
        }
        break;
      }

      if (parsed.type === 'tool_call') {
        const toolCall = parsed.tool_call;
        const args = typeof toolCall.function.arguments === 'string'
          ? toolCall.function.arguments
          : JSON.stringify(toolCall.function.arguments);

        console.log(`\n[TOOL] ${toolCall.function.name}(${args})`);

        // Execute tool
        const result = await execute(toolCall);
        addToolResult(context, result);

        // Parse and show result
        try {
          const resultData = JSON.parse(result.content);
          if (resultData.error) {
            console.log(`[RESULT] Error: ${resultData.error}`);
          } else if (resultData.items) {
            // list_directory
            console.log(`[RESULT] ${resultData.items.length} items:`);
            for (const item of resultData.items.slice(0, 5)) {
              console.log(`  ${item.type === 'directory' ? '📁' : '📄'} ${item.name}`);
            }
            if (resultData.items.length > 5) {
              console.log(`  ... and ${resultData.items.length - 5} more`);
            }
          } else if (resultData.content) {
            // read_text
            const preview = resultData.content.substring(0, 200);
            console.log(`[RESULT] File content (${resultData.content.length} chars):`);
            console.log(`  ${preview}${resultData.content.length > 200 ? '...' : ''}`);
          } else if (resultData.matches) {
            // find_files
            console.log(`[RESULT] Found ${resultData.total} files:`);
            for (const match of resultData.matches.slice(0, 5)) {
              console.log(`  📄 ${match}`);
            }
          } else if (resultData.results) {
            // search_text
            console.log(`[RESULT] Found ${resultData.total} matches`);
          } else {
            console.log(`[RESULT] ${result.content.substring(0, 100)}`);
          }
        } catch {
          console.log(`[RESULT] ${result.content.substring(0, 100)}`);
        }

        // Continue loop - model will process tool result
        continue;
      }
    }

    // Final summary
    const summary = getContextSummary(context);
    await recordEvent('session_end', {
      turns: summary.turn,
      total_messages: summary.message_count,
      mock: summary.mock
    });

    console.log(`\n[Session: ${summary.turn} turns, ${summary.message_count} messages]`);

  } catch (err) {
    await recordEvent('session_error', { error: err.message });
    console.error(`\nError: ${err.message}`);
    process.exit(1);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
let mock = true;
let message = '';

for (const arg of args) {
  if (arg === '--mock') {
    mock = true;
  } else if (arg === '--real') {
    mock = false;
  } else if (!arg.startsWith('-')) {
    message = arg;
  }
}

if (!message) {
  console.log(`
Harness CLI - Phase A.3 (Full Cycle)

Usage:
  node harness.mjs "your message"
  node harness.mjs --mock "your message"   # Mock mode (default)
  node harness.mjs --real "your message"   # Use Ollama

Examples:
  node harness.mjs --real "What files are in the sandbox?"
  node harness.mjs --real "Read the meeting notes file"
  node harness.mjs --real "Find files with 'idea' in the name"
`);
  process.exit(0);
}

runHarness(message, { mock });
