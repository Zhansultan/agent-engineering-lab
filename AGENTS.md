# AGENTS.md - Agent Instructions

This file provides context and instructions for AI agents working on this project.

## North Star

**Человек понимает и контролирует архитектуру без погружения в детали реализации.**

Владелец должен понимать что и как будет сделано, контролировать архитектуру и инженерию, быть уверен в соответствии функциональным требованиям — не вникая в код.

## Project Overview

**Agent Engineering Lab** - educational project for learning harness architecture through
building core mechanisms from scratch using local Ollama models.

## Key Context

- **Owner**: Zhansultan Abenov
- **Organization**: Innoforce
- **Course**: Agent Engineering
- **Primary language**: Russian
- **Tutorial mode**: enabled (provide detailed explanations)

## Technical Stack

- Node.js v24.22.0
- Ollama v0.40.6 with qwen3.5:0.8b model
- ES modules (.mjs)

<!-- TFW:AGENTS:START -->
## TFW (Trace-First Workflow)

This project uses Trace-First Workflow v3.9.2. Configuration and workflows live in `.tfw/`.

### Task Lifecycle

TODO -> HL_DRAFT -> RES -> TS_DRAFT -> ONB -> RF -> REV -> KNW -> DONE

### Current Work

Active task container: `workspace/`
Task prefix: HARNESS

### Commands

Use `/tfw-plan` to start new work. Read `.tfw/README.md` for philosophy.
All traces are preserved in task directories under `workspace/{YYYY}/`.
<!-- TFW:AGENTS:END -->

## Harness Learning Goals

1. **Context gathering** - how agents collect information from environment
2. **Model calling** - how agents invoke LLM APIs with structured prompts
3. **Structured output** - how agents parse and validate model responses
4. **Tool calling** - how agents execute actions and handle tool results

## Reference Systems

Study these implementations to understand patterns:
- Codex (OpenAI)
- Claude Code (Anthropic)
- Antigravity

## Development Guidelines

- Write working code, not placeholders
- Document decisions in task traces
- Use TFW workflows for all significant work

## Architecture Documentation

See `docs/architecture-requirements.md` for full details.

### Methodology
- **C4 Model** — Context, Container, Component, Code levels
- **UML** — behavioral and structural diagrams
- **Structurizr** — diagrams as code

### Required Diagrams

| Diagram | When Required |
|---------|---------------|
| Component | Any feature with >1 component |
| Class | Complex domain model |
| State | FSM, lifecycle, stateful objects |
| Activity | Business processes, complex logic |
| Deployment | Any deployment change |
| Sequence | API flows, integrations |

### Before Implementation
1. Create component + sequence diagrams
2. Get owner approval on architecture
3. Owner must understand without reading code

### After Implementation
1. Update diagrams if architecture changed
2. Diagrams must match actual code

## Testing Strategy

See `docs/testing.md` for full details.

### Test Levels

| Level | Purpose | API Calls | Command |
|-------|---------|-----------|---------|
| Unit | Code logic, mocks | None | `npm test` |
| Integration | Ollama/API | Limited | `npm run test:integration` |
| Evals | Model quality | Yes | `npm run test:evals` |

### Rules for Agents

1. **Default tests must work offline** — use mocks and fixtures
2. **Never call models just to test code** — mock the responses
3. **Integration tests need explicit limits:**
   - Goal (what is being verified)
   - Request limit (max API calls)
   - Timeout (max wait time)
   - Max response size

### Environment Check

`preflight-v2.mjs` is an environment readiness check, not a test.
It verifies Node.js, Ollama, and model availability.

```bash
node preflight-v2.mjs  # Environment check (calls Ollama once)
```
