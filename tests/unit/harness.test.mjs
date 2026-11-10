/**
 * Harness Unit Tests - Phase A.1
 *
 * Run: npm test
 * Or:  node --test tests/unit/
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { rm } from 'node:fs/promises';

import { chat } from '../../lib/client.mjs';
import { parseResponse, validateInput } from '../../lib/parser.mjs';
import { getEventsFilePath } from '../../lib/events.mjs';

describe('Client (Mock Mode)', () => {
  it('returns mock response for simple message', async () => {
    const request = {
      model: 'mock',
      messages: [{ role: 'user', content: 'Hello' }]
    };

    const response = await chat(request, { mock: true });

    assert.strictEqual(response.model, 'mock');
    assert.strictEqual(response._mock, true);
    assert.strictEqual(response.message.role, 'assistant');
    assert.ok(response.message.content.includes('[MOCK]'));
  });

  it('returns tool_call for file query', async () => {
    const request = {
      model: 'mock',
      messages: [{ role: 'user', content: 'Найди файлы' }]
    };

    const response = await chat(request, { mock: true });

    assert.strictEqual(response._mock, true);
    assert.ok(response.message.tool_calls);
    assert.strictEqual(response.message.tool_calls.length, 1);
    assert.strictEqual(response.message.tool_calls[0].function.name, 'list_directory');
  });
});

describe('Parser', () => {
  it('parses text response', async () => {
    const response = {
      message: {
        role: 'assistant',
        content: 'Hello there!'
      },
      model: 'test',
      _mock: true
    };

    const parsed = await parseResponse(response);

    assert.strictEqual(parsed.type, 'text');
    assert.strictEqual(parsed.content, 'Hello there!');
    assert.strictEqual(parsed.mock, true);
  });

  it('parses tool_call response', async () => {
    const response = {
      message: {
        role: 'assistant',
        tool_calls: [{
          function: {
            name: 'read_text',
            arguments: '{"path": "test.txt"}'
          }
        }]
      },
      model: 'test',
      _mock: true
    };

    const parsed = await parseResponse(response);

    assert.strictEqual(parsed.type, 'tool_call');
    assert.strictEqual(parsed.tool_call.function.name, 'read_text');
  });

  it('returns error for invalid response', async () => {
    const parsed = await parseResponse({});

    assert.strictEqual(parsed.type, 'error');
    assert.ok(parsed.error.includes('Invalid'));
  });
});

describe('Input Validation', () => {
  it('accepts valid message', () => {
    const result = validateInput('Hello, world!');
    assert.strictEqual(result.valid, true);
  });

  it('rejects empty message', () => {
    const result = validateInput('');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('cannot be empty') || result.error.includes('required'));
  });

  it('rejects whitespace-only message', () => {
    const result = validateInput('   \n\t  ');
    assert.strictEqual(result.valid, false);
  });

  it('rejects null message', () => {
    const result = validateInput(null);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('required'));
  });

  it('rejects too long message', () => {
    const longMessage = 'a'.repeat(5000);
    const result = validateInput(longMessage);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes('long'));
  });
});

describe('Events', () => {
  it('events file path is defined', () => {
    const path = getEventsFilePath();
    assert.ok(path.includes('events.jsonl'));
  });
});

// Cleanup after tests
after(async () => {
  try {
    // Clean up test events file
    const eventsFile = getEventsFilePath();
    await rm(eventsFile, { force: true });
  } catch {
    // Ignore cleanup errors
  }
});
