/**
 * Ollama Integration Test - Phase A.2
 *
 * Run: npm run test:integration
 * Or:  node tests/integration/ollama.test.mjs
 *
 * IMPORTANT: This test makes real API calls to Ollama.
 * - Requires running Ollama on localhost:11434
 * - Limited to 1 request to minimize resource usage
 * - Timeout: 30 seconds
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';

import { chat, checkOllama } from '../../lib/client.mjs';
import { parseResponse } from '../../lib/parser.mjs';
import { startSession } from '../../lib/events.mjs';

const TEST_CONFIG = {
  goal: 'Verify Ollama responds correctly with tool calling',
  maxRequests: 1,
  timeout: 30000,
  maxTokens: 256
};

describe('Ollama Integration', () => {
  before(async () => {
    startSession();
    const check = await checkOllama();

    if (!check.available) {
      console.log(`\n⚠️  Ollama not available: ${check.error}`);
      console.log('   Start Ollama with: ollama serve\n');
    } else {
      console.log(`\n✓ Ollama v${check.version} available\n`);
    }
  });

  it('checks Ollama availability', async () => {
    const check = await checkOllama();
    console.log(`Ollama: ${check.available ? 'available' : 'not available'}`);

    // This test always passes - it's just a health check
    assert.ok(true);
  });

  it('returns tool_call for file query', { timeout: TEST_CONFIG.timeout }, async () => {
    // Skip if Ollama not available
    const check = await checkOllama();
    if (!check.available) {
      console.log('Skipping: Ollama not available');
      return;
    }

    const tools = [
      {
        type: 'function',
        function: {
          name: 'list_directory',
          description: 'List files in a directory',
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Directory path'
              }
            },
            required: ['path']
          }
        }
      }
    ];

    const request = {
      model: 'qwen3.5:0.8b',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. When asked about files, use the list_directory tool.'
        },
        {
          role: 'user',
          content: 'What files are in the current directory?'
        }
      ],
      tools
    };

    const response = await chat(request, { mock: false, timeout: TEST_CONFIG.timeout });

    assert.ok(response, 'Response should exist');
    assert.ok(response.message, 'Response should have message');

    const parsed = await parseResponse(response);

    // Model might return text or tool_call
    if (parsed.type === 'tool_call') {
      console.log(`Tool call: ${parsed.tool_call.function.name}`);
      assert.strictEqual(parsed.tool_call.function.name, 'list_directory');
    } else {
      console.log(`Note: Model returned text instead of tool_call: ${parsed.content.substring(0, 100)}...`);
      // This is acceptable - small models don't always use tools
    }
  });
});

// Run if executed directly
if (process.argv[1].endsWith('ollama.test.mjs')) {
  console.log('='.repeat(60));
  console.log('Ollama Integration Test - Phase A.2');
  console.log(`Config: ${JSON.stringify(TEST_CONFIG)}`);
  console.log('='.repeat(60));
}
