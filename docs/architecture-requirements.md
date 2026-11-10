# Architecture Documentation Requirements

## North Star

**Человек понимает и контролирует архитектуру без погружения в детали реализации.**

Владелец должен быть уверен, что система удовлетворяет функциональным требованиям, видя архитектуру на нужном уровне абстракции.

## Core Values

1. **Прозрачность до реализации** — архитектура понятна до написания кода
2. **Прозрачность после реализации** — актуальные диаграммы отражают реальное состояние
3. **Многоуровневость** — разные слои для разных аудиторий
4. **Проверяемость** — диаграммы можно сопоставить с кодом

## Methodology

### C4 Model

Используем C4 для структурных диаграмм:

| Level | Что показывает | Аудитория |
|-------|---------------|-----------|
| Context (L1) | Система и её окружение | Стейкхолдеры, продакты |
| Container (L2) | Приложения, базы, сервисы | Архитекторы, аналитики |
| Component (L3) | Компоненты внутри контейнера | Инженеры |
| Code (L4) | Классы и интерфейсы | Разработчики |

### UML Diagrams

Минимальный набор диаграмм:

| Diagram | Назначение | Когда обязательна |
|---------|-----------|-------------------|
| **Component** | Структура компонентов и зависимости | Любая фича с >1 компонентом |
| **Class** | Классы, интерфейсы, отношения | Сложная доменная модель |
| **State** | Состояния и переходы объекта | FSM, lifecycle, stateful objects |
| **Activity** | Workflow, алгоритмы | Бизнес-процессы, сложная логика |
| **Deployment** | Инфраструктура, ноды, артефакты | Любой деплоймент |
| **Sequence** | Взаимодействие во времени | API flows, интеграции |

### Structurizr

Используем Structurizr DSL для:
- Версионируемые диаграммы (as code)
- Автоматическая генерация из модели
- Единый источник правды

```
workspace/
  model.dsl          # Structurizr DSL model
  docs/
    diagrams/        # Generated PNG/SVG
```

## Audience Matrix

| Роль | Нужные диаграммы | Уровень детализации |
|------|-----------------|---------------------|
| **Стейкхолдеры** | Context, Deployment | Высокий (L1-L2) |
| **Продакты** | Context, Activity | Высокий (L1) |
| **Аналитики** | Activity, State, Sequence | Средний (L2-L3) |
| **Инженеры** | Component, Class, Sequence | Низкий (L3-L4) |
| **Инфраструктурщики** | Deployment, Container | Средний (L2) |

## Requirements for Agents

### Before Implementation

1. **Component diagram** — какие компоненты создаём/меняем
2. **Sequence diagram** — как компоненты взаимодействуют
3. Диаграммы согласованы с владельцем до написания кода

### After Implementation

1. Обновить диаграммы если архитектура изменилась
2. Диаграммы соответствуют реальному коду
3. Изменения архитектуры зафиксированы в task trace

### Diagram Standards

```
docs/diagrams/
  c4-context.png       # System context
  c4-container.png     # Container view
  component-*.png      # Component diagrams
  class-*.png          # Class diagrams
  state-*.png          # State machines
  activity-*.png       # Workflows
  deployment-*.png     # Infrastructure
  sequence-*.png       # Interactions
```

**Format:** PNG или SVG, source в Structurizr DSL или PlantUML.

**Naming:** `{type}-{subject}.{ext}` (например: `sequence-chat-flow.png`)

## Validation Checklist

Перед acceptance любой архитектурной фичи:

- [ ] Component diagram отражает новые/изменённые компоненты
- [ ] Sequence diagram показывает key flows
- [ ] Deployment diagram актуален (если меняется инфраструктура)
- [ ] Диаграммы соответствуют коду
- [ ] Владелец понимает архитектуру без чтения кода
