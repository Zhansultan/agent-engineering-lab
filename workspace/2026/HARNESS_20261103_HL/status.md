# Status — HARNESS_20261103_HL

**Task:** Учебный Harness для Agent Engineering
**Created:** 2026-11-03
**Updated:** 2026-11-03
**Status:** Phase A.3+ COMPLETE (Claude Code-like capabilities)

## Progress

- [x] Phase A.1: Mock mode + Web UI
- [x] Phase A.2: Ollama + RecoveryParser
- [x] Phase A.3: Tool execution loop (4 read tools)
- [x] **Phase A.3+: Write tools + Command execution (5 new tools)**

## Phase A.3+ — Новые возможности

### 9 инструментов (Read + Write + Command)

| Зона | Инструменты | Описание |
|------|-------------|----------|
| Sandbox (read) | `list_directory`, `read_text`, `find_files`, `search_text` | Чтение тестовых файлов |
| Workspace (write) | `write_file`, `edit_file`, `list_workspace`, `read_workspace` | Создание/редактирование файлов |
| Shell (command) | `run_command` | Выполнение bash-команд |

### Безопасность

| Механизм | Значение |
|----------|----------|
| Path traversal | Блокируется в обеих зонах |
| Command blacklist | `rm -rf /`, `sudo`, `chmod 777`, etc. |
| Command timeout | 10 секунд |
| Output limit | 4 КиБ |
| File size limit | 8 КиБ |

### Unit Tests (46 passed)
```
✔ Executor - 8 tests
✔ Tool: find_files - 1 test
✔ Tool: search_text - 1 test
✔ Tool: write_file - 2 tests
✔ Tool: edit_file - 2 tests
✔ Tool: list_workspace - 1 test
✔ Tool: read_workspace - 1 test
✔ Tool: run_command - 3 tests
✔ Workspace Security - 1 test
✔ Client (Mock Mode) - 2 tests
✔ Parser - 3 tests
✔ Input Validation - 5 tests
✔ Events - 1 test
✔ recoverJSON - 9 tests
✔ extractToolCallFromText - 6 tests
```

## DoD Checklist (Phase A.3+ - Complete)

### A.1 Mock Mode
- [x] `node harness.mjs "test"` выводит mock-ответ с [MOCK]
- [x] `node server.mjs` запускает веб-сервер
- [x] События в консоли и logs/events.jsonl
- [x] Unit tests pass

### A.2 Ollama + Recovery
- [x] `node harness.mjs --real` работает с Ollama
- [x] RecoveryParser для malformed JSON
- [x] Integration tests pass

### A.3 Tool Execution Loop
- [x] Модель вызывает инструменты
- [x] Executor выполняет в sandbox
- [x] Модель получает результат и отвечает
- [x] Sandbox отклоняет путь за пределами
- [x] В консоли видны все этапы

### A.3+ Write Tools + Commands
- [x] `write_file` создаёт файлы в workspace
- [x] `edit_file` редактирует файлы в workspace
- [x] `run_command` выполняет bash-команды
- [x] Path traversal блокируется в workspace
- [x] Опасные команды блокируются
- [x] Web UI поддерживает полный цикл

## Artifacts Created

| File | Purpose |
|------|---------|
| `harness.mjs` | CLI entry point |
| `server.mjs` | Web server (full cycle) |
| `lib/client.mjs` | HTTP client + mock |
| `lib/parser.mjs` | Response parser |
| `lib/events.mjs` | Event recording |
| `lib/recovery.mjs` | RecoveryParser |
| `lib/executor.mjs` | Tool executor (9 tools) |
| `lib/context.mjs` | Conversation context |
| `web/index.html` | Web UI |
| `web/app.js` | Frontend (tool steps) |
| `sandbox/` | Read-only test files |
| `workspace_files/` | Read-write model output |
| `tests/unit/*.mjs` | 46 unit tests |
| `tests/integration/*.mjs` | Ollama tests |
| `docs/diagrams/*.md` | C4 + UML diagrams |

## File Structure

```
agent-engineering-lab/
├── harness.mjs              # CLI entry point
├── server.mjs               # Web server entry point
├── lib/
│   ├── context.mjs          # Context Builder
│   ├── client.mjs           # HTTP Client (mock + Ollama)
│   ├── parser.mjs           # Response Parser
│   ├── executor.mjs         # Tool Executor (9 tools)
│   ├── recovery.mjs         # JSON Recovery Parser
│   └── events.mjs           # Event Logger
├── web/
│   ├── index.html           # UI template
│   └── app.js               # Frontend logic
├── sandbox/                 # Read-only (test files)
│   ├── project-note.md
│   ├── config.json
│   └── notes/
│       ├── meeting.txt
│       └── ideas.md
├── workspace_files/         # Read-write (model output)
├── logs/
│   └── events.jsonl
├── tests/
│   ├── unit/
│   │   ├── harness.test.mjs
│   │   ├── recovery.test.mjs
│   │   └── executor.test.mjs
│   └── integration/
│       └── ollama.test.mjs
└── docs/
    ├── architecture.md
    ├── components.md
    ├── request-flow.md
    └── diagrams/
        ├── README.md
        ├── c4-context.md
        ├── c4-container.md
        ├── component-harness.md
        ├── sequence-request-flow.md
        ├── state-harness-loop.md
        ├── activity-tool-execution.md
        ├── class-data-structures.md
        └── deployment-local.md
```

## Commands

```bash
cd "/home/zhabenov/tfw workshop/agent-engineering-lab"

# Mock mode (instant)
node harness.mjs "Hello"

# Real Ollama (3-15s per turn)
node harness.mjs --real "List files"
node harness.mjs --real "Create a file called test.txt"

# Web UI
node server.mjs  # http://localhost:3000

# Tests
node --test tests/unit/                # 46 unit tests
node --test tests/integration/         # Ollama tests
```

## Documentation Updated

All diagrams reflect Phase A.3+ state:

| Diagram | Status | Key Updates |
|---------|--------|-------------|
| C4 Context | ✅ | Sandbox + Workspace zones |
| C4 Container | ✅ | 6 lib/ modules, workspace_files/ |
| Component | ✅ | Recovery Parser, Security Model |
| Sequence | ✅ | Read/Write/Command flows |
| State | ✅ | RecoveringJSON, ExecutingReadTool/WriteTool/Command |
| Activity | ✅ | Three subgraphs: Read/Write/Command |
| Class | ✅ | Write tool args, CommandResult, SecurityLimits |
| Deployment | ✅ | Two storage zones |

## Known Limitations

1. **Small model quirks** — qwen3.5:0.8b sometimes returns empty response
2. **Thinking loops** — without tools, model may timeout
3. **No streaming** — responses arrive all at once
4. **Single tool call** — model calls one tool per turn

## Next Steps (Phase B - Optional)

- [ ] History persistence across sessions
- [ ] Structured logging with levels
- [ ] Multiple tool calls per turn
- [ ] Streaming responses

## Resume Point

To continue from this state:
1. Read this status.md
2. Read docs/architecture.md for overview
3. Read docs/diagrams/README.md for diagram index
4. Run `node --test tests/unit/` to verify (46 tests)
5. Run `node server.mjs` to test Web UI
