#!/usr/bin/env node

/**
 * Harness Web Server - Phase A.3
 *
 * Provides web UI with full tool execution loop.
 *
 * Usage:
 *   node server.mjs           # Start on port 3000
 *   node server.mjs --port 8080
 *
 * Endpoints:
 *   GET  /           - Web UI
 *   POST /api/chat   - Send message (full cycle)
 *   GET  /api/events - Get recent events
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { startSession, recordEvent, getEventsFilePath } from './lib/events.mjs';
import { chat } from './lib/client.mjs';
import { parseResponse, validateInput } from './lib/parser.mjs';
import { execute } from './lib/executor.mjs';
import {
  createContext,
  addUserMessage,
  addAssistantResponse,
  addToolResult,
  buildRequest,
  shouldContinue
} from './lib/context.mjs';

const moduleRoot = dirname(fileURLToPath(import.meta.url));
const WEB_DIR = join(moduleRoot, 'web');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

/**
 * Run full harness loop
 */
async function runLoop(message, mock) {
  const context = createContext({ mock });
  addUserMessage(context, message);

  const steps = [];

  while (true) {
    const check = shouldContinue(context);
    if (!check.continue) {
      steps.push({ type: 'limit', message: check.reason });
      break;
    }

    const request = buildRequest(context);
    const response = await chat(request, { mock });
    const parsed = await parseResponse(response);

    addAssistantResponse(context, response);

    if (parsed.type === 'error') {
      // Check if we just finished tool execution
      const lastMsg = context.messages[context.messages.length - 2];
      if (lastMsg?.role === 'tool') {
        steps.push({
          type: 'done',
          message: 'Completed after tool execution'
        });
      } else {
        steps.push({ type: 'error', message: parsed.error });
      }
      break;
    }

    if (parsed.type === 'text') {
      steps.push({
        type: 'response',
        content: parsed.content,
        mock: parsed.mock
      });
      break;
    }

    if (parsed.type === 'tool_call') {
      const toolCall = parsed.tool_call;
      const args = typeof toolCall.function.arguments === 'string'
        ? toolCall.function.arguments
        : JSON.stringify(toolCall.function.arguments);

      steps.push({
        type: 'tool_call',
        name: toolCall.function.name,
        args: args
      });

      // Execute tool
      const result = await execute(toolCall);
      addToolResult(context, result);

      // Parse result for display
      let resultDisplay;
      try {
        const data = JSON.parse(result.content);
        if (data.error) {
          resultDisplay = { error: data.error };
        } else if (data.items) {
          resultDisplay = { items: data.items };
        } else if (data.content) {
          resultDisplay = {
            content: data.content.substring(0, 500),
            truncated: data.content.length > 500
          };
        } else if (data.matches) {
          resultDisplay = { matches: data.matches };
        } else if (data.results) {
          resultDisplay = { results: data.results };
        } else {
          resultDisplay = data;
        }
      } catch {
        resultDisplay = { raw: result.content.substring(0, 200) };
      }

      steps.push({
        type: 'tool_result',
        name: toolCall.function.name,
        result: resultDisplay
      });

      continue;
    }
  }

  return {
    steps,
    turns: context.turn,
    messages: context.messages.length
  };
}

/**
 * Handle chat API request
 */
async function handleChat(req, res) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  try {
    const { message, mock = true } = JSON.parse(body);

    startSession();
    await recordEvent('web_request', { message_length: message?.length, mock });

    // Validate
    const validation = validateInput(message);
    if (!validation.valid) {
      await recordEvent('validation_error', { error: validation.error });
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: validation.error }));
      return;
    }

    // Run full loop
    const result = await runLoop(message, mock);

    await recordEvent('web_response', {
      steps: result.steps.length,
      turns: result.turns
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));

  } catch (err) {
    await recordEvent('web_error', { error: err.message });
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * Handle events API request
 */
async function handleEvents(req, res) {
  try {
    const eventsFile = getEventsFilePath();
    const content = await readFile(eventsFile, 'utf8').catch(() => '');
    const lines = content.trim().split('\n').filter(Boolean);
    const events = lines.slice(-50).map(line => JSON.parse(line));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ events }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * Serve static files
 */
async function handleStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = join(WEB_DIR, filePath);

  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

/**
 * Request handler
 */
async function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/chat') {
    return handleChat(req, res);
  }

  if (req.method === 'GET' && url.pathname === '/api/events') {
    return handleEvents(req, res);
  }

  return handleStatic(req, res);
}

// Parse CLI arguments
const args = process.argv.slice(2);
let port = 3000;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
  }
}

// Start server
const server = createServer(handleRequest);

server.listen(port, () => {
  console.log(`
========================================
  Harness Web Server - Phase A.3
========================================

  URL:    http://localhost:${port}

  Modes:
    Mock    - instant test responses
    Ollama  - real model (3-15s per turn)

  Full tool execution loop enabled!

  Press Ctrl+C to stop
========================================
`);
});
