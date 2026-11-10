/**
 * Executor Unit Tests - Phase A.3
 *
 * Run: node --test tests/unit/executor.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { execute, getToolDefinitions, getSandboxRoot } from '../../lib/executor.mjs';

describe('Executor', () => {
  it('has sandbox root defined', () => {
    const root = getSandboxRoot();
    assert.ok(root.includes('sandbox'));
  });

  it('provides tool definitions', () => {
    const tools = getToolDefinitions();
    assert.ok(Array.isArray(tools));
    assert.strictEqual(tools.length, 9);  // 4 read + 5 write

    const names = tools.map(t => t.function.name);
    // Read tools
    assert.ok(names.includes('list_directory'));
    assert.ok(names.includes('read_text'));
    assert.ok(names.includes('find_files'));
    assert.ok(names.includes('search_text'));
    // Write tools
    assert.ok(names.includes('write_file'));
    assert.ok(names.includes('edit_file'));
    assert.ok(names.includes('list_workspace'));
    assert.ok(names.includes('read_workspace'));
    assert.ok(names.includes('run_command'));
  });

  it('executes list_directory', async () => {
    const toolCall = {
      function: {
        name: 'list_directory',
        arguments: '{"path": "."}'
      }
    };

    const result = await execute(toolCall);

    assert.strictEqual(result.role, 'tool');
    assert.ok(result.content);

    const data = JSON.parse(result.content);
    assert.ok(data.items);
    assert.ok(Array.isArray(data.items));
  });

  it('executes read_text', async () => {
    const toolCall = {
      function: {
        name: 'read_text',
        arguments: '{"path": "project-note.md"}'
      }
    };

    const result = await execute(toolCall);

    assert.strictEqual(result.role, 'tool');

    const data = JSON.parse(result.content);
    assert.ok(data.content || data.error);
  });

  it('returns error for unknown tool', async () => {
    const toolCall = {
      function: {
        name: 'unknown_tool',
        arguments: '{}'
      }
    };

    const result = await execute(toolCall);

    const data = JSON.parse(result.content);
    assert.ok(data.error);
    assert.ok(data.error.includes('Unknown tool'));
  });

  it('returns error for path traversal', async () => {
    const toolCall = {
      function: {
        name: 'read_text',
        arguments: '{"path": "../../../etc/passwd"}'
      }
    };

    const result = await execute(toolCall);

    const data = JSON.parse(result.content);
    assert.ok(data.error);
  });

  it('handles object arguments', async () => {
    const toolCall = {
      function: {
        name: 'list_directory',
        arguments: { path: '.' }  // Object, not string
      }
    };

    const result = await execute(toolCall);

    assert.strictEqual(result.role, 'tool');
    const data = JSON.parse(result.content);
    assert.ok(data.items || data.error);
  });

  it('handles invalid JSON arguments', async () => {
    const toolCall = {
      function: {
        name: 'list_directory',
        arguments: 'not valid json'
      }
    };

    const result = await execute(toolCall);

    const data = JSON.parse(result.content);
    assert.ok(data.error);
    assert.ok(data.error.includes('Invalid arguments'));
  });
});

describe('Tool: find_files', () => {
  it('finds files by pattern', async () => {
    const toolCall = {
      function: {
        name: 'find_files',
        arguments: '{"pattern": ".md"}'
      }
    };

    const result = await execute(toolCall);
    const data = JSON.parse(result.content);

    assert.ok(data.matches);
    assert.ok(data.matches.length > 0);
  });
});

describe('Tool: search_text', () => {
  it('searches text in files', async () => {
    const toolCall = {
      function: {
        name: 'search_text',
        arguments: '{"query": "project"}'
      }
    };

    const result = await execute(toolCall);
    const data = JSON.parse(result.content);

    assert.ok(data.results !== undefined);
  });
});

// ============================================================
// WRITE TOOLS TESTS
// ============================================================

describe('Tool: write_file', () => {
  it('creates new file in workspace', async () => {
    const toolCall = {
      function: {
        name: 'write_file',
        arguments: JSON.stringify({
          path: 'test-write.txt',
          content: 'Hello from test!'
        })
      }
    };

    const result = await execute(toolCall);
    const data = JSON.parse(result.content);

    assert.ok(data.path);
    assert.ok(data.message);
    assert.ok(!data.error);
  });

  it('requires path and content', async () => {
    const toolCall = {
      function: {
        name: 'write_file',
        arguments: '{}'
      }
    };

    const result = await execute(toolCall);
    const data = JSON.parse(result.content);

    assert.ok(data.error);
  });
});

describe('Tool: edit_file', () => {
  it('edits existing file', async () => {
    // First create a file
    await execute({
      function: {
        name: 'write_file',
        arguments: JSON.stringify({
          path: 'edit-test.txt',
          content: 'Original content here'
        })
      }
    });

    // Then edit it
    const toolCall = {
      function: {
        name: 'edit_file',
        arguments: JSON.stringify({
          path: 'edit-test.txt',
          old_text: 'Original',
          new_text: 'Modified'
        })
      }
    };

    const result = await execute(toolCall);
    const data = JSON.parse(result.content);

    assert.ok(data.replaced);
    assert.ok(!data.error);
  });

  it('returns error for non-existent file', async () => {
    const toolCall = {
      function: {
        name: 'edit_file',
        arguments: JSON.stringify({
          path: 'non-existent-file.txt',
          old_text: 'x',
          new_text: 'y'
        })
      }
    };

    const result = await execute(toolCall);
    const data = JSON.parse(result.content);

    assert.ok(data.error);
  });
});

describe('Tool: list_workspace', () => {
  it('lists workspace directory', async () => {
    // Create a file first
    await execute({
      function: {
        name: 'write_file',
        arguments: JSON.stringify({
          path: 'list-test.txt',
          content: 'test'
        })
      }
    });

    const toolCall = {
      function: {
        name: 'list_workspace',
        arguments: '{}'
      }
    };

    const result = await execute(toolCall);
    const data = JSON.parse(result.content);

    assert.ok(data.items !== undefined);
  });
});

describe('Tool: read_workspace', () => {
  it('reads file from workspace', async () => {
    // Create file
    await execute({
      function: {
        name: 'write_file',
        arguments: JSON.stringify({
          path: 'read-test.txt',
          content: 'Content to read'
        })
      }
    });

    const toolCall = {
      function: {
        name: 'read_workspace',
        arguments: '{"path": "read-test.txt"}'
      }
    };

    const result = await execute(toolCall);
    const data = JSON.parse(result.content);

    assert.ok(data.content);
    assert.ok(data.content.includes('Content to read'));
  });
});

describe('Tool: run_command', () => {
  it('executes simple command', async () => {
    const toolCall = {
      function: {
        name: 'run_command',
        arguments: '{"command": "echo hello"}'
      }
    };

    const result = await execute(toolCall);
    const data = JSON.parse(result.content);

    assert.strictEqual(data.exit_code, 0);
    assert.ok(data.stdout.includes('hello'));
  });

  it('blocks dangerous commands', async () => {
    const toolCall = {
      function: {
        name: 'run_command',
        arguments: '{"command": "sudo rm -rf /"}'
      }
    };

    const result = await execute(toolCall);
    const data = JSON.parse(result.content);

    assert.ok(data.error);
    assert.ok(data.error.includes('blocked'));
  });

  it('captures stderr', async () => {
    const toolCall = {
      function: {
        name: 'run_command',
        arguments: '{"command": "ls /nonexistent-dir-12345"}'
      }
    };

    const result = await execute(toolCall);
    const data = JSON.parse(result.content);

    assert.ok(data.exit_code !== 0);
  });
});

describe('Workspace Security', () => {
  it('blocks path traversal in write_file', async () => {
    const toolCall = {
      function: {
        name: 'write_file',
        arguments: JSON.stringify({
          path: '../../../tmp/evil.txt',
          content: 'malicious'
        })
      }
    };

    const result = await execute(toolCall);
    const data = JSON.parse(result.content);

    assert.ok(data.error);
    assert.ok(data.error.includes('outside workspace'));
  });
});
