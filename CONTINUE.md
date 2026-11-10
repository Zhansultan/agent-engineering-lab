# Continue Point — HARNESS Project

**Last Updated:** 2026-11-03
**Status:** Phase A.3+ COMPLETE

## Quick Resume

```bash
cd "/home/zhabenov/tfw workshop/agent-engineering-lab"

# Verify state (46 tests must pass)
node --test tests/unit/

# Start web UI
node server.mjs
# Open http://localhost:3000, select "Ollama" mode

# CLI test
node harness.mjs --real "List files in sandbox"
```

## What's Implemented

### 9 Tools in lib/executor.mjs

| Tool | Zone | Description |
|------|------|-------------|
| `list_directory` | sandbox | List files |
| `read_text` | sandbox | Read file content |
| `find_files` | sandbox | Find by pattern |
| `search_text` | sandbox | Search in files |
| `write_file` | workspace | Create/overwrite file |
| `edit_file` | workspace | Replace text in file |
| `list_workspace` | workspace | List workspace files |
| `read_workspace` | workspace | Read workspace file |
| `run_command` | workspace | Execute bash command |

### Key Files

| File | Purpose |
|------|---------|
| `harness.mjs` | CLI entry (`--real` for Ollama) |
| `server.mjs` | Web server (port 3000) |
| `lib/executor.mjs` | 9 tools implementation |
| `lib/context.mjs` | Conversation management |
| `lib/client.mjs` | HTTP client (mock + Ollama) |
| `lib/recovery.mjs` | JSON recovery for small models |

### Storage Zones

```
sandbox/           → Read-only test files
workspace_files/   → Read-write model output
logs/events.jsonl  → Event log
```

### Security

- Path traversal blocked in both zones
- Command blacklist: `rm -rf /`, `sudo`, `chmod 777`, etc.
- Command timeout: 10s
- Output limit: 4KB

## Documentation Index

| Document | Purpose |
|----------|---------|
| `workspace/2026/HARNESS_20261103_HL/status.md` | Full project status |
| `workspace/2026/HARNESS_20261103_HL/HL-HARNESS.md` | High-level document |
| `docs/architecture.md` | Architecture overview |
| `docs/components.md` | Component descriptions |
| `docs/diagrams/README.md` | Diagram index |

## Test Commands

```bash
# All unit tests (46)
node --test tests/unit/

# Specific test file
node --test tests/unit/executor.test.mjs

# Integration (needs Ollama running)
node --test tests/integration/
```

## Next Steps (Phase B — Optional)

- [ ] History persistence
- [ ] Structured logging
- [ ] Multiple tool calls per turn
- [ ] Streaming responses

## Key Learnings

1. **Small models (qwen3.5:0.8b)** — 99.5% raw tool call failure, RecoveryParser required
2. **Tool calling cycle** — Model → tool_call → Executor → result → Model → answer
3. **Security zones** — Sandbox (read) + Workspace (write) isolation
4. **Blacklist over whitelist** — For command execution safety
