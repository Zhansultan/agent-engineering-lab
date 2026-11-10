# Testing Strategy

## Principles

1. **Unit tests run without models or paid APIs** — use mocks and saved responses
2. **Integration tests with Ollama/API run separately** — with explicit limits
3. **Model quality evals run separately** — not mixed with code tests

## Test Levels

### Unit Tests (`tests/unit/`)

Purpose: Verify our code logic, error handling, tool calls, event recording.

**Rules:**
- No network calls
- Use mocks for API responses (saved in `tests/fixtures/`)
- Use dependency injection for testable design
- Fast execution (< 1 second per test)

**What to test:**
- Request/response parsing
- Error handling and edge cases
- Tool call construction and validation
- Event recording and state management
- Utility functions

**Example fixtures:**
```
tests/fixtures/
  ollama-chat-response.json
  ollama-error-response.json
  tool-call-examples.json
```

### Integration Tests (`tests/integration/`)

Purpose: Verify actual API communication with Ollama or external services.

**Rules for each test:**
- **Goal** — what exactly is being verified
- **Request limit** — max number of API calls (typically 1-3)
- **Timeout** — max wait time per request (e.g., 30s)
- **Max response size** — prevent runaway generation (e.g., 500 tokens)

**Example:**
```javascript
// tests/integration/ollama-chat.test.mjs
const TEST_CONFIG = {
  goal: 'Verify Ollama chat endpoint responds correctly',
  maxRequests: 1,
  timeout: 30000,
  maxTokens: 100
};
```

**When to run:**
- Before deployment
- After Ollama/model updates
- When debugging API issues

**NOT for:**
- Repeated runs during development
- CI on every commit (use unit tests)

### Model Evals (`tests/evals/`)

Purpose: Evaluate model quality on specific tasks.

**Rules:**
- Separate from code correctness tests
- Define evaluation criteria upfront
- Log all responses for analysis
- Run manually or on schedule, not on every change

**What to evaluate:**
- Response quality for project-specific prompts
- Tool call accuracy
- Instruction following
- Edge case handling

## Commands

```bash
# Default: unit tests only (fast, no API)
npm test

# Integration tests (requires running Ollama)
npm run test:integration

# Model evals (requires running Ollama)
npm run test:evals

# All tests
npm run test:all
```

## Environment Check

`preflight-v2.mjs` is **not a test** — it's an environment readiness check.
It verifies Node.js, Ollama, and model availability before workshops.

```bash
# Environment check (calls Ollama once)
node preflight-v2.mjs
```

## Creating New Tests

### Unit Test Template

```javascript
// tests/unit/parser.test.mjs
import { describe, it, expect } from 'vitest'; // or node:test
import { parseResponse } from '../../src/parser.mjs';
import fixture from '../fixtures/ollama-chat-response.json';

describe('parseResponse', () => {
  it('extracts content from valid response', () => {
    const result = parseResponse(fixture);
    expect(result.content).toBeDefined();
  });

  it('throws on malformed response', () => {
    expect(() => parseResponse({})).toThrow();
  });
});
```

### Integration Test Template

```javascript
// tests/integration/ollama-health.test.mjs
import { describe, it, expect, beforeAll } from 'vitest';

const CONFIG = {
  goal: 'Verify Ollama is responding',
  maxRequests: 1,
  timeout: 5000
};

describe('Ollama Health', () => {
  it('responds to version check', async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.timeout);

    try {
      const response = await fetch('http://127.0.0.1:11434/api/version', {
        signal: controller.signal
      });
      expect(response.ok).toBe(true);
    } finally {
      clearTimeout(timeout);
    }
  });
});
```

## Anti-Patterns

**Don't:**
- Call models repeatedly just to test code logic
- Mix unit and integration tests in one file
- Run integration tests in CI without explicit opt-in
- Use production API keys in tests
- Create tests without mocks that secretly call APIs

**Do:**
- Mock at the HTTP boundary
- Save representative responses as fixtures
- Document integration test requirements
- Gate integration tests behind environment variables
