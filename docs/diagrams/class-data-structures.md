# Class Diagram: Data Structures

## Ollama API Structures

```mermaid
classDiagram
    class ChatRequest {
        +string model
        +Message[] messages
        +Tool[] tools
        +boolean stream
        +Options options
    }

    class Message {
        +string role
        +string content
        +ToolCall[] tool_calls
    }

    class ToolCall {
        +string id
        +string type
        +FunctionCall function
    }

    class FunctionCall {
        +string name
        +string arguments
    }

    class Tool {
        +string type
        +FunctionDef function
    }

    class FunctionDef {
        +string name
        +string description
        +JSONSchema parameters
    }

    class ChatResponse {
        +string model
        +Message message
        +boolean done
        +string done_reason
    }

    class ToolResult {
        +string role
        +string tool_name
        +string content
    }

    ChatRequest "1" --> "*" Message
    ChatRequest "1" --> "*" Tool
    Message "1" --> "*" ToolCall
    ToolCall "1" --> "1" FunctionCall
    Tool "1" --> "1" FunctionDef
    ChatResponse "1" --> "1" Message
```

## Tool Definitions

### Read Tools (sandbox)
```mermaid
classDiagram
    class ListDirectoryArgs {
        +string path
    }

    class ReadTextArgs {
        +string path
    }

    class FindFilesArgs {
        +string pattern
    }

    class SearchTextArgs {
        +string query
    }

    class DirectoryListing {
        +string path
        +Item[] items
    }

    class FileContent {
        +string path
        +string content
    }

    class SearchMatch {
        +string file
        +int line
        +string context
    }
```

### Write Tools (workspace)
```mermaid
classDiagram
    class WriteFileArgs {
        +string path
        +string content
    }

    class EditFileArgs {
        +string path
        +string old_text
        +string new_text
    }

    class ListWorkspaceArgs {
        +string path
    }

    class ReadWorkspaceArgs {
        +string path
    }

    class RunCommandArgs {
        +string command
    }

    class WriteResult {
        +string path
        +int size
        +string message
    }

    class EditResult {
        +string path
        +boolean replaced
        +string message
    }

    class CommandResult {
        +string command
        +int exit_code
        +string stdout
        +string stderr
        +int duration_ms
        +boolean killed
    }
```

## Internal Structures

```mermaid
classDiagram
    class HarnessContext {
        +Message[] messages
        +Tool[] tools
        +int turn
        +int maxTurns
        +boolean mock
    }

    class ExecutorConfig {
        +string sandboxRoot
        +string workspaceRoot
        +int maxFileSize
        +int maxResults
        +int maxCommandTimeout
        +int maxOutputSize
        +string[] blockedCommands
    }

    class ParsedResponse {
        +string type
        +string content
        +ToolCall tool_call
        +boolean mock
        +string error
    }

    class RecoveryResult {
        +boolean success
        +object parsed
        +string error
    }

    HarnessContext --> Message
    HarnessContext --> Tool
```

## Security Constants

```mermaid
classDiagram
    class SecurityLimits {
        +MAX_FILE_SIZE: 8192
        +MAX_SEARCH_RESULTS: 20
        +MAX_COMMAND_TIMEOUT: 10000
        +MAX_OUTPUT_SIZE: 4096
        +MAX_TURNS: 10
    }

    class BlockedCommands {
        +rm_rf_root: "rm -rf /"
        +rm_rf_home: "rm -rf ~"
        +sudo: "sudo"
        +su: "su "
        +chmod_777: "chmod 777"
        +mkfs: "mkfs"
        +dd: "dd if="
        +fork_bomb: ":(){"
        +dev_write: "> /dev/sd"
        +curl_pipe: "curl | sh"
        +wget_pipe: "wget | sh"
    }
```

## JSON Schema Examples

### Tool Definition
```json
{
  "type": "function",
  "function": {
    "name": "list_directory",
    "description": "List files in a directory",
    "parameters": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string",
          "description": "Directory path"
        }
      },
      "required": ["path"]
    }
  }
}
```

### Tool Result
```json
{
  "role": "tool",
  "tool_name": "list_directory",
  "content": "{\"path\": \".\", \"items\": [\"file1.txt\", \"file2.txt\"]}"
}
```
