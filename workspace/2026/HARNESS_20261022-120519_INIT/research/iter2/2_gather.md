# Gather — "What do we NOT know?"

> **Mindset:** Explorer. You're mapping unknown territory. Widen before you narrow.
> **Parent:** [HARNESS_20261022-120519_INIT](../../status.md)
> **Goal:** Understand harness architecture for building educational harness

## Dimensions (Morphological Box — Zwicky)

> Метод морфологического ящика Цвикки: 5-7 независимых измерений × 3-5 альтернатив каждое.
> Source: [SI-Labs Morphological Box Guide](https://www.si-labs.com/en/articles/morphological-box/)

| # | Dimension | Alt A | Alt B | Alt C | Alt D |
|---|-----------|-------|-------|-------|-------|
| D1 | Model Interface | HTTP direct | SDK wrapper | Streaming | Batch + cache |
| D2 | Context Management | Full history | Sliding window | Compaction | RAG |
| D3 | Tool Integration | None | JSON Schema | MCP protocol | Custom middleware |
| D4 | Output Parsing | Raw text | JSON mode | Structured schema | Hybrid |
| D5 | Orchestration | Single-turn | ReAct loop | Plan-execute | Multi-agent |
| D6 | Error Handling | Fail-fast | Retry with backoff | Fallback model | Circuit breaker |
| D7 | Observability | None | Console logging | Structured logs | Tracing + metrics |

**Theoretical combinations:** 4 × 4 × 4 × 4 × 4 × 4 × 4 = **16,384** вариантов

## Findings

### G1: Agent = Model + Harness (MongoDB, Trivedy 2026)

**Ключевая формула:** `Agent = Model + Harness`

Harness — это всё, что не является моделью:
- Tool dispatch — вызов внешних инструментов
- Memory & state persistence — сохранение состояния между вызовами
- Context management — управление контекстом (бюджет токенов)
- Orchestration logic — цикл управления агентом
- Hooks & middleware — детерминированные проверки вокруг модели
- Guardrails — permissions, approval tiers, monitoring

**Важно:** Harness, а не модель, определяет поведение агента.

Source: [MongoDB: The Agent Harness](https://www.mongodb.com/company/blog/technical/agent-harness-why-llm-is-smallest-part-of-your-agent-system)

### G2: Claude Code Harness Architecture

Компоненты Claude Code harness:
- **Tool Executor** — выполнение инструментов
- **Permission Manager** — контроль доступа
- **Hook System** — pre/post хуки
- **Context Manager** — 5 техник: cleanup, auto-compact, prompt caching, lazy loading, skill snapshots
- **MCP Layer** — Model Context Protocol для внешних серверов
- **Skill System** — переиспользуемые навыки
- **Subagent Framework** — делегация подзадач

Source: [Claude Code Harness Architecture Guide](https://pasqualepillitteri.it/en/news/1892/claude-code-harness-runtime-architecture-2026-guide)

### G3: Three Middleware Types (Microsoft Agent Framework)

```
┌─────────────────────────────────────────┐
│           Agent Middleware              │  ← wraps entire agent run
│  ┌───────────────────────────────────┐  │
│  │        Chat Middleware            │  │  ← wraps model requests
│  │  ┌─────────────────────────────┐  │  │
│  │  │   Function Middleware       │  │  │  ← wraps tool calls
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │    Tool Execution     │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

- **Agent middleware** — inputs, outputs, control flow всего run
- **Chat middleware** — raw messages к модели
- **Function middleware** — валидация, трансформация tool calls

Source: [Microsoft Agent Framework Middleware](https://dev.to/sreeni5018/agent-middleware-in-microsoft-agent-framework-10-2bm0)

### G4: Tool Calling Pattern

```
User Prompt
    ↓
┌─────────┐    tool schema    ┌──────────────┐
│  Model  │ ───────────────→  │ JSON payload │
└─────────┘                   └──────┬───────┘
                                     ↓
                              ┌──────────────┐
                              │   Execute    │
                              │   Function   │
                              └──────┬───────┘
                                     ↓
                              ┌──────────────┐
                              │   Result     │
                              └──────┬───────┘
                                     ↓
                              ┌─────────┐
                              │  Model  │ → Final Response
                              └─────────┘
```

Модель получает JSON Schema инструментов → решает какой вызвать → выдаёт structured JSON → harness выполняет → результат обратно в модель.

Source: [Tool Calling Pattern](https://dev.to/kenwalger/the-agent-tool-calling-pattern-51hf)

### G5: Structured Output

**Structured Output Specification** — модель возвращает JSON по заданной схеме:
- Детерминированный парсинг
- Валидация на стороне harness
- Интеграция с downstream системами

Для qwen3.5 нужно проверить поддержку structured output (JSON mode).

Source: [Agentic Patterns](https://www.agentic-patterns.com/)

### G6: Six-Dimensional LLM Agent Taxonomy (arxiv 2601.12560)

Академический framework для классификации LLM-агентов:

| # | Dimension | Компоненты |
|---|-----------|------------|
| 1 | Core Components | Perception, Memory, Action, Profiling |
| 2 | Cognitive Architecture | Planning (ReAct, hierarchical), Reflection |
| 3 | Learning | In-context, Fine-tuning, RLHF |
| 4 | Multi-Agent | Topologies (chain, star, mesh), Collaboration |
| 5 | Environments | Digital, Embodied, Specialized |
| 6 | Evaluation | CLASSic: Cost, Latency, Accuracy, Security, Stability |

Наши D1-D7 покрывают dimensions 1, 2, 6. Dimensions 3-5 (Learning, Multi-Agent, Environments) — за рамками MVP.

Source: [Agentic AI Taxonomy](https://arxiv.org/html/2601.12560v1)

### G7: Morphological Box Best Practices

**Рекомендации Цвикки:**
1. 5-7 независимых параметров × 3-5 значений — "practical sweet spot"
2. Никаких оценок до полного построения матрицы
3. Cross-Consistency Assessment (CCA) отсеивает противоречивые комбинации
4. Результат: 3-5 consistent solution paths из тысяч теоретических

**Для нашего harness:**
- 7 dimensions × 4 alternatives = 16,384 комбинаций
- После CCA ожидаем 5-10 реалистичных конфигураций
- Learning path: от минимальной (C1) к полной (C4)

Source: [SI-Labs Morphological Box](https://www.si-labs.com/en/articles/morphological-box/)

## Checkpoint

| Found | Remaining |
|-------|-----------|
| Harness = всё кроме модели | Специфика Ollama API |
| 3 типа middleware | Поддержка tool calling в qwen3.5 |
| Tool calling pattern | JSON Schema support в Ollama |
| Context management strategies | — |
| 7 dimensions (Zwicky box) | Cross-Consistency Assessment |
| 6-dim academic taxonomy | — |

**Sufficiency:**
- [x] External source used? (5 sources)
- [x] Briefing gap closed?
- [x] Dimensions identified? (7 dimensions × 4 alternatives)

Stage complete: YES
→ User decision: proceed to Extract
