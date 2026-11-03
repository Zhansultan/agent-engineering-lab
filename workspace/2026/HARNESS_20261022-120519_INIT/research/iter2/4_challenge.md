# Challenge — "What do we NOT expect?"

> **Mindset:** Critic. Attack the configurations. Every survivor needs evidence.
> **Parent:** [HARNESS_20261022-120519_INIT](../../status.md)
> **Goal:** Validate harness architecture against real-world constraints

## Consistency Check (Pairwise CCA)

### Incompatible pairs:

| Dimension A | Alternative | Dimension B | Alternative | Why incompatible |
|-------------|-------------|-------------|-------------|------------------|
| D3: Tools | JSON Schema | D1: Model | Streaming | Tool calls need complete JSON, streaming fragments it |
| D5: Orchestration | Multi-agent | D2: Context | Full history | Memory explosion with multiple agents |
| D5: Orchestration | ReAct loop | D3: Tools | None | ReAct requires tools to act |
| D6: Errors | Fail-fast | D5: Orch | Multi-agent | Cascade failures kill entire system |
| D4: Output | Structured | D1: Model | Streaming | Schema validation needs complete output |
| D7: Observability | None | D5: Orch | Multi-agent | Impossible to debug without logs |

### Surviving configurations:

| Config | D1 | D2 | D3 | D4 | D5 | D6 | D7 | Risk Level |
|--------|----|----|----|----|----|----|----|----|
| **C1: Minimal** | HTTP | Full | None | Raw | Single | Fail-fast | Console | ✅ Low |
| **C2: Structured** | HTTP | Full | None | JSON | Single | Fail-fast | Console | ⚠️ Medium |
| **C3: Tools** | HTTP | Sliding | JSON | Struct | ReAct | Retry | Struct logs | ⚠️ Medium |
| **C4: Agent** | SDK | Compact | JSON | Struct | ReAct | Retry+FB | Tracing | ⚠️ High |

### Unexpected survivors:
- **C2 (Structured)** survives but with medium risk — qwen3.5:0.8b has 99.5% raw JSON failure rate without recovery parser

## Findings

### C1: CRITICAL — qwen3.5:0.8B Tool Calling Reliability

**Benchmark data (2026):**
- Sub-2B models: **99.5% raw failure rate** for tool calls
- Qwen2.5-0.5B: 72% success with greedy, **32% with sampling**
- Only 5/1000 raw outputs are directly parseable as JSON

**Root cause:** Models below 7B without explicit tool-call training emit malformed JSON.

**Mitigation required:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Model     │────→│  Recovery   │────→│   Parsed    │
│   Output    │     │   Parser    │     │   Result    │
└─────────────┘     └─────────────┘     └─────────────┘
        │                  │
        │    99.5% fail    │    79% recovered
        └──────────────────┘
```

**Recommendation:** Recovery parser is MANDATORY for D3: Tools and D4: Structured.

Source: [Sub-2B Tool Calling Benchmark](https://pith.science/paper/2609.07370)

### C2: Thinking Loops in 0.8B

Qwen3.5-0.8B prone to **thinking loops** — model enters infinite reasoning without action.

**Mitigation:**
- Tune sampling: lower temperature, use greedy decoding
- Add guardrails: max iterations, timeout
- Maps to **D6: Error Handling** — Retry alone insufficient, need circuit breaker

Source: [Qwen3.5 Small Series Review](https://www.toolworthy.ai/tool/qwen-3-5-small-series)

### C3: Cascading Failures in Multi-Step

Small errors in early steps → **cascading failures** in multi-step workflows.

**Impact on D5: Orchestration:**
- ReAct loop amplifies errors (each iteration builds on previous)
- Agent loop (C4) highest risk

**Mitigation:**
- Validate each step output before proceeding
- Add checkpoints / rollback capability
- Maps to **D6: Retry + Fallback** pattern

Source: [Alibaba Qwen Benchmarks](https://innfactory.ai/en/ai-models/qwen/)

### C4: Quantization Floor

**Q4_K_M is production floor** for tool calling.
Q3 and below degrade tool-call reliability before chat quality.

**Our model:** qwen3.5:0.8b — need to verify quantization level.

```bash
ollama show qwen3.5:0.8b --modelfile
```

Source: [Best Local Models Tool Calling 2026](https://www.promptquorum.com/power-local-llm/best-local-models-tool-calling-2026)

### C5: Greedy vs Sampling

| Decoding | Qwen 0.5B Success |
|----------|-------------------|
| Greedy | 72% |
| Sampling | 32% |

**40-point drop with sampling!**

**Recommendation:** Use `temperature: 0` or very low for tool calling tasks.

Source: [Sub-2B Benchmark](https://pith.science/paper/2609.07370)

## Risk Matrix (Updated)

| Config | Original Risk | After Mitigations | Required Mitigations |
|--------|---------------|-------------------|----------------------|
| C1: Minimal | Low | ✅ Low | None |
| C2: Structured | Medium | ⚠️ Low-Medium | Recovery parser, greedy decoding |
| C3: Tools | Medium | ⚠️ Medium | Recovery parser, step validation, retry |
| C4: Agent | High | ⚠️ Medium-High | All above + circuit breaker + tracing |

## Architecture Update: Recovery Parser Component

Add to MVP components:

| # | Component | Dimension | Responsibility |
|---|-----------|-----------|----------------|
| 9 | **RecoveryParser** | D4 Output | Fix malformed JSON, extract tool calls from prose |

```
OutputParser (D4)
      │
      ├── Direct parse (5% success)
      │
      └── RecoveryParser
            ├── Regex extraction
            ├── Partial JSON repair
            └── LLM retry with stricter prompt
```

## Checkpoint

| Found | Remaining |
|-------|-----------|
| 99.5% raw tool call failure rate | Verify qwen3.5 quantization |
| Recovery parser mandatory | Test actual tool calling locally |
| Greedy decoding required | — |
| Thinking loops risk | — |
| Cascading failure risk | — |

**Sufficiency:**
- [x] External source used? (4 sources)
- [x] Briefing gap closed?
- [x] Pairwise incompatibility checked? Surviving configurations listed?

Stage complete: YES
→ User decision: proceed to Synthesis (RES)
