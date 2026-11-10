# C4 Context Diagram - Harness

## System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SYSTEM CONTEXT                                  │
│                           (Phase A.3+ - Full Cycle)                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │    Learner      │
                              │    (Person)     │
                              │                 │
                              │ Участник курса  │
                              │ Agent Eng.      │
                              └────────┬────────┘
                                       │
                     ┌─────────────────┼─────────────────┐
                     │                 │                 │
                     ▼                 ▼                 ▼
              ┌────────────┐   ┌────────────┐   ┌────────────┐
              │ CLI        │   │ Web UI     │   │ Tests      │
              │ Terminal   │   │ Browser    │   │ npm test   │
              └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
                    │                │                │
                    └────────────────┼────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │                                │
                    │     Educational Harness        │
                    │     [Software System]          │
                    │                                │
                    │  • Принимает сообщения         │
                    │  • Вызывает модель (mock/real) │
                    │  • Выполняет 9 инструментов    │
                    │  • Читает sandbox, пишет ws    │
                    │  • Записывает события          │
                    │                                │
                    └────────────────┬───────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
           ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
           │  Sandbox    │   │  Workspace  │   │  Ollama     │
           │  [Files]    │   │  [Files]    │   │  [External] │
           │             │   │             │   │             │
           │  Read-only  │   │  Read/Write │   │localhost    │
           │  test data  │   │  + commands │   │:11434       │
           └─────────────┘   └─────────────┘   └─────────────┘


LEGEND:
┌──────────┐
│ Person   │  Human user
└──────────┘

┌──────────┐
│ System   │  Software system (our scope)
└──────────┘

┌──────────┐
│ External │  External system (not our code)
└──────────┘
```

## Interactions

| From | To | Description |
|------|-----|-------------|
| Learner | CLI | `node harness.mjs "message"` |
| Learner | Web UI | Browser at localhost:3000 |
| Harness | Sandbox | Read test files (4 read tools) |
| Harness | Workspace | Write files, run commands (5 write tools) |
| Harness | Events | Write events to console + JSONL |
| Harness | Ollama | HTTP POST /api/chat (mock or real) |

## Boundaries

- **In scope:** Harness CLI, Web UI, Event logging, Tool execution
- **Read-only:** Sandbox files (`sandbox/`)
- **Read-write:** Workspace files (`workspace_files/`)
- **External:** Ollama (localhost:11434)
