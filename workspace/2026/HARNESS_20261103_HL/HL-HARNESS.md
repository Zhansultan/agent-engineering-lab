# HL — HARNESS: Учебный Harness для Agent Engineering

> **Date**: 2026-11-03
> **Author**: @zhabenov
> **Title**: Учебный Harness для понимания архитектуры AI-агентов
> **Abbreviation**: HARNESS
> **Status**: ✅ IMPLEMENTED — Phase A.3+ Complete
> **Contract**: ✅ FULFILLED — All DoD items passed
> **Frozen**: §1 · §3 · §4 · §5 · §6 · §7 — locked on owner approval
> **Free**: §2 · §7.2 · §8 · §9 · §10 · §11 — research updates these directly
> **Append-only**: §12 Amendment Log — the only channel for changing a frozen section

> **Project North Star**: `CLAUDE.md § North Star` · `docs/architecture-requirements.md § North Star`
> — Человек понимает и контролирует архитектуру без погружения в детали реализации

---

## 1. Vision

Собран работающий учебный harness, демонстрирующий полный цикл: пользователь задаёт вопрос → harness собирает контекст → модель отвечает или вызывает инструмент → executor выполняет → модель формирует финальный ответ.

**Impact:** Участник курса понимает, как устроены Codex, Claude Code, Antigravity изнутри. Может применять и развивать механизмы под свои задачи в Innoforce.

> "Теперь я вижу, что модель — это только часть. Harness делает всю работу вокруг: собирает контекст, разбирает ответ, выполняет инструменты."

## 2. Current State (As-Is) — IMPLEMENTED

**Источник:** `docs/architecture.md`, `docs/components.md`, `workspace/2026/HARNESS_20261103_HL/status.md`

### Что реализовано
- ✅ Собственный harness-код в `lib/`
- ✅ CLI интерфейс (`harness.mjs`)
- ✅ Web интерфейс (`server.mjs` + `web/`)
- ✅ 9 инструментов (4 read + 4 write + 1 command)
- ✅ RecoveryParser для malformed JSON
- ✅ Событийное логирование (console + JSONL)
- ✅ 46 unit tests
- ✅ Полная документация с диаграммами

### Архитектура
```
lib/
├── context.mjs    # Context Builder
├── client.mjs     # HTTP Client (mock + Ollama)
├── parser.mjs     # Response Parser
├── executor.mjs   # Tool Executor (9 tools)
├── recovery.mjs   # JSON Recovery Parser
└── events.mjs     # Event Logger

Зоны хранения:
├── sandbox/          # Read-only (тестовые файлы)
└── workspace_files/  # Read-write (output модели)
```

### Ограничения (by design)
- Учебный проект — не production
- Только локальный Ollama (qwen3.5:0.8b)
- Один tool call за turn
- Нет streaming

## 3. Target State (To-Be)

Минимальный CLI harness на Node.js:
- Принимает вопрос пользователя
- Собирает контекст (messages + tools)
- Отправляет в Ollama
- Разбирает ответ (текст или tool_calls)
- Выполняет инструменты через executor
- Возвращает результат пользователю

### 3.3 Non-Functional Requirements

| Характеристика | Значение | Обоснование |
|----------------|----------|-------------|
| Нагрузка | 1 сессия, 1 пользователь | Учебный проект, локальный запуск |
| Время ответа | ≤30s на полный цикл | qwen ~4s inference + tool execution |
| Доступность | N/A | Не сервис, запуск по требованию |
| Защита данных | Sandbox-only, read-only | Изоляция в tool.mjs |
| Восстановление | Перезапуск CLI | Stateless, нет persistence |
| Лимит API | 0$ | Только локальный Ollama |
| Observability | Console + JSON events | Оба формата для обучения и анализа |

### 3.4 Architecture Documentation

Per `docs/architecture-requirements.md` — **ALL COMPLETE**:

