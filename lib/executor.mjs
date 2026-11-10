/**
 * Tool Executor Module
 *
 * Executes tool calls in sandbox (read) and workspace (write).
 * Implements security: path validation, size limits, command filtering.
 */

import { readFile, readdir, realpath, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { recordEvent } from './events.mjs';

const moduleRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const SANDBOX_ROOT = join(moduleRoot, 'sandbox');      // Read-only
const WORKSPACE_ROOT = join(moduleRoot, 'workspace_files');  // Read-write

// Security limits
const MAX_FILE_SIZE = 8192;        // 8 KiB
const MAX_SEARCH_RESULTS = 20;
const MAX_COMMAND_TIMEOUT = 10000; // 10 seconds
const MAX_OUTPUT_SIZE = 4096;      // 4 KiB

// Dangerous commands blacklist
const BLOCKED_COMMANDS = [
  'rm -rf /',
  'rm -rf ~',
  'sudo',
  'su ',
  'chmod 777',
  'mkfs',
  'dd if=',
  ':(){',
  'fork bomb',
  '> /dev/sd',
  'curl | sh',
  'wget | sh',
];

/**
 * Resolve and validate path within sandbox
 * @param {string} requestedPath - Requested path
 * @returns {Promise<string>} - Absolute safe path
 * @throws {Error} - If path is outside sandbox
 */
async function resolveSafePath(requestedPath) {
  const sandboxReal = await realpath(SANDBOX_ROOT);
  const fullPath = join(SANDBOX_ROOT, requestedPath || '.');

  let actualPath;
  try {
    actualPath = await realpath(fullPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Path not found: ${requestedPath}`);
    }
    throw err;
  }

  // Security check: must be inside sandbox
  if (!actualPath.startsWith(sandboxReal + '/') && actualPath !== sandboxReal) {
    throw new Error(`Access denied: path outside sandbox`);
  }

  return actualPath;
}

/**
 * Recursively walk directory
 * @param {string} dir - Directory to walk
 * @returns {Promise<string[]>} - Array of file paths
 */
async function walkDirectory(dir) {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await walkDirectory(fullPath);
      results.push(...subFiles);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}

// Tool implementations

async function listDirectory(args) {
  const requestedPath = args?.path || '.';
  const safePath = await resolveSafePath(requestedPath);

  const stats = await stat(safePath);
  if (!stats.isDirectory()) {
    throw new Error(`Not a directory: ${requestedPath}`);
  }

  const entries = await readdir(safePath, { withFileTypes: true });
  const items = entries.map(entry => ({
    name: entry.name,
    type: entry.isDirectory() ? 'directory' : 'file'
  }));

  return { path: requestedPath, items };
}

async function readText(args) {
  if (!args?.path) {
    throw new Error('Path is required');
  }

  const safePath = await resolveSafePath(args.path);

  const stats = await stat(safePath);
  if (!stats.isFile()) {
    throw new Error(`Not a file: ${args.path}`);
  }

  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${stats.size} bytes (max ${MAX_FILE_SIZE})`);
  }

  const content = await readFile(safePath, 'utf8');
  return { path: args.path, content };
}

async function findFiles(args) {
  if (!args?.pattern) {
    throw new Error('Pattern is required');
  }

  const sandboxReal = await realpath(SANDBOX_ROOT);
  const allFiles = await walkDirectory(sandboxReal);

  const pattern = args.pattern.toLowerCase();
  const matches = allFiles
    .filter(f => f.toLowerCase().includes(pattern))
    .map(f => relative(sandboxReal, f))
    .slice(0, MAX_SEARCH_RESULTS);

  return { pattern: args.pattern, matches, total: matches.length };
}

async function searchText(args) {
  if (!args?.query) {
    throw new Error('Query is required');
  }

  const sandboxReal = await realpath(SANDBOX_ROOT);
  const allFiles = await walkDirectory(sandboxReal);
  const query = args.query.toLowerCase();
  const results = [];

  for (const filePath of allFiles) {
    const stats = await stat(filePath);
    if (stats.size > MAX_FILE_SIZE) continue;

    try {
      const content = await readFile(filePath, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(query)) {
          const start = Math.max(0, i - 2);
          const end = Math.min(lines.length, i + 3);
          const context = lines.slice(start, end).join('\n');

          results.push({
            file: relative(sandboxReal, filePath),
            line: i + 1,
            context
          });

          if (results.length >= MAX_SEARCH_RESULTS) break;
        }
      }
    } catch {
      continue;
    }

    if (results.length >= MAX_SEARCH_RESULTS) break;
  }

  return { query: args.query, results, total: results.length };
}

// ============================================================
// WRITE TOOLS (workspace only)
// ============================================================

