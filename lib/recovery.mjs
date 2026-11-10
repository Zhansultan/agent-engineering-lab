/**
 * Recovery Parser Module
 *
 * Fixes malformed JSON in tool_calls from small models.
 * Research shows 99.5% raw tool call failure rate in sub-2B models.
 *
 * Common issues:
 * - Unquoted property names: {path: "."} → {"path": "."}
 * - Single quotes: {'path': '.'} → {"path": "."}
 * - Trailing commas: {"path": ".",} → {"path": "."}
 * - Missing braces: "path": "." → {"path": "."}
 * - Escaped quotes issues
 */

import { recordEvent } from './events.mjs';

/**
 * Attempt to fix malformed JSON string
 * @param {string} str - Potentially malformed JSON
 * @returns {{success: boolean, result: any, fixes: string[]}}
 */
export function recoverJSON(str) {
  const fixes = [];

  if (!str || typeof str !== 'string') {
    return { success: false, result: null, fixes: ['Input not a string'] };
  }

  let working = str.trim();

  // Try parsing as-is first
  try {
    return { success: true, result: JSON.parse(working), fixes: [] };
  } catch {
    // Continue with recovery
  }

  // Fix 1: Replace single quotes with double quotes
  if (working.includes("'")) {
    working = working.replace(/'/g, '"');
    fixes.push('single_quotes_to_double');
  }

  // Fix 2: Quote unquoted property names
  // Matches: {prop: or , prop: where prop is not quoted
  const unquotedPropRegex = /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g;
  if (unquotedPropRegex.test(working)) {
    working = working.replace(unquotedPropRegex, '$1"$2"$3');
    fixes.push('quoted_property_names');
  }

  // Fix 3: Remove trailing commas before } or ]
  const trailingCommaRegex = /,(\s*[}\]])/g;
  if (trailingCommaRegex.test(working)) {
    working = working.replace(trailingCommaRegex, '$1');
    fixes.push('removed_trailing_commas');
  }

  // Fix 4: Wrap in braces if missing
  if (!working.startsWith('{') && !working.startsWith('[')) {
    if (working.includes(':')) {
      working = '{' + working + '}';
      fixes.push('added_braces');
    }
  }

  // Fix 5: Handle escaped quotes inside strings
  // This is tricky - try to fix common patterns
  working = working.replace(/\\"/g, '"');
  if (working !== str) {
    fixes.push('fixed_escaped_quotes');
  }

  // Try parsing after fixes
  try {
    const result = JSON.parse(working);
    return { success: true, result, fixes };
  } catch (err) {
    return {
      success: false,
      result: null,
      fixes: [...fixes, `parse_failed: ${err.message}`]
    };
  }
}

/**
 * Recover tool_calls from model response
 * @param {Object} response - Raw response from Ollama
 * @returns {Promise<Object>} - Response with recovered tool_calls
 */
export async function recoverToolCalls(response) {
  if (!response?.message?.tool_calls) {
    return response;
  }

  const recoveredCalls = [];
  let anyRecovered = false;

  for (const call of response.message.tool_calls) {
    if (!call?.function) {
      recoveredCalls.push(call);
      continue;
    }

    const args = call.function.arguments;

    // If arguments is already an object, skip
    if (typeof args === 'object' && args !== null) {
      recoveredCalls.push(call);
      continue;
    }

    // Try to recover string arguments
    if (typeof args === 'string') {
      const { success, result, fixes } = recoverJSON(args);

      if (success && fixes.length > 0) {
        anyRecovered = true;
        await recordEvent('recovery_applied', {
          tool: call.function.name,
          fixes
        });

        recoveredCalls.push({
          ...call,
          function: {
            ...call.function,
            arguments: JSON.stringify(result)
          }
        });
      } else if (success) {
        // Already valid JSON
        recoveredCalls.push(call);
      } else {
        // Recovery failed - keep original
        await recordEvent('recovery_failed', {
          tool: call.function.name,
          original: args.substring(0, 100),
          fixes
        });
        recoveredCalls.push(call);
      }
    } else {
      recoveredCalls.push(call);
    }
  }

  if (anyRecovered) {
    return {
      ...response,
      message: {
        ...response.message,
        tool_calls: recoveredCalls
      },
      _recovered: true
    };
  }

  return response;
}

/**
 * Extract tool call from text content (fallback)
 *
 * Some models return tool calls as text instead of structured tool_calls.
 * This attempts to extract them.
 *
 * @param {string} content - Text content that might contain tool call
 * @returns {{found: boolean, tool_call?: Object}}
 */
export function extractToolCallFromText(content) {
  if (!content || typeof content !== 'string') {
    return { found: false };
  }

  // Pattern 1: <tool_call>{"name": "...", "arguments": {...}}</tool_call>
  const toolCallTagMatch = content.match(/<tool_call>([\s\S]*?)<\/tool_call>/i);
  if (toolCallTagMatch) {
    const { success, result } = recoverJSON(toolCallTagMatch[1]);
    if (success && result.name) {
      return {
        found: true,
        tool_call: {
          function: {
            name: result.name,
            arguments: JSON.stringify(result.arguments || {})
          }
        }
      };
    }
  }

  // Pattern 2: ```json ... ``` with function call structure
  const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)```/i);
  if (jsonBlockMatch) {
    const { success, result } = recoverJSON(jsonBlockMatch[1]);
    if (success && (result.name || result.function)) {
      const funcData = result.function || result;
      return {
        found: true,
        tool_call: {
          function: {
            name: funcData.name,
            arguments: JSON.stringify(funcData.arguments || {})
          }
        }
      };
    }
  }

  // Pattern 3: Direct function call syntax: function_name({"arg": "value"})
  const funcCallMatch = content.match(/(\w+)\s*\(\s*(\{[\s\S]*?\})\s*\)/);
  if (funcCallMatch) {
    const { success, result } = recoverJSON(funcCallMatch[2]);
    if (success) {
      return {
        found: true,
        tool_call: {
          function: {
            name: funcCallMatch[1],
            arguments: JSON.stringify(result)
          }
        }
      };
    }
  }

  return { found: false };
}
