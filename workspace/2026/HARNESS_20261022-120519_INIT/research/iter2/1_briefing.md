# Briefing — "What should we investigate?"

> **Mindset:** Strategist. You're planning an investigation, not doing it. Frame what matters. Resist solving.
> **Test:** "Can I explain WHY we're investigating this and what would change our approach?"
> **Parent:** [HARNESS_20261022-120519_INIT](../../status.md) (init task, no HL)
> **Goal:** Understand harness architecture to prepare for first development task
> **Producer unit:** claude-code:session:local
> **Parent Coordinator:** owner:zhabenov
> **Activation / dispatch source:** owner-direct /tfw-research inside init
> **Coordination authority:** .tfw/workflows/init.md @ v3.9.2
> **Originating proposer:** none

---

## Research Plan

### Gather Stage
- Что такое AI harness? Определение и границы
- Компоненты harness: context, model calling, output parsing, tools
- Reference systems: как устроены Codex, Claude Code, Antigravity
- Какие паттерны используются (middleware, pipeline, event-driven)

### Extract Stage
- Минимальный набор компонентов для MVP harness
- Mapping: компонент → ответственность → интерфейс
- Какие решения нужно принять до начала кодирования

### Challenge Stage
- Достаточно ли qwen3.5:0.8b для базовых задач?
- Какие ограничения модели влияют на архитектуру?
- Что может пойти не так при первой реализации?

## Hypotheses (from predecessor RES)

| # | Hypothesis | Status |
|---|-----------|--------|
| H1 | Local Ollama + qwen3.5 достаточен для обучения harness patterns | open |
| H2 | Spring-подобная архитектура (DI, middleware) применима к harness | open |
| H3 | Начать с простого completion → добавить tools → structured output | open |

## Scope Intent

- **In scope:**
  - Архитектура harness как концепция
  - Минимальный набор компонентов для первого harness
  - Ограничения локальной модели qwen3.5

- **Out of scope:**
  - Конкретная реализация (это будет в первой dev-задаче)
  - Сравнение моделей (используем то что есть)
  - Production concerns (security, scaling)

## Guiding Questions

1. Какой **первый use case** хочешь реализовать? (простой completion, tool calling, structured output, agent loop?)
2. Предпочитаешь **низкоуровневый подход** (прямые HTTP-вызовы к Ollama) или **абстракции** (классы, middleware)?
3. Нужен ли **streaming** (потоковый вывод) или достаточно batch-ответов?

## User Direction

1. **Use cases:** Все — completion, tool calling, structured output, agent loop
2. **Подход:** Абстракции — классы Model, Tool, Context, middleware pipeline
3. **Streaming:** Не нужен — batch-ответы достаточно

**Вывод:** Строим полноценный harness с абстракциями, покрывающий весь спектр от простого completion до agent loop. Это учебный проект — важно понять архитектуру, не срезать углы.

---
Stage complete: YES
