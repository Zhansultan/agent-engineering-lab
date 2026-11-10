# State Diagram: Harness Loop

## Состояния обработки запроса

```mermaid
stateDiagram-v2
    [*] --> Idle: start

    Idle --> BuildingContext: user_message
    BuildingContext --> SendingRequest: context_ready

    SendingRequest --> WaitingResponse: request_sent
    WaitingResponse --> RecoveringJSON: malformed_response
    WaitingResponse --> ParsingResponse: valid_response
    WaitingResponse --> Error: network_error

    RecoveringJSON --> ParsingResponse: recovered
    RecoveringJSON --> Error: unrecoverable

    ParsingResponse --> ProcessingToolCall: has_tool_calls
    ParsingResponse --> ReturningResponse: has_text_only
    ParsingResponse --> Error: parse_error

    ProcessingToolCall --> ExecutingReadTool: read_tool
    ProcessingToolCall --> ExecutingWriteTool: write_tool
    ProcessingToolCall --> ExecutingCommand: command_tool
    ProcessingToolCall --> Error: invalid_tool

    ExecutingReadTool --> BuildingContext: tool_result_ready
    ExecutingWriteTool --> BuildingContext: tool_result_ready
    ExecutingCommand --> BuildingContext: tool_result_ready

    ReturningResponse --> Idle: response_delivered
    Error --> Idle: error_handled

    state ProcessingToolCall {
        [*] --> ValidatingName
        ValidatingName --> RouteByType: name_ok
        ValidatingName --> [*]: unknown_tool
        RouteByType --> ValidateSandbox: read_tool
        RouteByType --> ValidateWorkspace: write_tool
        RouteByType --> ValidateCommand: command_tool
        ValidateSandbox --> Ready: path_ok
        ValidateWorkspace --> Ready: path_ok
        ValidateCommand --> Ready: not_blocked
        Ready --> [*]
    }
```

## Описание состояний

| Состояние | Описание | Следующие состояния |
|-----------|----------|---------------------|
| **Idle** | Ожидание запроса | BuildingContext |
| **BuildingContext** | Сборка messages, tools[9] | SendingRequest |
| **SendingRequest** | HTTP POST к Ollama | WaitingResponse |
| **WaitingResponse** | Ожидание ответа модели | RecoveringJSON, ParsingResponse, Error |
| **RecoveringJSON** | Восстановление malformed JSON | ParsingResponse, Error |
| **ParsingResponse** | Разбор JSON ответа | ProcessingToolCall, ReturningResponse, Error |
| **ProcessingToolCall** | Валидация и роутинг tool call | ExecutingReadTool, ExecutingWriteTool, ExecutingCommand, Error |
| **ExecutingReadTool** | Чтение из sandbox | BuildingContext (loop) |
| **ExecutingWriteTool** | Запись в workspace | BuildingContext (loop) |
| **ExecutingCommand** | Выполнение bash-команды | BuildingContext (loop) |
| **ReturningResponse** | Возврат ответа пользователю | Idle |
| **Error** | Обработка ошибки | Idle |

## Transitions

```mermaid
graph LR
    A[user_message] --> B[context_ready]
    B --> C[request_sent]
    C --> D[response_received]
    D --> R{malformed?}
    R -->|yes| RR[recover_json]
    R -->|no| E{has_tool_calls?}
    RR --> E
    E -->|yes| F{tool_type?}
    E -->|no| G[response_delivered]
    F -->|read| FR[read_sandbox]
    F -->|write| FW[write_workspace]
    F -->|command| FC[run_command]
    FR --> H[tool_result_ready]
    FW --> H
    FC --> H
    H --> B

    style E fill:#fff9c4
    style F fill:#e1f5fe
    style R fill:#e1bee7
```

## Loop Invariants

1. **Max turns**: Цикл ограничен 10 итерациями (MAX_TURNS)
2. **State isolation**: Каждое состояние не хранит данные предыдущего
3. **Error as data**: Ошибки executor возвращаются модели, не прерывают цикл
4. **Tool isolation**: Read tools → sandbox, Write tools → workspace
5. **Command safety**: Blacklist + timeout + output limit
