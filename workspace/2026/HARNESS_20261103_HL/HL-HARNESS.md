# HL — HARNESS: Учебный Harness для Agent Engineering

> **Date**: 2026-11-03
> **Author**: @zhabenov
> **Title**: Учебный Harness для понимания архитектуры AI-агентов
> **Abbreviation**: HARNESS
> **Status**: 📝 HL_DRAFT — Awaiting review
> **Contract**: 📝 DRAFT — not yet approved
> **Frozen**: §1 · §3 · §4 · §5 · §6 · §7 — locked on owner approval
> **Free**: §2 · §7.2 · §8 · §9 · §10 · §11 — research updates these directly
> **Append-only**: §12 Amendment Log — the only channel for changing a frozen section

> **Project North Star**: `README.md § Цель` · `docs/architecture.md § Цель проекта`

---

## 1. Vision

Собран работающий учебный harness, демонстрирующий полный цикл: пользователь задаёт вопрос → harness собирает контекст → модель отвечает или вызывает инструмент → executor выполняет → модель формирует финальный ответ.

**Impact:** Участник курса понимает, как устроены Codex, Claude Code, Antigravity изнутри. Может применять и развивать механизмы под свои задачи в Innoforce.

> "Теперь я вижу, что модель — это только часть. Harness делает всю работу вокруг: собирает контекст, разбирает ответ, выполняет инструменты."

## 2. Current State (As-Is)

**Источник:** `docs/architecture.md`, `docs/components.md`, `KNOWLEDGE.md`

### Что есть
- TFW Full инициализирован
- Документация архитектуры в `docs/`
- Раздатка курса `innoforce-model-lab-v5.zip` с работающим примером
- Executor для 4 инструментов в `renderer/lab/tool.mjs` (Практика 1)
- Ollama + qwen3.5:0.8b работает локально (~4s ответ)

### Чего нет
- Собственного harness-кода (используем раздатку)
- CLI интерфейса
- Хранения истории диалога
- Логирования этапов

### Ограничения
- Учебный проект — не production
- Только локальный Ollama
- Только чтение файлов (sandbox)

## 3. Target State (To-Be)

Минимальный CLI harness на Node.js:
- Принимает вопрос пользователя
- Собирает контекст (messages + tools)
- Отправляет в Ollama
- Разбирает ответ (текст или tool_calls)
- Выполняет инструменты через executor
- Возвращает результат пользователю

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

**Структура файлов после:**
```
agent-engineering-lab/
├── harness.mjs           # Точка входа CLI
├── lib/
│   ├── context.mjs       # Context Builder
│   ├── client.mjs        # HTTP Client
│   ├── parser.mjs        # Response Parser
│   └── executor.mjs      # Tool Executor (адаптер)
├── sandbox/              # Тестовые файлы
└── tools.json            # Tool definitions
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

### Phase A: Минимальный цикл (MVP)

**Deliverables:**
- `harness.mjs` — CLI точка входа
- `lib/context.mjs` — сборка messages + tools
- `lib/client.mjs` — HTTP POST к Ollama
- `lib/parser.mjs` — извлечение text/tool_calls
- `lib/executor.mjs` — вызов существующего tool.mjs
- Один успешный цикл с tool call

### Phase B: Логирование и история (опционально)

**Deliverables:**
- Логи каждого этапа с временем
- Сохранение истории в JSON
- Повторный запрос с историей

## 5. Definition of Done (DoD)

- ✅ 1. `node harness.mjs "вопрос"` запускается без ошибок
- ✅ 2. Модель выбирает правильный инструмент для запроса о файлах
- ✅ 3. Executor выполняет tool call и возвращает результат
- ✅ 4. Модель формирует финальный ответ на основе результата
- ✅ 5. В консоли видны этапы: Context → Request → Response → Executor → Answer
- ✅ 6. Sandbox отклоняет путь за пределами разрешённой папки

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
| 1 | `docs/architecture.md` | §Критерии готовности | Определяет DoD |
| 2 | `docs/components.md` | §Описание компонентов | Структура lib/ |
| 3 | `docs/request-flow.md` | §Mermaid схема | Value Flow |
| 4 | `KNOWLEDGE.md` | §Environment | Runtime: Node.js 24+ |

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
| Модель не вызывает tools | Medium | High | Проверить tools JSON, добавить system prompt |
| Ollama timeout | Low | Medium | Увеличить timeout, проверить GPU |
| Path traversal | Low | High | Использовать готовый resolveSafePath |

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
