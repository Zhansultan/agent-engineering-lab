# Architecture Diagrams

Диаграммы в формате Mermaid и ASCII. Просматривать в GitHub, VS Code с Mermaid extension, или https://mermaid.live

## Версия: Phase A.3+

Документация отражает полный цикл с поддержкой 9 инструментов (read + write + command).

## Содержание

### C4 Model (высокоуровневые)

| Diagram | File | Назначение |
|---------|------|------------|
| C4 Context | [c4-context.md](c4-context.md) | Система и её окружение (L1) |
| C4 Container | [c4-container.md](c4-container.md) | Контейнеры и зависимости (L2) |
| Component | [component-harness.md](component-harness.md) | Компоненты harness (L3) |

### UML (поведенческие и структурные)

| Diagram | File | Назначение |
|---------|------|------------|
| Sequence | [sequence-request-flow.md](sequence-request-flow.md) | Путь запроса через систему |
| State | [state-harness-loop.md](state-harness-loop.md) | Состояния обработки запроса |
| Activity | [activity-tool-execution.md](activity-tool-execution.md) | Workflow выполнения инструмента |
| Class | [class-data-structures.md](class-data-structures.md) | Структуры данных API |
| Deployment | [deployment-local.md](deployment-local.md) | Инфраструктура развёртывания |

## Ключевые концепции

### Два типа зон хранения
- **Sandbox** (`sandbox/`): read-only, тестовые данные
- **Workspace** (`workspace_files/`): read-write, создаваемые файлы

### 9 инструментов
| Зона | Инструменты |
|------|-------------|
| Sandbox (read) | list_directory, read_text, find_files, search_text |
| Workspace (write) | write_file, edit_file, list_workspace, read_workspace |
| Shell (command) | run_command |

### Безопасность
- Path traversal protection в обеих зонах
- Blacklist опасных команд
- Timeout 10s, output limit 4KB

## Аудитории

| Роль | Рекомендуемые диаграммы |
|------|------------------------|
| Стейкхолдеры | Component (L1), Deployment |
| Продакты | Component, Activity |
| Аналитики | Activity, State, Sequence |
| Инженеры | Component, Class, Sequence |
| Инфраструктурщики | Deployment |
| Security | Activity, Class (Security Constants) |