| Диаграмма | Статус | Файл |
|-----------|--------|------|
| C4 Context | ✅ | `docs/diagrams/c4-context.md` |
| C4 Container | ✅ | `docs/diagrams/c4-container.md` |
| Component | ✅ | `docs/diagrams/component-harness.md` |
| Sequence | ✅ | `docs/diagrams/sequence-request-flow.md` |
| Deployment | ✅ | `docs/diagrams/deployment-local.md` |
| State | ✅ | `docs/diagrams/state-harness-loop.md` |
| Activity | ✅ | `docs/diagrams/activity-tool-execution.md` |
| Class | ✅ | `docs/diagrams/class-data-structures.md` |

All diagrams updated to Phase A.3+ state (9 tools, sandbox + workspace).

### 3.1 Result Visualization

**До (As-Is):**
```
Пользователь → curl + JSON вручную → Ollama → копировать tool_call → node execute-call.mjs → curl снова
```

**После (To-Be):**
```
$ node harness.mjs "Найди файл с заметками о встрече"

[Context] messages: 1, tools: 4
[Request] POST /api/chat → qwen3.5:0.8b
[Response] tool_call: find_files({pattern: "meeting"})
[Executor] find_files → ["notes/meeting-2024-10-20.txt"]
[Request] POST /api/chat (с результатом)
[Response] Найден файл: notes/meeting-2024-10-20.txt

> Файл с заметками о встрече: notes/meeting-2024-10-20.txt
```

**Структура файлов (реализовано):**
```
agent-engineering-lab/
├── harness.mjs              # CLI entry point
├── server.mjs               # Web server
├── lib/
│   ├── context.mjs          # Context Builder
│   ├── client.mjs           # HTTP Client (mock + Ollama)
│   ├── parser.mjs           # Response Parser
│   ├── executor.mjs         # Tool Executor (9 tools)
│   ├── recovery.mjs         # JSON Recovery Parser
│   └── events.mjs           # Event Logger
├── web/
│   ├── index.html           # Web UI
│   └── app.js               # Frontend
├── sandbox/                 # Read-only test files
├── workspace_files/         # Read-write model output
├── logs/
│   └── events.jsonl         # Event log
├── tests/
│   ├── unit/                # 46 unit tests
│   └── integration/         # Ollama tests
└── docs/
    └── diagrams/            # C4 + UML diagrams
```

### 3.2 Value Flow

```
User Question
     │
     ▼
┌─────────────┐
│  Context    │ ← messages[] + tools[]
│  Builder    │
└─────────────┘
     │ JSON request
     ▼
┌─────────────┐
│   HTTP      │ → POST /api/chat
│   Client    │
└─────────────┘
     │ JSON response
     ▼
┌─────────────┐
│   Parser    │ → text OR tool_calls
└─────────────┘
     │
     ├── text ────────────────────────┐
     │                                │
     └── tool_calls                   │
            │                         │
            ▼                         │
     ┌─────────────┐                  │
     │  Executor   │ → sandbox ops    │
     └─────────────┘                  │
            │ tool_result             │
            │                         │
            └──► loop back ◄──────────┘
                     │
                     ▼
              User Answer
```

**Value:** Пользователь видит весь цикл в логах и понимает, где работает модель, где harness, где executor.

## 4. Phases

### Phase A.1: Минимальный цикл с mock-провайдером 🔴

**Scope:** Один запрос → mock-ответ → события в консоль и файл. CLI + Web UI.

**Deliverables:**
- `harness.mjs` — CLI точка входа
- `server.mjs` — веб-сервер (Node.js native http)
- `web/index.html` + `web/app.js` — веб-интерфейс
- `lib/client.mjs` — HTTP клиент с mock-режимом
- `lib/parser.mjs` — извлечение text/tool_calls
- `lib/events.mjs` — запись событий (console + JSON file)
- `sandbox/` — свой sandbox с тестовыми файлами
- Unit tests с mock (без API)
- C4 Context + Container + Deployment диаграммы

