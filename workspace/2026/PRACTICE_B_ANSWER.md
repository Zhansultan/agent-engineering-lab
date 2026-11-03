# Практика Б — Проверить продолжение в новой беседе

**Участник:** Жансултан Абенов (@zhabenov)
**Дата:** 2026-11-03
**Проект:** agent-engineering-lab

---

## Цель проекта

Понять архитектуру harness (Codex, Claude Code, Antigravity) и собрать основные механизмы:
- Сбор контекста (context gathering)
- Вызов модели (model calling)
- Разбор структурированного вывода (structured output parsing)
- Вызов инструментов (tool calling)

## Следующий шаг

Реализовать Phase A (MVP): минимальный CLI harness `harness.mjs` с полным циклом:
```
запрос → модель → tool call → executor → ответ
```

---

## Входные инструкции и записи

### Фрагмент CLAUDE.md (инструкции для Claude Code)

```markdown
## Project Identity
- Name: agent-engineering-lab
- Stack: Node.js, Ollama, JavaScript/TypeScript
- Owner: Жансултан Абенов (@zhabenov), Innoforce

## Mandatory Rules
1. No sycophancy: Be direct, precise, concrete.
2. No placeholders: Provide complete working code/config.
3. Language: Reply in Russian (project content language).
4. TFW task discipline: Follow .tfw/workflows/ for every task.
5. Critical mindset: Question assumptions, flag risks.
6. Tutorial mode: Provide detailed explanations of TFW concepts.
```

### Фрагмент KNOWLEDGE.md (факты о проекте)

```markdown
## 4. Project Facts

### Environment
- Runtime: Node.js v24.22.0
- LLM Backend: Ollama v0.40.6
- Model: qwen3.5:0.8b (1.32 GB, CPU inference, ~4s response)

### Project Context
- Organization: Innoforce (флагман: avtobys.kz)
- Course: Agent Engineering
- Owner: Жансултан Абенов (@zhabenov), Backend Developer, 7+ лет опыта
- Goal: Understand harness architecture + apply AI effectively in work
- Reference systems: Codex, Claude Code, Antigravity
```

### Структура docs/

| Файл | Содержимое |
|------|------------|
| `docs/architecture.md` | Цель, стек, критерии готовности, структура проекта |
| `docs/request-flow.md` | Mermaid-схема пути запроса (9 шагов) |
| `docs/components.md` | 5 компонентов: Context Builder, HTTP Client, Parser, Executor, Sandbox |

### HL (High-Level план)

`workspace/2026/HARNESS_20261103_HL/HL-HARNESS.md`:
- Vision: работающий учебный harness с полным циклом
- Phase A: MVP (harness.mjs + lib/)
- Phase B: логирование и история (опционально)
- DoD: 6 критериев готовности

---

## Что новая беседа восстановила по записям

1. **Состояние заданий** — из `PRACTICE-1-REPORT.md` и `SESSION_20261028_HW_REVIEW.md`:
   - Практика 1 выполнена (4 инструмента в tool.mjs)
   - Практика 2 частично выполнена (docs/ есть, коммит не сделан)

2. **Структуру проекта** — из `README.md`:
   - Участники, цель, ценность
   - Стек: Node.js, Ollama, qwen3.5:0.8b
   - TFW Full edition

3. **Архитектуру** — из `docs/`:
   - Путь запроса со схемой
   - Границы 5 компонентов
   - Критерии готовности

4. **Контекст среды** — из `KNOWLEDGE.md`:
   - Node.js v24.22.0, Ollama v0.40.6
   - Организация Innoforce, курс Agent Engineering

5. **Профиль участника** — из `team/zhabenov.md`:
   - Backend Developer, 7+ лет опыта
   - Java, Spring Boot, PostgreSQL

---

## С какими файлами сверил ответ

| Файл | Что проверил |
|------|--------------|
| `KNOWLEDGE.md` | Версии Node.js, Ollama, модель |
| `docs/architecture.md` | Цель проекта, стек |
| `README.md` | Структура проекта |
| `SESSION_20261028_HW_REVIEW.md` | Что было сделано ранее |
| `.tfw/VERSION` | Версия TFW |

---

## Что пришлось исправить

| Проблема | Исправление |
|----------|-------------|
| Git инициализирован, но коммит не сделан | Создан первый коммит `e572140` |
| HL файл отсутствовал | Создан `HL-HARNESS.md` с Vision, Phases, DoD |

---

## Ссылки на доказательства

```
agent-engineering-lab/CLAUDE.md
agent-engineering-lab/KNOWLEDGE.md
agent-engineering-lab/README.md
agent-engineering-lab/docs/architecture.md
agent-engineering-lab/docs/request-flow.md
agent-engineering-lab/docs/components.md
agent-engineering-lab/workspace/2026/HARNESS_20261103_HL/HL-HARNESS.md
agent-engineering-lab/workspace/2026/SESSION_20261028_HW_REVIEW.md
```

---

*Практика Б | 2026-11-03 | @zhabenov*