/**
 * Resolve path in workspace (writable area)
 */
async function resolveWorkspacePath(requestedPath) {
  // Ensure workspace exists
  await mkdir(WORKSPACE_ROOT, { recursive: true });

  const fullPath = join(WORKSPACE_ROOT, requestedPath || '');

  // Normalize and check it's inside workspace
  const workspaceReal = await realpath(WORKSPACE_ROOT);
  const normalizedPath = join(workspaceReal, requestedPath || '');

  // Security: must be inside workspace
  if (!normalizedPath.startsWith(workspaceReal)) {
    throw new Error('Access denied: path outside workspace');
  }

  return normalizedPath;
}

/**
 * write_file - Create or overwrite a file
 */
async function writeFileContent(args) {
  if (!args?.path) {
    throw new Error('Path is required');
  }
  if (args.content === undefined) {
    throw new Error('Content is required');
  }

  const safePath = await resolveWorkspacePath(args.path);

  // Ensure parent directory exists
  const parentDir = dirname(safePath);
  await mkdir(parentDir, { recursive: true });

  // Write file
  await writeFile(safePath, args.content, 'utf8');

  return {
    path: args.path,
    size: args.content.length,
    message: `File written: ${args.path}`
  };
}

/**
 * edit_file - Replace text in a file
 */
async function editFile(args) {
  if (!args?.path) {
    throw new Error('Path is required');
  }
  if (!args?.old_text) {
    throw new Error('old_text is required');
  }
  if (args.new_text === undefined) {
    throw new Error('new_text is required');
  }

  const safePath = await resolveWorkspacePath(args.path);

  // Read current content
  let content;
  try {
    content = await readFile(safePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`File not found: ${args.path}`);
    }
    throw err;
  }

  // Check if old_text exists
  if (!content.includes(args.old_text)) {
    throw new Error(`Text not found in file: "${args.old_text.substring(0, 50)}..."`);
  }

  // Replace
  const newContent = content.replace(args.old_text, args.new_text);
  await writeFile(safePath, newContent, 'utf8');

  return {
    path: args.path,
    replaced: true,
    message: `Replaced text in ${args.path}`
  };
}

/**
 * list_workspace - List files in workspace
 */
async function listWorkspace(args) {
  await mkdir(WORKSPACE_ROOT, { recursive: true });

  const requestedPath = args?.path || '.';
  const safePath = await resolveWorkspacePath(requestedPath);

  let stats;
  try {
    stats = await stat(safePath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { path: requestedPath, items: [], message: 'Directory is empty or does not exist' };
    }
    throw err;
  }

  if (!stats.isDirectory()) {
    throw new Error(`Not a directory: ${requestedPath}`);
  }

  const entries = await readdir(safePath, { withFileTypes: true });
  const items = entries.map(entry => ({
    name: entry.name,
    type: entry.isDirectory() ? 'directory' : 'file'
  }));

  return { path: requestedPath, items };
}

/**
 * read_workspace - Read file from workspace
 */
