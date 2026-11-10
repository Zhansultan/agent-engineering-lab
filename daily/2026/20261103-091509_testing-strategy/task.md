# Daily Task — 20261103-091509_testing-strategy

**Заголовок:** Стратегия тестирования проекта

## 1. Source and attribution

**Автор запроса:** Жансултан Абенов (@zhabenov)
**Время:** 2026-11-03T09:15+05:00
**Worker:** Claude Opus 4.5 (claude-opus-4-5-20251101)

**Запрос (выдержка):**
> Обычный запуск тестов должен работать без моделей и платных API. Используй моки и сохранённые ответы для проверки нашего кода, ошибок, tool calls и записи событий.
> Integration tests с Ollama или внешним API запускаются отдельно. Для каждого нужны цель, ограничение числа запросов, timeout и максимальный размер ответа.
> Evals качества модели также выполняются отдельно.

## 2. Goal, Value and Boundaries

**Goal:** Определить и задокументировать стратегию тестирования с разделением на три уровня:
1. Unit tests — без внешних зависимостей
2. Integration tests — с Ollama/API, ограниченно
3. Evals — оценка качества модели

**Value:** Быстрые unit тесты можно запускать постоянно без затрат. Integration tests запускаются целенаправленно с контролем ресурсов.

**Boundaries:**
- Не вызывать модели и платные API в этой задаче
- Продукты: docs/testing.md, обновление AGENTS.md
- Проверить соответствие preflight-v2.mjs

**Completion oracle:** Документация записана, команды определены, AGENTS.md обновлён.

## 3. Context before action

**Inspected:**
- CLAUDE.md — проектные правила
- AGENTS.md — инструкции для агентов (упоминает `node preflight-v2.mjs` pattern)
- KNOWLEDGE.md — факты проекта
- .user_preferences.md — предпочтения владельца
- preflight-v2.mjs — единственный существующий "тест" (environment readiness check)
- docs/ — architecture.md, components.md, request-flow.md (нет testing.md)

**Prior-work lookup:** Папка daily/ не существовала. Документации по тестам нет.

**North Star fit:** Учебный проект, но правила тестирования важны для любого AI-проекта.

## 4. Result, decisions and check

### Продукты

| Artifact | Path | Status |
|----------|------|--------|
| Testing Strategy | docs/testing.md | created |
| Agent Instructions | AGENTS.md | updated |

### Decisions

1. **Структура тестов:**
   - `tests/unit/` — моки, fixtures, без внешних вызовов
   - `tests/integration/` — с Ollama, ограниченно
   - `tests/evals/` — качество модели

2. **Команды:**
   - `npm test` — только unit (по умолчанию)
   - `npm run test:integration` — с Ollama
   - `npm run test:evals` — оценка модели

3. **preflight-v2.mjs — integration test:**
   - Вызывает Ollama API
   - Не подходит для unit tests
   - Оставить как environment check, не как часть test suite

### Check

- [x] docs/testing.md создан с правилами (148 строк)
- [x] AGENTS.md обновлён с командами и правилами
- [x] preflight-v2.mjs классифицирован как environment check, не test

### Verified content

**docs/testing.md:**
- Три уровня тестов: unit, integration, evals
- Команды: `npm test`, `npm run test:integration`, `npm run test:evals`
- Правила для integration tests: goal, request limit, timeout, max response
- Шаблоны для unit и integration тестов
- Anti-patterns

**AGENTS.md:**
- Таблица с уровнями тестов и командами
- Rules for Agents (3 правила)
- Классификация preflight-v2.mjs

## 5. Next or close

**Status:** Prepared, checked, awaiting human acceptance.

Документация готова. Следующие шаги (не в scope этой задачи):
- Создать `tests/` структуру при первом написании тестов
- Добавить scripts в package.json
- Выбрать test runner (vitest или node:test)

---

<!-- tfw-economics-record-v1 {"schema_version":1,"id":"20261103-091509_testing-strategy","project":"agent-engineering-lab","goal":"Testing strategy documentation","value":"Fast unit tests without API costs","created":"2026-11-03T09:15:09+05:00","owner":"zhabenov","result_state":"prepared","binding_outcomes":[{"kind":"binding_unavailable","producer":"claude-opus-4-5-20251101","observed_at":"2026-11-03T09:15:09+05:00","code":"no_numeric_source","detail":"Daily task without economics capture requirement","known_facts":{"task_type":"documentation"},"unavailable_reasons":{"source":"no_api_calls_made"},"attempted_extraction":false,"last_good":null}]} -->
