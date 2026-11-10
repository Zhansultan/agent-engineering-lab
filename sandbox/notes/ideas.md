# Ideas

## Future Features

### Phase B Ideas
- History persistence
- Session management
- Structured logging with levels

### Phase C Ideas
- Multiple tool support
- Parallel tool execution
- Tool result caching

## Architecture Notes

The harness follows a simple pipeline:
1. Context Builder - assembles messages
2. Client - sends HTTP requests
3. Parser - extracts responses
4. Executor - runs tools

## Questions

- Should we add WebSocket for streaming?
- How to handle tool timeouts?
- What's the maximum context size?
