# Activity Diagram: Tool Execution

## Workflow выполнения инструмента

```mermaid
flowchart TD
    Start([Получен tool_call]) --> Parse[Разобрать arguments JSON]
    Parse --> ValidName{Известный<br/>инструмент?}

    ValidName -->|Нет| ErrUnknown[Error: unknown tool]
    ValidName -->|Да| ToolType{Тип<br/>инструмента?}

    ToolType -->|Read| ReadFlow[Read Tool Flow]
    ToolType -->|Write| WriteFlow[Write Tool Flow]
    ToolType -->|Command| CmdFlow[Command Flow]

    subgraph ReadTools["Read Tools (sandbox)"]
        ReadFlow --> ExtractPath[Извлечь path]
        ExtractPath --> ResolveSandbox[Resolve в sandbox]
        ResolveSandbox --> CheckSandbox{Внутри<br/>sandbox?}
        CheckSandbox -->|Нет| ErrOutside[Error: outside sandbox]
        CheckSandbox -->|Да| CheckExists{Существует?}
        CheckExists -->|Нет| ErrNotFound[Error: not found]
        CheckExists -->|Да| CheckSize{≤ 8 КиБ?}
        CheckSize -->|Нет| ErrTooLarge[Error: too large]
        CheckSize -->|Да| ExecuteRead[Выполнить чтение]
    end

    subgraph WriteTools["Write Tools (workspace)"]
        WriteFlow --> ExtractPathW[Извлечь path]
        ExtractPathW --> ResolveWorkspace[Resolve в workspace]
        ResolveWorkspace --> CheckWorkspace{Внутри<br/>workspace?}
        CheckWorkspace -->|Нет| ErrOutsideW[Error: outside workspace]
        CheckWorkspace -->|Да| EnsureDir[Создать директории]
        EnsureDir --> ExecuteWrite[Выполнить запись]
    end

    subgraph CommandTools["Command Tools"]
        CmdFlow --> ExtractCmd[Извлечь command]
        ExtractCmd --> CheckBlacklist{В blacklist?}
        CheckBlacklist -->|Да| ErrBlocked[Error: blocked]
        CheckBlacklist -->|Нет| SpawnCmd[Spawn bash]
        SpawnCmd --> WaitTimeout{Timeout?}
        WaitTimeout -->|Да| KillCmd[Kill process]
        WaitTimeout -->|Нет| CollectOutput[Собрать output]
        KillCmd --> CollectOutput
    end

    ExecuteRead --> Format[Форматировать результат]
    ExecuteWrite --> Format
    CollectOutput --> Format
    Format --> Success([Вернуть tool result])

    ErrUnknown --> FormatErr[Форматировать ошибку]
    ErrOutside --> FormatErr
    ErrOutsideW --> FormatErr
    ErrNotFound --> FormatErr
    ErrTooLarge --> FormatErr
    ErrBlocked --> FormatErr
    FormatErr --> Success

    style Start fill:#c8e6c9
    style Success fill:#c8e6c9
    style ReadTools fill:#e3f2fd
    style WriteTools fill:#fff3e0
    style CommandTools fill:#fce4ec
```

## Действия по инструментам

### Read Tools (sandbox)

#### list_directory
```mermaid
flowchart LR
    A[path] --> B[readdir]
    B --> C[map to items]
    C --> D[JSON array]
```

#### read_text
```mermaid
flowchart LR
    A[path] --> B[check size ≤8KB]
    B --> C[readFile UTF-8]
    C --> D[content string]
```

#### find_files
```mermaid
flowchart LR
    A[pattern] --> B[walkDirectory]
    B --> C[filter matches]
    C --> D[limit 20]
    D --> E[JSON array]
```

#### search_text
```mermaid
flowchart LR
    A[query] --> B[walkDirectory]
    B --> C[grep each file]
    C --> D[collect with context]
    D --> E[limit 20]
    E --> F[JSON array]
```

### Write Tools (workspace)

#### write_file
```mermaid
flowchart LR
    A[path, content] --> B[resolveWorkspace]
    B --> C[mkdir recursive]
    C --> D[writeFile UTF-8]
    D --> E[success message]
```

#### edit_file
```mermaid
flowchart LR
    A[path, old, new] --> B[readFile]
    B --> C{old_text exists?}
    C -->|No| D[Error: not found]
    C -->|Yes| E[replace]
    E --> F[writeFile]
    F --> G[success message]
```

#### run_command
```mermaid
flowchart LR
    A[command] --> B{blacklist?}
    B -->|Yes| C[Error: blocked]
    B -->|No| D[spawn bash]
    D --> E[collect stdout/stderr]
    E --> F[exit_code + output]
```

## Validation Gates

| Gate | Check | Zone | Error |
|------|-------|------|-------|
| Tool name | `name in TOOLS` | all | unknown tool |
| Sandbox path | `realpath.startsWith(sandbox)` | sandbox | path outside sandbox |
| Workspace path | `normalized.startsWith(workspace)` | workspace | path outside workspace |
| File existence | `stat(path)` | read | not found |
| File size | `stat.size <= 8192` | read | file too large |
| Command safety | `!BLOCKED_COMMANDS.includes()` | command | blocked pattern |
| Command timeout | `< 10000ms` | command | killed |
| Output size | `stdout.length <= 4096` | command | truncated |
