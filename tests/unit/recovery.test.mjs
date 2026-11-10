/**
 * Recovery Parser Unit Tests - Phase A.2
 *
 * Run: node --test tests/unit/recovery.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { recoverJSON, extractToolCallFromText } from '../../lib/recovery.mjs';

describe('recoverJSON', () => {
  it('passes valid JSON through unchanged', () => {
    const input = '{"path": "."}';
    const { success, result, fixes } = recoverJSON(input);

    assert.strictEqual(success, true);
    assert.deepStrictEqual(result, { path: '.' });
    assert.strictEqual(fixes.length, 0);
  });

  it('fixes single quotes to double quotes', () => {
    const input = "{'path': '.'}";
    const { success, result, fixes } = recoverJSON(input);

    assert.strictEqual(success, true);
    assert.deepStrictEqual(result, { path: '.' });
    assert.ok(fixes.includes('single_quotes_to_double'));
  });

  it('fixes unquoted property names', () => {
    const input = '{path: "."}';
    const { success, result, fixes } = recoverJSON(input);

    assert.strictEqual(success, true);
    assert.deepStrictEqual(result, { path: '.' });
    assert.ok(fixes.includes('quoted_property_names'));
  });

  it('fixes trailing commas', () => {
    const input = '{"path": ".",}';
    const { success, result, fixes } = recoverJSON(input);

    assert.strictEqual(success, true);
    assert.deepStrictEqual(result, { path: '.' });
    assert.ok(fixes.includes('removed_trailing_commas'));
  });

  it('adds missing braces', () => {
    const input = '"path": "."';
    const { success, result, fixes } = recoverJSON(input);

    assert.strictEqual(success, true);
    assert.deepStrictEqual(result, { path: '.' });
    assert.ok(fixes.includes('added_braces'));
  });

  it('handles multiple issues at once', () => {
    const input = "{path: '.',}";
    const { success, result, fixes } = recoverJSON(input);

    assert.strictEqual(success, true);
    assert.deepStrictEqual(result, { path: '.' });
    assert.ok(fixes.length >= 2);
  });

  it('returns failure for unparseable input', () => {
    const input = 'not json at all';
    const { success, result } = recoverJSON(input);

    assert.strictEqual(success, false);
    assert.strictEqual(result, null);
  });

  it('handles null input', () => {
    const { success } = recoverJSON(null);
    assert.strictEqual(success, false);
  });

  it('handles empty string', () => {
    const { success } = recoverJSON('');
    assert.strictEqual(success, false);
  });
});

describe('extractToolCallFromText', () => {
  it('extracts tool_call tag format', () => {
    const content = 'Let me check. <tool_call>{"name": "list_directory", "arguments": {"path": "."}}</tool_call>';
    const { found, tool_call } = extractToolCallFromText(content);

    assert.strictEqual(found, true);
    assert.strictEqual(tool_call.function.name, 'list_directory');
  });

  it('extracts JSON code block format', () => {
    const content = '```json\n{"name": "read_text", "arguments": {"path": "test.txt"}}\n```';
    const { found, tool_call } = extractToolCallFromText(content);

    assert.strictEqual(found, true);
    assert.strictEqual(tool_call.function.name, 'read_text');
  });

  it('extracts function call syntax', () => {
    const content = 'I will use list_directory({"path": "."})';
    const { found, tool_call } = extractToolCallFromText(content);

    assert.strictEqual(found, true);
    assert.strictEqual(tool_call.function.name, 'list_directory');
  });

  it('returns not found for plain text', () => {
    const content = 'This is just a regular response.';
    const { found } = extractToolCallFromText(content);

    assert.strictEqual(found, false);
  });

  it('handles null input', () => {
    const { found } = extractToolCallFromText(null);
    assert.strictEqual(found, false);
  });

  it('handles malformed JSON in tag', () => {
    const content = '<tool_call>{name: "test", arguments: {path: "."}}</tool_call>';
    const { found, tool_call } = extractToolCallFromText(content);

    // Should recover malformed JSON
    assert.strictEqual(found, true);
    assert.strictEqual(tool_call.function.name, 'test');
  });
});
