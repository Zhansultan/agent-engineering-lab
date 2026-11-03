# Extract — "What do we NOT see?"

> **Mindset:** Analyst. Build structure. Make combinations visible that nobody proposed.
> **Parent:** [HARNESS_20261022-120519_INIT](../../status.md)
> **Goal:** Map harness architecture to concrete implementation choices

## Configuration Space (Zwicky Morphological Box)

Из Gather: 7 dimensions × 4 alternatives = 16,384 теоретических комбинаций.
После Cross-Consistency Assessment — реалистичные конфигурации:

| Config | D1: Model | D2: Context | D3: Tools | D4: Output | D5: Orchestration | D6: Errors | D7: Observability |
|--------|-----------|-------------|-----------|------------|-------------------|------------|-------------------|
| **C1: Minimal** | HTTP direct | Full history | None | Raw text | Single-turn | Fail-fast | Console log |
| **C2: Structured** | HTTP direct | Full history | None | JSON mode | Single-turn | Fail-fast | Console log |
| **C3: Tools** | HTTP direct | Sliding window | JSON Schema | Structured | ReAct loop | Retry | Structured logs |
| **C4: Agent** | SDK wrapper | Compaction | JSON Schema | Structured | ReAct loop | Retry + fallback | Tracing |
| **C5: Production** | Batch+cache | RAG | MCP | Hybrid | Multi-agent | Circuit breaker | Metrics |

**Исключённые комбинации (CCA):**
- ❌ Multi-agent + Full history (memory explosion)
- ❌ Streaming + Structured schema (противоречие)
- ❌ None tools + ReAct loop (бессмысленно)
- ❌ Fail-fast + Multi-agent (cascade failures)

**Наш путь обучения:** C1 → C2 → C3 → C4

Каждый шаг добавляет 1-2 dimension complexity.

## Findings

### E1: Ollama API Capabilities

```
┌─────────────────────────────────────────────────────────────┐
│                      Ollama API                             │
├─────────────────────────────────────────────────────────────┤
│  POST /api/generate     │  Completion (простой вызов)       │
│  POST /api/chat         │  Chat с messages array            │
│  format: "json"         │  JSON mode (не гарантирует!)      │
│  format: {schema}       │  Structured output (Ollama 0.5+)  │
│  tools: [...]           │  Tool calling (Qwen 2.5+)         │
└─────────────────────────────────────────────────────────────┘
```

**Важно:**
- `format: "json"` только *просит* JSON, не *гарантирует*
- Нужно комбинировать с правильным prompt
- Tool calling требует `tools` parameter + совместимую модель

Source: [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)

### E2: Qwen 3.5 Tool Support

По данным benchmarks 2026:
- Qwen 2.5+ поддерживает tool calling нативно
- qwen3.5 (наша модель) — наследник Qwen 2.5, должен поддерживать
- Маленькие модели (0.8b) могут быть менее надёжны в tool calling

**Риск:** 0.8b параметров — минимальный размер. Возможны галлюцинации в structured output.

Source: [Best Ollama Model for Tool Calling](https://webscraft.org/blog/yaku-model-ollama-obrati-dlya-agenta-z-tool-calling-porivnyannya-i-benchmarki?lang=en)

### E3: Harness Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         HARNESS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Context    │    │    Model     │    │    Output    │      │
│  │   Builder    │───→│   Caller     │───→│   Parser     │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Messages   │    │   Ollama     │    │   Response   │      │
│  │   History    │    │   Client     │    │   Handler    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                             │                                   │
│                             ▼                                   │
│                      ┌──────────────┐                          │
│                      │    Tools     │                          │
│                      │   Registry   │                          │
│                      └──────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### E4: MVP Component List (mapped to D1-D7)

| # | Component | Dimension | Responsibility | Interface |
|---|-----------|-----------|----------------|-----------|
| 1 | OllamaClient | D1 Model | HTTP calls to Ollama API | `generate(prompt)`, `chat(messages)` |
| 2 | ContextBuilder | D2 Context | Assemble messages array | `build(history, system, user)` |
| 3 | ToolRegistry | D3 Tools | Store tool definitions | `register(tool)`, `get(name)` |
| 4 | ToolExecutor | D3 Tools | Run tool by name | `execute(name, args)` |
| 5 | OutputParser | D4 Output | Parse model response | `parse(response, schema?)` |
| 6 | AgentLoop | D5 Orchestration | ReAct orchestration | `run(goal)` |
| 7 | ErrorHandler | D6 Errors | Retry, fallback logic | `wrap(fn)`, `retry(fn, opts)` |
| 8 | Logger | D7 Observability | Structured logging | `log(level, event, data)` |

### E5: Learning Path (4 phases × 7 dimensions)

```
              D1:Model  D2:Context  D3:Tools  D4:Output  D5:Orch   D6:Errors  D7:Obs
             ─────────────────────────────────────────────────────────────────────────
Phase 1      HTTP      Full hist   None      Raw text   Single    Fail-fast  Console
(Minimal)    direct                                     turn
             ─────────────────────────────────────────────────────────────────────────
Phase 2      HTTP      Full hist   None      JSON       Single    Fail-fast  Console
(Structured) direct                          schema     turn
             ─────────────────────────────────────────────────────────────────────────
Phase 3      HTTP      Sliding     JSON      Struct     ReAct     Retry      Struct
(Tools)      direct    window      Schema    schema     loop                 logs
             ─────────────────────────────────────────────────────────────────────────
Phase 4      SDK       Compact     JSON      Struct     ReAct     Retry+     Tracing
(Agent)      wrapper   +summary    Schema    schema     loop      fallback
```

**Каждая фаза = отдельная TFW задача.** Инкрементальное усложнение по dimensions.

## Checkpoint

| Found | Remaining |
|-------|-----------|
| Ollama API: generate, chat, format, tools | Практическая проверка qwen3.5 tool calling |
| 8 компонентов MVP (mapped to D1-D7) | Точные сигнатуры функций |
| 4-фазный learning path | Риски маленькой модели |
| 5 consistent configs (CCA applied) | — |
| Excluded contradictory combinations | — |

**Sufficiency:**
- [x] External source used?
- [x] Briefing gap closed?
- [x] Configuration Space built from Gather dimensions? (7 dimensions)

Stage complete: YES
→ User decision: proceed to Challenge