**DoD для A.1:**
- `node harness.mjs "test"` выводит mock-ответ с меткой [MOCK]
- `node server.mjs` запускает веб-сервер на localhost:3000
- Веб-интерфейс показывает [MOCK] в ответе
- События видны в консоли и сохраняются в JSON
- Тест успешного запроса проходит
- Тест ошибки проходит
- Диаграммы соответствуют коду

### Phase A.2: Реальный Ollama + RecoveryParser 🟡

**Scope:** Подключение к Ollama, восстановление malformed JSON

**Deliverables:**
- `lib/client.mjs` — реальный HTTP к Ollama
- `lib/recovery.mjs` — RecoveryParser для tool_calls
- Integration test (1 запрос к Ollama)

**Rationale:** Research iter2 показал 99.5% raw tool call failure → RecoveryParser обязателен.

### Phase A.3: Tool execution loop ✅

**Scope:** Полный цикл: запрос → tool_call → executor → финальный ответ

**Deliverables:**
- `lib/executor.mjs` — 4 read tools (sandbox)
- `lib/context.mjs` — сборка messages + tools + history
- Один полный цикл с tool execution

### Phase A.3+: Write tools + Commands ✅

**Scope:** Claude Code-like автономные возможности

**Deliverables:**
- 5 новых инструментов: `write_file`, `edit_file`, `list_workspace`, `read_workspace`, `run_command`
- Workspace (`workspace_files/`) — изолированная область для записи
- Command execution с blacklist и timeout
- Обновлённая документация и диаграммы
- 46 unit tests

**Security:**
- Path traversal protection в обеих зонах
- Blacklist опасных команд (rm -rf, sudo, etc.)
- Timeout 10s, output limit 4KB

### Phase B: История и observability (опционально) 🟢

**Deliverables:**
- Сохранение истории диалога
- Структурированные логи для анализа
- State/Activity диаграммы

## 5. Definition of Done (DoD)

### Phase A.1 (Mock)
- ✅ 1. `node harness.mjs "test"` выводит mock-ответ с меткой [MOCK]
- ✅ 2. События записываются в консоль и JSON файл
- ✅ 3. `npm test` проходит (успешный запрос + ошибка)
- ✅ 4. C4 Context, Container, Deployment диаграммы созданы

### Phase A.2 (Ollama + Recovery)
- ✅ 5. `node harness.mjs "вопрос"` получает ответ от Ollama
- ✅ 6. RecoveryParser исправляет malformed tool_calls
- ✅ 7. Integration test проходит (1 запрос к Ollama)

### Phase A.3 (Full cycle)
- ✅ 8. Модель выбирает правильный инструмент для запроса о файлах
- ✅ 9. Executor выполняет tool call и возвращает результат
- ✅ 10. Модель формирует финальный ответ на основе результата
- ✅ 11. Sandbox отклоняет путь за пределами разрешённой папки
- ✅ 12. В консоли видны этапы: Context → Request → Response → Executor → Answer

### Phase A.3+ (Write + Commands)
- ✅ 13. `write_file` создаёт файлы в workspace
- ✅ 14. `edit_file` редактирует существующие файлы
- ✅ 15. `run_command` выполняет bash-команды
- ✅ 16. Workspace отклоняет path traversal
- ✅ 17. Blacklist блокирует опасные команды
- ✅ 18. Web UI поддерживает полный цикл
- ✅ 19. 46 unit tests проходят
- ✅ 20. Все диаграммы обновлены

## 6. Definition of Failure (DoF)

- ❌ 1. Модель не вызывает инструмент при явном запросе о файлах
- ❌ 2. Executor возвращает ошибку на валидный путь
- ❌ 3. Цикл зависает или не завершается
- ❌ 4. Harness не показывает этапы работы

**On failure:** Вернуться к curl-примерам из раздатки, проверить каждый этап отдельно.

