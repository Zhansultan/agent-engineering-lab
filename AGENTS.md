# AGENTS.md - Agent Instructions

This file provides context and instructions for AI agents working on this project.

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
- Test with `node preflight-v2.mjs` pattern
- Document decisions in task traces
- Use TFW workflows for all significant work
