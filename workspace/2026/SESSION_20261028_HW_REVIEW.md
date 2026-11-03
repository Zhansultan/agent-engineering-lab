# Сессия 2026-10-28: Проверка и доработка ДЗ после Дня 2

## Контекст

**Участник:** Жансултан Абенов (@zhabenov)
**Задача:** Проверить выполнение ДЗ после Дня 2 и доделать недостающее
**Источник задания:** `day-2/homework-v1.md`, HAR файл `hub.innoforce.kz_2nd_task.har`

---

## Требования ДЗ (homework-v1.md)

### Практика 1 — Научить harness находить сведения
- Добавить инструменты: `list_directory`, `read_text`, `find_files`, `search_text`
- Исполнитель работает только с sandbox
- Проверка пути, ограничение размера, возврат ошибок модели

### Практика 2 — Довести фундамент проекта по TFW
1. Записать цель, ценность, критерии готовности
2. Выбрать редакцию TFW, завершить инициализацию
3. Поставить первую задачу о требованиях и архитектуре (HL)
4. В `docs/` описать путь запроса, границы компонентов, схему
5. Разместить проект в GitLab потока

---

## Статус на начало сессии

### Практика 1 — ✅ ВЫПОЛНЕНА

| Компонент | Файл | Статус |
|-----------|------|--------|
| Tool definitions | `requests/05-tools.json` | ✅ 4 инструмента |
| Executor | `renderer/lab/tool.mjs` | ✅ 361 строка |
| Sandbox | `renderer/lab/sandbox/` | ✅ тестовые файлы |
| Path validation | `resolveSafePath()` | ✅ realpath + проверка |
| Size limit | `MAX_FILE_SIZE = 8192` | ✅ |
| Error handling | `{ error: err.message }` | ✅ |

### Практика 2 — ⚠️ ЧАСТИЧНО

| Пункт | Статус на начало |
|-------|------------------|
| TFW инициализация | ✅ Full редакция |
| README.md | ✅ базовый |
| CLAUDE.md | ✅ |
| .user_preferences.md | ✅ |
| team/zhabenov.md | ✅ |
| KNOWLEDGE.md | ✅ факты о среде |
| **docs/** | ❌ не существовала |
| **HL файл** | ❌ не создан |
| **Git** | ❌ не инициализирован |
| **GitLab** | ❌ не размещён |

---

## Что сделано в этой сессии

### 1. Создана папка `docs/` с архитектурой

#### docs/architecture.md
- Назначение проекта
- Цель и ценность
- Критерии готовности (таблица)
- Стек с обоснованием (почему Node.js, а не Java)
- Структура проекта
- Связь с раздаткой курса
- Открытые вопросы
- Следующий шаг

#### docs/request-flow.md
- Mermaid-схема sequence diagram
- Текстовое описание каждого этапа (9 шагов)
- Границы ответственности компонентов
- Observability — что должно быть в логах

#### docs/components.md
- ASCII-схема архитектуры
- Описание 5 компонентов:
  - Context Builder
  - HTTP Client
  - Parser
  - Executor
  - Sandbox
- Таблица инструментов
- Поток данных (ASCII)
- Правила работы
- Команды проверки

### 2. Обновлён README.md
- Добавлена таблица участников
- Цель и ценность на русском
- Ссылки на docs/
- Структура проекта с docs/

### 3. Инициализирован Git
```bash
git init
# branch: master
```

### 4. Проверен .gitignore
- `.user_preferences.md` исключён ✅
- `.idea/` исключён ✅
- `node_modules/` исключён ✅

---

## Что НЕ сделано (осталось)

| Пункт | Причина | Действие |
|-------|---------|----------|
| HL файл | Не был создан ранее | Решить: создавать через `/tfw-plan` или достаточно `docs/` |
| Первый коммит | Ждёт подтверждения | `git add . && git commit` |
| GitLab | Нет remote | Нужен URL репозитория потока |

---

## Обнаруженные факты

1. **Практика 1 полностью выполнена** — все 4 инструмента реализованы в `renderer/lab/tool.mjs`

2. **TFW инициализация была выполнена** — задача `HARNESS_20261022-120519_INIT` в статусе DONE

3. **HL файла нет** — была только задача инициализации, не задача планирования архитектуры

4. **Проект не был под git** — инициализирован в этой сессии

---

## Структура проекта после сессии

```
agent-engineering-lab/
├── .git/                    # NEW — инициализирован
├── docs/                    # NEW — создана
│   ├── architecture.md      # NEW
│   ├── request-flow.md      # NEW
│   └── components.md        # NEW
├── .tfw/                    # было
├── .claude/commands/        # было
├── team/zhabenov.md         # было
├── knowledge/records/       # было (пусто)
├── workspace/
│   └── 2026/
│       ├── HARNESS_20261022-120519_INIT/  # было
│       └── SESSION_20261028_HW_REVIEW.md  # NEW — этот файл
├── .gitignore               # было
├── .user_preferences.md     # было (вне git)
├── AGENTS.md                # было
├── CLAUDE.md                # было
├── KNOWLEDGE.md             # было
├── README.md                # UPDATED
└── preflight-v2.mjs         # было
```

---

## Следующие шаги

1. **Решить про HL** — создавать полноценный или достаточно `docs/`
2. **Первый коммит** — зафиксировать текущее состояние
3. **Добавить remote** — когда будет URL GitLab потока
4. **Push в GitLab** — завершить Практику 2

---

## Команды для продолжения

```bash
# Проверить статус
cd "/home/zhabenov/tfw workshop/agent-engineering-lab"
git status

# Сделать первый коммит
git add .
git commit -m "feat: add docs/ architecture, init git

- docs/architecture.md: project goals, stack, criteria
- docs/request-flow.md: request flow with Mermaid diagram
- docs/components.md: component boundaries
- README.md: updated with participants and docs links
- Homework Day 2: Practice 2 documentation complete

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Добавить remote (когда будет URL)
git remote add origin <GITLAB_URL>
git push -u origin master
```

---

*Сессия: 2026-10-28 | Участник: @zhabenov | Помощник: Claude Opus 4.5*
