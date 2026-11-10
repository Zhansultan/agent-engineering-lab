# Component Diagram: Harness

## C4 Level 3 — Components

```mermaid
graph TB
    subgraph Harness["Harness (Node.js Application)"]
        CB[Context Builder]
        HC[HTTP Client]
        RP[Recovery Parser]
        P[Parser]
        E[Executor]
    end

    subgraph External["External Systems"]
        O[(Ollama<br/>LLM Backend)]
    end

    subgraph Storage["File Storage"]
        S[(Sandbox<br/>Read-Only)]
        W[(Workspace<br/>Read-Write)]
        SH[(Shell<br/>Commands)]
    end

    subgraph Data["Data Artifacts"]
        TD[Tool Definitions<br/>9 tools]
        TR[Tool Results<br/>JSON]
    end

    U((User)) --> CB
    CB --> TD
    CB --> HC
    HC --> O
    HC --> RP
    O --> P
    P --> E
    E --> S
    E --> W
    E --> SH
    S --> TR
    W --> TR
    SH --> TR
    TR --> CB
    P --> U

    style Harness fill:#e1f5fe
    style External fill:#fff3e0
    style Storage fill:#e8f5e9
    style Data fill:#f3e5f5
```

## Компоненты

### Context Builder
- **Назначение**: Собирает контекст для запроса к модели
- **Входы**: User message, history, tool definitions (9 tools)
- **Выходы**: JSON request для Ollama API
- **Границы**: Не делает HTTP, не знает о модели, stateless
- **Реализация**: `lib/context.mjs`

### HTTP Client
- **Назначение**: Транспорт к Ollama API (mock или real)
- **Входы**: JSON request
- **Выходы**: JSON response, network errors
- **Границы**: Использует Recovery Parser для малых моделей
- **Реализация**: `lib/client.mjs`

### Recovery Parser
- **Назначение**: Восстанавливает malformed JSON от малых моделей
- **Входы**: Raw text response
- **Выходы**: Valid JSON или error
- **Границы**: Обрабатывает single quotes, trailing commas, missing braces
- **Реализация**: `lib/recovery.mjs`

### Parser
- **Назначение**: Разбирает ответ модели
- **Входы**: JSON response от Ollama
- **Выходы**: Text response или tool_calls
- **Границы**: Не выполняет tool calls, не валидирует аргументы
- **Реализация**: `lib/parser.mjs`

### Executor
- **Назначение**: Выполняет вызовы инструментов в двух зонах
- **Входы**: Tool call `{function: {name, arguments}}`
- **Выходы**: Tool result `{role: "tool", content: ...}`
- **Read tools**: sandbox (4 tools: list_directory, read_text, find_files, search_text)
- **Write tools**: workspace (5 tools: write_file, edit_file, list_workspace, read_workspace, run_command)
- **Границы**: Path traversal protection, command blacklist, timeouts
- **Реализация**: `lib/executor.mjs`

## Зависимости

```mermaid
graph LR
    CB[Context Builder] --> HC[HTTP Client]
    HC --> RP[Recovery Parser]
    HC --> P[Parser]
    P --> E[Executor]
    E --> CB

    CB -.-> TD[(Tool Defs<br/>9 tools)]
    E -.-> S[(Sandbox<br/>read)]
    E -.-> W[(Workspace<br/>write)]
    E -.-> SH[(Shell<br/>commands)]

    style CB fill:#bbdefb
    style HC fill:#c8e6c9
    style RP fill:#e1bee7
    style P fill:#fff9c4
    style E fill:#ffccbc
```

## Security Model

```mermaid
graph TB
    subgraph Executor
        RT[Read Tools]
        WT[Write Tools]
        CT[Command Tools]
    end

    subgraph Validation
        PV[Path Validation]
        BL[Command Blacklist]
        TO[Timeout 10s]
    end

    RT --> PV
    WT --> PV
    CT --> BL
    CT --> TO

    PV -->|sandbox| S[(Sandbox)]
    PV -->|workspace| W[(Workspace)]
    BL --> SH[(Shell)]

    style Executor fill:#fff3e0
    style Validation fill:#ffcdd2
```
