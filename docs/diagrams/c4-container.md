# C4 Container Diagram - Harness

## Container View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CONTAINER VIEW                                  │
│                           (Phase A.3+ - Full Cycle)                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │    Learner      │
                              └────────┬────────┘
                                       │
                     ┌─────────────────┴─────────────────┐
                     │                                   │
                     ▼                                   ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│         CLI Container           │   │        Web Container            │
│         [Node.js]               │   │        [Node.js + HTML]         │
│                                 │   │                                 │
│  ┌───────────────────────────┐  │   │  ┌───────────────────────────┐  │
│  │      harness.mjs          │  │   │  │      server.mjs           │  │
│  │      Entry Point          │  │   │  │      HTTP Server          │  │
│  └─────────────┬─────────────┘  │   │  └─────────────┬─────────────┘  │
│                │                │   │                │                │
│                ▼                │   │                ▼                │
│  ┌───────────────────────────┐  │   │  ┌───────────────────────────┐  │
│  │         lib/              │  │   │  │         web/              │  │
│  │  ┌─────────┬─────────┐    │  │   │  │  index.html + app.js     │  │
│  │  │context  │client   │    │  │   │  │  Browser UI              │  │
│  │  │.mjs     │.mjs     │    │  │   │  └───────────────────────────┘  │
│  │  ├─────────┼─────────┤    │  │   │                │                │
│  │  │parser   │executor │    │  │   │    Uses same lib/ modules      │
│  │  │.mjs     │.mjs     │    │  │   │                │                │
│  │  ├─────────┼─────────┤    │  │   └────────────────┼────────────────┘
│  │  │recovery │events   │    │  │                    │
│  │  │.mjs     │.mjs     │    │  │                    │
│  │  └─────────┴─────────┘    │  │                    │
│  └───────────────────────────┘  │                    │
└─────────────────┬───────────────┘                    │
                  │                                    │
                  └────────────────┬───────────────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       │                           │                           │
       ▼                           ▼                           ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   sandbox/      │     │ workspace_files/│     │   logs/         │
│   [Read-Only]   │     │   [Read-Write]  │     │   [Append]      │
│                 │     │                 │     │                 │
│ project-note.md │     │ (model output)  │     │ events.jsonl    │
│ config.json     │     │ created files   │     │                 │
│ notes/          │     │ command results │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘

                                   │
                                   ▼
                    ┌─────────────────────────┐
                    │      Ollama             │
                    │      [External]         │
                    │                         │
                    │   localhost:11434       │
                    │   qwen3.5:0.8b          │
                    │   (mock or real mode)   │
                    └─────────────────────────┘
```

## Modules

| Module | Responsibility | Dependencies |
|--------|---------------|--------------|
| `harness.mjs` | CLI entry point | context, client, parser, executor, events |
| `server.mjs` | Web server, API | context, client, parser, executor, events |
| `lib/context.mjs` | Context building, message history | - |
| `lib/client.mjs` | HTTP requests (mock/real) | recovery, events |
| `lib/parser.mjs` | Response parsing | events |
| `lib/executor.mjs` | Tool execution (9 tools) | events |
| `lib/recovery.mjs` | JSON recovery for malformed output | - |
| `lib/events.mjs` | Event recording | fs |
| `web/` | Browser UI | API endpoints |

## Data Flow

```
User Input
    │
    ├──► CLI: harness.mjs
    │         │
    └──► Web: server.mjs ──► web/index.html
              │
              ▼
         lib/context.mjs
         (build request)
              │
              ▼
         lib/client.mjs
         (mock or ollama)
              │
              ▼
         lib/parser.mjs
              │
              ├──► text response ──► User
              │
              └──► tool_calls ──► lib/executor.mjs
                                        │
                          ┌─────────────┼─────────────┐
                          ▼             ▼             ▼
                     sandbox/    workspace_files/   shell
                     (read)         (write)      (command)
                          │             │             │
                          └─────────────┼─────────────┘
                                        ▼
                                  tool_result
                                        │
                                        ▼
                             lib/context.mjs (loop)
```
