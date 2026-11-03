# Agent Engineering Lab

Учебный проект для курса Agent Engineering в Innoforce.

## Участники

| Handle | Имя | Роль |
|--------|-----|------|
| @zhabenov | Жансултан Абенов | Backend Developer |

## Цель

Понять архитектуру harness (Codex, Claude Code, Antigravity) и собрать основные механизмы:
- Сбор контекста (context gathering)
- Вызов модели (model calling)
- Разбор структурированного вывода (structured output parsing)
- Вызов инструментов (tool calling)

## Ценность

- Понимание устройства harness изнутри
- Умение применять и развивать механизмы под свои задачи
- Основа для production-решений в Innoforce

## Quick Start

```bash
# Проверить среду
node preflight-v2.mjs

# Ожидается: все проверки пройдены, модель отвечает за ~4s
```

## Стек

| Компонент | Технология |
|-----------|------------|
| Runtime | Node.js 24+ |
| LLM Backend | Ollama |
| Model | qwen3.5:0.8b |
| Methodology | [Trace-First Workflow](.tfw/README.md) |

## Структура проекта

```
.
├── docs/              # Архитектура и решения
├── .tfw/              # TFW framework
├── .claude/commands/  # TFW slash commands
├── workspace/         # Task traces
├── team/              # Профили участников
├── knowledge/         # Verified knowledge records
├── CLAUDE.md          # Инструкции для Claude Code
├── AGENTS.md          # Инструкции для агентов
└── KNOWLEDGE.md       # Индекс знаний
```

## Документация

- [Архитектура](docs/architecture.md) — цель, стек, критерии готовности
- [Путь запроса](docs/request-flow.md) — схема и описание
- [Компоненты](docs/components.md) — границы и ответственность

## Workflow

Проект следует TFW. Новая работа начинается с `/tfw-plan`.

## Reference

- [TFW Philosophy](.tfw/README.md)
- [Glossary](.tfw/glossary.md)
- [Conventions](.tfw/conventions.md)
