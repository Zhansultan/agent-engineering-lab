# Deployment Diagram: Local Development

## Infrastructure Overview

```mermaid
graph TB
    subgraph Developer["Developer Machine"]
        subgraph NodeRuntime["Node.js Runtime"]
            H[Harness Application]
        end

        subgraph OllamaService["Ollama Service"]
            O[Ollama Server<br/>:11434]
            M[(Model Storage<br/>~/.ollama/models)]
        end

        subgraph FileSystem["File System"]
            S[Sandbox<br/>sandbox/ - read only]
            W[Workspace<br/>workspace_files/ - read/write]
            P[Project Files<br/>agent-engineering-lab/]
        end
    end

    H -->|HTTP POST /api/chat| O
    O --> M
    H -->|read only| S
    H -->|read/write| W
    H --> P

    style Developer fill:#e3f2fd
    style NodeRuntime fill:#e8f5e9
    style OllamaService fill:#fff3e0
    style FileSystem fill:#fce4ec
```

## Component Deployment

```mermaid
graph LR
    subgraph Process["node harness.mjs"]
        CB[Context Builder]
        HC[HTTP Client]
        P[Parser]
        E[Executor]
    end

    subgraph Ollama["ollama serve"]
        API[REST API]
        INF[Inference Engine]
        MOD[qwen3.5:0.8b]
    end

    HC -->|localhost:11434| API
    API --> INF
    INF --> MOD

    style Process fill:#bbdefb
    style Ollama fill:#ffe0b2
```

## Network Configuration

| Component | Host | Port | Protocol |
|-----------|------|------|----------|
| Harness | localhost | - | - |
| Ollama API | localhost | 11434 | HTTP |

## File System Layout

```
/home/user/
├── .ollama/
│   └── models/           # Ollama model storage
│       └── qwen3.5:0.8b/
│
└── tfw workshop/
    └── agent-engineering-lab/
        ├── harness.mjs           # CLI entry point
        ├── server.mjs            # Web server entry point
        ├── lib/
        │   ├── context.mjs       # Context Builder
        │   ├── client.mjs        # HTTP Client
        │   ├── parser.mjs        # Parser
        │   ├── executor.mjs      # Tool Executor
        │   ├── recovery.mjs      # JSON Recovery Parser
        │   └── events.mjs        # Event Logger
        ├── sandbox/              # Read-only file system
        │   ├── project-note.md
        │   ├── config.json
        │   └── notes/
        ├── workspace_files/      # Read/write area
        │   └── (model-created files)
        ├── web/                  # Web UI
        │   ├── index.html
        │   └── app.js
        └── docs/
            └── diagrams/
```

## Resource Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 4 GB | 8 GB |
| Disk (models) | 2 GB | 5 GB |
| CPU | 4 cores | 8 cores |
| Node.js | v24+ | v24+ |

## Startup Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant T as Terminal
    participant O as Ollama
    participant H as Harness

    U->>T: ollama serve
    T->>O: Start server
    O-->>T: Listening on :11434

    U->>T: node preflight-v2.mjs
    T->>H: Check environment
    H->>O: GET /api/version
    O-->>H: OK
    H->>O: POST /api/chat (test)
    O-->>H: Response
    H-->>T: READY

    U->>T: node harness.mjs
    T->>H: Start application
    H-->>T: Ready for input
```

## Security Boundaries

```mermaid
graph TB
    subgraph Trusted["Trusted Zone"]
        H[Harness]
        O[Ollama]
    end

    subgraph ReadOnly["Read-Only Zone"]
        S[Sandbox Files]
    end

    subgraph Controlled["Controlled Write Zone"]
        W[Workspace Files]
        CMD[Command Execution]
    end

    subgraph Untrusted["Untrusted"]
        M[Model Output]
        U[User Input]
    end

    U --> H
    H --> O
    O --> M
    M --> H
    H -.->|read only| S
    H -.->|validated write| W
    H -.->|filtered commands| CMD

    style Trusted fill:#c8e6c9
    style ReadOnly fill:#fff9c4
    style Controlled fill:#ffe0b2
    style Untrusted fill:#ffcdd2
```

- **User Input**: Валидируется перед отправкой
- **Model Output**: Не доверяем, парсим и валидируем
- **Sandbox**: Только чтение через Executor с проверками путей
- **Workspace**: Запись только в изолированную директорию
- **Commands**: Blacklist опасных команд (sudo, rm -rf /, etc.)
