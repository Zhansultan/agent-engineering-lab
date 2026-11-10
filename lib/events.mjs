/**
 * Event Recording Module
 *
 * Records harness events to console and JSON file.
 * Each event has: timestamp, stage, data, duration_ms
 */

import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const EVENTS_DIR = join(moduleRoot, 'logs');
const EVENTS_FILE = join(EVENTS_DIR, 'events.jsonl');

/** @type {number|null} */
let sessionStart = null;

/**
 * @typedef {Object} HarnessEvent
 * @property {string} timestamp - ISO timestamp
 * @property {string} stage - Event stage (request_received, context_built, etc.)
 * @property {Object} data - Stage-specific data
 * @property {number} duration_ms - Time since session start
 */

/**
 * Start a new session (resets timer)
 */
export function startSession() {
  sessionStart = Date.now();
}

/**
 * Record an event
 * @param {string} stage - Event stage name
 * @param {Object} data - Event data
 * @returns {Promise<HarnessEvent>}
 */
export async function recordEvent(stage, data = {}) {
  if (sessionStart === null) {
    startSession();
  }

  const event = {
    timestamp: new Date().toISOString(),
    stage,
    data,
    duration_ms: Date.now() - sessionStart
  };

  // Console output with formatting
  const stageLabel = `[${stage.toUpperCase()}]`.padEnd(20);
  const dataStr = Object.keys(data).length > 0
    ? JSON.stringify(data)
    : '';
  console.log(`${stageLabel} ${dataStr} (+${event.duration_ms}ms)`);

  // Write to JSON Lines file
  try {
    await mkdir(EVENTS_DIR, { recursive: true });
    await appendFile(EVENTS_FILE, JSON.stringify(event) + '\n');
  } catch (err) {
    console.error(`[EVENTS] Failed to write: ${err.message}`);
  }

  return event;
}

/**
 * Get events file path (for tests)
 * @returns {string}
 */
export function getEventsFilePath() {
  return EVENTS_FILE;
}