## 7. Principles

1. **Простота** — Минимум кода, максимум понимания. Избегать абстракций.
2. **Прозрачность** — Логировать каждый этап для обучения.
3. **Изоляция** — Executor работает только с sandbox.
4. **Учебная цель** — Не production, а понимание механизмов.

### 7.2 Knowledge Citations

| # | Source | Item | How it applies |
|---|--------|------|----------------|
| 1 | `CLAUDE.md` | §North Star | Человек понимает архитектуру без кода |
| 2 | `docs/architecture-requirements.md` | §Methodology | C4 + UML + Structurizr |
| 3 | `docs/architecture-requirements.md` | §Requirements for Agents | Диаграммы до и после |
| 4 | `docs/architecture.md` | §Критерии готовности | Определяет DoD |
| 5 | `docs/components.md` | §Описание компонентов | Структура lib/ |
| 6 | `docs/request-flow.md` | §Mermaid схема | Value Flow |
| 7 | `docs/testing.md` | §Test Levels | Unit/Integration/Evals |
| 8 | `KNOWLEDGE.md` | §Environment | Runtime: Node.js 24+ |
| 9 | `workspace/.../research/iter2/RES.md` | §Risk Mitigation | 99.5% failure → RecoveryParser |

## 8. Dependencies

| Dependency | Status |
|------------|--------|
| Node.js 24+ | ✅ установлен |
| Ollama 0.40.6 | ✅ установлен |
| qwen3.5:0.8b | ✅ загружена |
| renderer/lab/tool.mjs | ✅ из Практики 1 |

## 9. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 99.5% raw tool call failure (sub-2B models) | High | High | RecoveryParser в Phase A.2 |
| Модель не вызывает tools | Medium | High | Проверить tools JSON, temperature=0 |
| Thinking loops в qwen3.5 | Medium | Medium | Timeout + max turns в Phase A.3 |
| Ollama timeout | Low | Medium | Увеличить timeout, проверить GPU |
| Path traversal | Low | High | Использовать готовый resolveSafePath |

**Source:** Research iter2 (arxiv 2609.07370, Toolworthy review)

## 10. RESEARCH Case

### Blind Spots
- Как qwen3.5:0.8b ведёт себя с несколькими tools?
- Нужен ли system prompt для надёжного tool calling?

### Hypotheses

| # | Hypothesis | Status |
|---|----------|--------|
| H1 | qwen3.5:0.8b вызывает tool без system prompt | open |
| H2 | Streaming усложняет парсинг tool_calls | open |

### Risks of Not Researching
Модель может не вызывать инструменты, цикл не завершится.

### Proposed RESEARCH Focus
1. **Gather**: Тестовые запросы к Ollama с tools
2. **Extract**: Формат tool_calls в ответе
3. **Challenge**: Работает ли без system prompt?

### Why Not Just...?

| Approach | Value | Adoption / operating burden | Risks / tradeoffs | Decision and reason |
|---|---|---|---|---|
| Собственный CLI harness | Понимание механизмов | Написать ~200 строк | Учебный, не production | Выбрано — цель курса |
| Использовать готовый интерфейс | Быстрее | Не понимаем устройство | Не достигаем цели | Отклонено — нет обучения |

**Leave unchanged:** Продолжать использовать curl — неудобно, нет понимания цикла.

**Critical challenge:** Зачем писать harness, если есть готовые? Ответ: цель — понимание, не использование.

## 11. Strategic Insights (Planning)

| # | Insight | Category | Source |
|---|---------|----------|--------|
| S1 | Harness — это цикл, не линейный процесс | Architecture | Лекция Day 2 |
| S2 | Модель не выполняет действия, только предлагает | Mental model | Практика 1 |

## 12. Amendment Log

**No amendments.**

---

*HL — HARNESS: Учебный Harness для Agent Engineering | 2026-11-03*