async function readWorkspace(args) {
  if (!args?.path) {
    throw new Error('Path is required');
  }

  const safePath = await resolveWorkspacePath(args.path);

  const stats = await stat(safePath);
  if (!stats.isFile()) {
    throw new Error(`Not a file: ${args.path}`);
  }

  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${stats.size} bytes (max ${MAX_FILE_SIZE})`);
  }

  const content = await readFile(safePath, 'utf8');
  return { path: args.path, content };
}

// ============================================================
// COMMAND EXECUTION
// ============================================================

/**
 * Check if command is safe
 */
function isCommandSafe(command) {
  const lower = command.toLowerCase();

  for (const blocked of BLOCKED_COMMANDS) {
    if (lower.includes(blocked.toLowerCase())) {
      return { safe: false, reason: `Blocked pattern: ${blocked}` };
    }
  }

  return { safe: true };
}

/**
 * run_command - Execute a shell command
 */
async function runCommand(args) {
  if (!args?.command) {
    throw new Error('Command is required');
  }

  // Security check
  const safetyCheck = isCommandSafe(args.command);
  if (!safetyCheck.safe) {
    throw new Error(`Command blocked: ${safetyCheck.reason}`);
  }

  // Ensure workspace exists for cwd
  await mkdir(WORKSPACE_ROOT, { recursive: true });

  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let killed = false;

    const proc = spawn('bash', ['-c', args.command], {
      cwd: WORKSPACE_ROOT,
      timeout: MAX_COMMAND_TIMEOUT,
      env: {
        ...process.env,
        PATH: process.env.PATH,
        HOME: process.env.HOME
      }
    });

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > MAX_OUTPUT_SIZE) {
        stdout = stdout.substring(0, MAX_OUTPUT_SIZE) + '\n[truncated]';
        proc.kill();
        killed = true;
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      if (stderr.length > MAX_OUTPUT_SIZE) {
        stderr = stderr.substring(0, MAX_OUTPUT_SIZE) + '\n[truncated]';
      }
    });

    const timeout = setTimeout(() => {
      proc.kill();
      killed = true;
    }, MAX_COMMAND_TIMEOUT);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;

      resolve({
        command: args.command,
        exit_code: killed ? -1 : code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        duration_ms: duration,
        killed
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      resolve({
        command: args.command,
        exit_code: -1,
        stdout: '',
        stderr: err.message,
        error: true
      });
    });
  });
}

// Tool registry
const TOOLS = {
  // Read tools (sandbox)
  list_directory: listDirectory,
  read_text: readText,
  find_files: findFiles,
  search_text: searchText,
  // Write tools (workspace)
  write_file: writeFileContent,
  edit_file: editFile,
  list_workspace: listWorkspace,
  read_workspace: readWorkspace,
  run_command: runCommand
};

/**
 * Execute a tool call
 * @param {Object} toolCall - Tool call from model
 * @returns {Promise<Object>} - Tool result message
 */
export async function execute(toolCall) {
  const startTime = Date.now();
  const funcName = toolCall?.function?.name;

  if (!funcName) {
    throw new Error('Invalid tool call: missing function name');
  }

  const tool = TOOLS[funcName];
  if (!tool) {
    const result = { error: `Unknown tool: ${funcName}` };
    await recordEvent('tool_error', { name: funcName, error: result.error });
    return {
      role: 'tool',
      content: JSON.stringify(result)
    };
  }

  // Parse arguments
  let args = toolCall.function.arguments;
  if (typeof args === 'string') {
    try {
      args = JSON.parse(args);
    } catch (err) {
      const result = { error: `Invalid arguments: ${err.message}` };
      await recordEvent('tool_error', { name: funcName, error: result.error });
      return {
        role: 'tool',
        content: JSON.stringify(result)
      };
    }
  }
  args = args || {};

  // Execute tool
  try {
    const result = await tool(args);
    const duration = Date.now() - startTime;

    await recordEvent('tool_executed', {
      name: funcName,
      args,
      duration_ms: duration,
      success: true
    });

    return {
      role: 'tool',
      content: JSON.stringify(result, null, 2)
    };

  } catch (err) {
    const duration = Date.now() - startTime;

    await recordEvent('tool_executed', {
      name: funcName,
      args,
      duration_ms: duration,
      success: false,
      error: err.message
    });

    // Return error as result (model can retry)
    return {
      role: 'tool',
      content: JSON.stringify({ error: err.message })
    };
  }
}

/**
 * Get available tool definitions for model
 * @returns {Array} - Tool definitions in OpenAI format
 */
export function getToolDefinitions() {
  return [
    {
      type: 'function',
      function: {
        name: 'list_directory',
        description: 'List files and folders in a directory. Use "." for current directory.',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path relative to sandbox root'
            }
          },
          required: ['path']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'read_text',
        description: 'Read contents of a text file',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to sandbox root'
            }
          },
          required: ['path']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'find_files',
        description: 'Find files by name pattern. Searches recursively.',
        parameters: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'Part of filename to search for'
            }
          },
          required: ['pattern']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'search_text',
        description: 'Search for text inside files',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Text to search for'
            }
          },
          required: ['query']
        }
      }
    },
    // Write tools (workspace)
    {
      type: 'function',
      function: {
        name: 'write_file',
        description: 'Create or overwrite a file in workspace',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to workspace root'
            },
            content: {
              type: 'string',
              description: 'Content to write'
            }
          },
          required: ['path', 'content']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'edit_file',
        description: 'Replace text in an existing file in workspace',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to workspace root'
            },
            old_text: {
              type: 'string',
              description: 'Text to find and replace'
            },
            new_text: {
              type: 'string',
              description: 'Replacement text'
            }
          },
          required: ['path', 'old_text', 'new_text']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'list_workspace',
        description: 'List files in workspace (writable area)',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path relative to workspace root'
            }
          },
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'read_workspace',
        description: 'Read a file from workspace',
        parameters: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to workspace root'
            }
          },
          required: ['path']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'run_command',
        description: 'Execute a shell command in workspace. Some dangerous commands are blocked.',
        parameters: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Shell command to execute'
            }
          },
          required: ['command']
        }
      }
    }
  ];
}

/**
 * Get sandbox root path
 * @returns {string}
 */
export function getSandboxRoot() {
  return SANDBOX_ROOT;
}
