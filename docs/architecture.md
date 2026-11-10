# Архитектура учебного Harness

## Назначение

Учебный harness для понимания архитектуры AI-агентов: как устроены Codex, Claude Code, Antigravity.

## Цель проекта

Научиться собирать основные механизмы harness:
- Сбор контекста (context gathering)
- Вызов модели (model calling)
- Разбор структурированного вывода (structured output parsing)
- Вызов инструментов (tool calling)

## Ценность

- Понимание устройства harness изнутри
- Умение применять и развивать механизмы под свои задачи
- Основа для production-решений в Innoforce

## Критерии готовности

| Компонент | Критерий проверки |
|-----------|-------------------|
| Вызов модели | Ответ совпадает по смыслу с ручным curl |
| Tool definitions | Модель выбирает правильный инструмент |
| Executor (read) | Выполняет чтение sandbox, возвращает результат |
| Executor (write) | Создаёт/редактирует файлы в workspace |
| Executor (command) | Выполняет bash-команды с blacklist |
| Sandbox | Отклоняет пути за пределами разрешённой папки |
| Workspace | Изолированная область для записи |
| Цикл | Модель получает результат и отвечает пользователю |

## Стек

| Слой | Технология | Обоснование |
|------|------------|-------------|
| Runtime | Node.js 24+ | ES modules, async/await, простой код |
| LLM Backend | Ollama | Локальный запуск, бесплатно, API совместим с OpenAI |
| Model | qwen3.5:0.8b | Маленькая, быстрая (~4s), поддерживает tools |
| Protocol | HTTP/JSON | Простой, понятные ошибки, curl-friendly |

### Почему Node.js, а не Java

- Меньше boilerplate кода
- Быстрее итерации (нет компиляции)
- Лучше документация для AI-агентов
- Spring Boot избыточен для учебного проекта

## Структура проекта

```
agent-engineering-lab/
├── harness.mjs              # CLI entry point
├── server.mjs               # Web server entry point
├── lib/                     # Core modules
│   ├── context.mjs          # Context Builder
│   ├── client.mjs           # HTTP Client (mock + Ollama)
│   ├── parser.mjs           # Response Parser
│   ├── executor.mjs         # Tool Executor
│   ├── recovery.mjs         # JSON Recovery Parser
│   └── events.mjs           # Event Logger
├── web/                     # Web UI
│   ├── index.html           # UI template
│   └── app.js               # Frontend logic
├── sandbox/                 # Read-only test files
│   ├── project-note.md
│   ├── config.json
│   └── notes/
├── workspace_files/         # Read/write area (model-created)
├── logs/                    # Event logs
│   └── events.jsonl
├── docs/                    # Architecture documentation
│   ├── architecture.md      # This file
│   ├── request-flow.md      # Request path
│   ├── components.md        # Component boundaries
│   └── diagrams/            # C4 + UML diagrams
├── tests/                   # Unit and integration tests
│   ├── unit/
│   └── integration/
├── .tfw/                    # TFW framework
├── CLAUDE.md                # Claude Code instructions
└── KNOWLEDGE.md             # Project knowledge index
```

## Возможности (Phase A.3+)

### Read Tools (sandbox)
| Инструмент | Описание |
|------------|----------|
| `list_directory` | Список файлов в папке |
| `read_text` | Чтение текстового файла |
| `find_files` | Поиск файлов по имени |
| `search_text` | Поиск текста в файлах |

### Write Tools (workspace)
| Инструмент | Описание |
|------------|----------|
| `write_file` | Создать/перезаписать файл |
| `edit_file` | Заменить текст в файле |
| `list_workspace` | Просмотр workspace |
| `read_workspace` | Чтение из workspace |
| `run_command` | Выполнить bash-команду |

### Безопасность
- **Sandbox**: только чтение, path validation
- **Workspace**: изолированная запись, path traversal protection
- **Commands**: blacklist опасных команд, timeout 10s, output limit 4KB

## Интерфейсы

| Интерфейс | Команда | Описание |
|-----------|---------|----------|
| CLI | `node harness.mjs "message"` | Терминальный режим |
| Web UI | `node server.mjs` | Browser на localhost:3000 |
| Tests | `node --test tests/` | Автоматические тесты |

## Режимы работы

| Режим | Описание | Использование |
|-------|----------|---------------|
| Mock | Мгновенные тестовые ответы | Разработка, тесты |
| Ollama | Реальная модель (qwen3.5:0.8b) | Демонстрация, эксперименты |
