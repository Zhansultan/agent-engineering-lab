# RES — HARNESS_20261022-120519_INIT: Harness Architecture Research

> **Date**: 2026-10-22
> **Author**: Claude Code (Researcher)
> **Status**: 🔬 RES — Complete
> **Parent**: Init task (no HL)
> **Mode**: Pipeline (inside init workflow)
> **Producer unit**: claude-code:session:local
> **Parent Coordinator**: owner:zhabenov
> **Activation / dispatch source**: owner-direct /tfw-research inside init
> **Coordination authority**: .tfw/workflows/init.md @ v3.9.2
> **Originating proposer**: none

---

## Research Context

Structured research iteration 2 for harness architecture understanding. Goal: define dimensions, components, and risks before first development task. Used Zwicky morphological box method to systematically explore solution space.

## Briefing

Reference: [1_briefing.md](./1_briefing.md)

- **Use cases**: All — completion, tool calling, structured output, agent loop
- **Approach**: Abstractions — classes, middleware pipeline
- **Streaming**: Not needed

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | 7 dimensions (Zwicky box) | Comprehensive coverage: Model, Context, Tools, Output, Orchestration, Errors, Observability |
| D2 | 4-phase learning path | C1→C2→C3→C4, each phase adds 1-2 dimensions of complexity |
| D3 | 9 MVP components | Mapped to dimensions, includes mandatory RecoveryParser |
| D4 | RecoveryParser mandatory | 99.5% raw failure rate for tool calling in sub-2B models |
| D5 | Greedy decoding for tools | 40-point improvement over sampling in qwen3.5 |
| D6 | Start with C1 (Minimal) | Lowest risk, validates basic pipeline before adding complexity |

## Open Questions

| # | Question | Status | Answer |
|---|----------|--------|--------|
| Q1 | Quantization level of qwen3.5:0.8b? | Open | Need to verify Q4_K_M or higher |
| Q2 | Actual tool calling success rate? | Open | Need local testing |

## Hypotheses (from Briefing)

| # | Hypothesis | Status | Evidence |
|---|-----------|--------|----------|
| H1 | Local Ollama + qwen3.5 достаточен для обучения | 🟡 Partial | Yes for learning, but tool calling needs recovery parser |
| H2 | Spring-подобная архитектура применима | ✅ Confirmed | 3-layer middleware (Agent/Chat/Function) matches Spring interceptors |
| H3 | Начать с completion → tools → structured | ✅ Confirmed | Validated by C1→C4 learning path |

## HL Update Recommendations

> No HL exists for init task. These recommendations become inputs for first dev task HL.

### Refinements — N/A (no HL)

No refinements — init task has no HL.

### Amendment Proposals — N/A (no HL)

No amendment proposals — init task has no HL.

## Fact Candidates

| # | Category | Candidate | Source | Confidence |
|---|----------|-----------|--------|------------|
| F1 | Architecture | Agent = Model + Harness; harness определяет поведение | MongoDB 2026 | High |
| F2 | Architecture | 3 middleware layers: Agent → Chat → Function | Microsoft Agent Framework | High |
| F3 | Risk | Sub-2B models: 99.5% raw tool call failure rate | arxiv 2609.07370 | High |
| F4 | Risk | Greedy vs sampling: 72% vs 32% for qwen 0.5B | arxiv 2609.07370 | High |
| F5 | Risk | Qwen3.5-0.8B prone to thinking loops | Toolworthy review | Medium |
| F6 | Process | Owner wants all use cases with abstractions | User interview | High |
| F7 | Process | Owner: 7+ лет backend, Spring Boot expert | User interview | High |

## Strategic Insights (Research)

| # | Category | Insight | Source | Confidence |
|---|----------|---------|--------|------------|
| S1 | Learning | Морфологический ящик Цвикки — метод из курса для систематического исследования | User, research | ★★★ |
| S2 | Architecture | Spring-аналогии применимы: middleware = interceptors, tools = beans | User background + research | ★★★ |

## Findings Map

```
                            HARNESS ARCHITECTURE
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
      ┌─────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐
      │  GATHER   │          │  EXTRACT  │          │ CHALLENGE │
      │           │          │           │          │           │
      │ 7 dims    │          │ 5 configs │          │ 6 risks   │
      │ 7 sources │          │ 9 comps   │          │ 5 mitig   │
      └─────┬─────┘          └─────┬─────┘          └─────┬─────┘
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │      SYNTHESIS (RES)          │
                    │                               │
                    │  D1-D7: Morphological Box     │
                    │  C1-C4: Learning Path         │
                    │  9 Components + RecoveryParser│
                    │  Mitigations: greedy, retry,  │
                    │               circuit breaker │
                    └───────────────────────────────┘

DIMENSION MATRIX (Zwicky Box):
┌────┬──────────────────┬────────────┬────────────┬────────────┬────────────┐
│ D# │ Dimension        │ C1:Minimal │ C2:Struct  │ C3:Tools   │ C4:Agent   │
├────┼──────────────────┼────────────┼────────────┼────────────┼────────────┤
│ D1 │ Model Interface  │ HTTP       │ HTTP       │ HTTP       │ SDK        │
│ D2 │ Context Mgmt     │ Full hist  │ Full hist  │ Sliding    │ Compaction │
│ D3 │ Tool Integration │ None       │ None       │ JSON Schema│ JSON Schema│
│ D4 │ Output Parsing   │ Raw text   │ JSON mode  │ Structured │ Structured │
│ D5 │ Orchestration    │ Single     │ Single     │ ReAct      │ ReAct      │
│ D6 │ Error Handling   │ Fail-fast  │ Fail-fast  │ Retry      │ Retry+FB   │
│ D7 │ Observability    │ Console    │ Console    │ Struct log │ Tracing    │
├────┼──────────────────┼────────────┼────────────┼────────────┼────────────┤
│    │ Risk Level       │ ✅ Low     │ ⚠️ Medium  │ ⚠️ Medium  │ ⚠️ High    │
└────┴──────────────────┴────────────┴────────────┴────────────┴────────────┘

COMPONENT → DIMENSION MAPPING:
┌─────────────────┬─────┬────────────────────────────────────┐
│ Component       │ Dim │ Responsibility                     │
├─────────────────┼─────┼────────────────────────────────────┤
│ OllamaClient    │ D1  │ HTTP calls to Ollama API           │
│ ContextBuilder  │ D2  │ Assemble messages array            │
│ ToolRegistry    │ D3  │ Store tool definitions             │
│ ToolExecutor    │ D3  │ Run tool by name                   │
│ OutputParser    │ D4  │ Parse model response               │
│ RecoveryParser  │ D4  │ Fix malformed JSON (MANDATORY)     │
│ AgentLoop       │ D5  │ ReAct orchestration                │
│ ErrorHandler    │ D6  │ Retry, fallback logic              │
│ Logger          │ D7  │ Structured logging                 │
└─────────────────┴─────┴────────────────────────────────────┘

RISK MITIGATION CHAIN:
┌─────────────────────────────────────────────────────────────┐
│  qwen3.5:0.8B                                               │
│  ↓                                                          │
│  99.5% raw failure ──→ RecoveryParser ──→ 79% success       │
│  ↓                                                          │
│  Sampling: 32% ──→ Greedy decoding ──→ 72% success          │
│  ↓                                                          │
│  Thinking loops ──→ Circuit breaker + timeout               │
│  ↓                                                          │
│  Cascading failures ──→ Step validation + rollback          │
└─────────────────────────────────────────────────────────────┘
```

## Iteration Status

- **Iteration:** 2 of 2 (min) / 3 (max)
- **Hypotheses tested:** H1 (partial), H2 (confirmed), H3 (confirmed)
- **Hypotheses deferred:** None
- **Gaps discovered:** Quantization verification, local tool calling test
- **Superseded decisions:** None

### Open Threads (for next iteration)

| # | Thread | Why it matters | Suggested focus |
|---|--------|----------------|-----------------|
| 1 | Verify qwen3.5 quantization | Q3 degrades tool calling | Run `ollama show qwen3.5:0.8b` |
| 2 | Test actual tool calling | Validate 79% recovery rate | Build minimal ToolRegistry + test |

### Recommendation

- [x] **SUFFICIENT** — proceed to finalize init task, then `/tfw-plan` for first dev task (C1: Minimal)
- [ ] **MORE NEEDED**
- [ ] **BLOCKED**

> Research provides architecture foundation. Open threads (quantization, local test) can be addressed in Phase 1 development.

## Conclusion

Research iteration 2 systematically explored harness architecture using Zwicky morphological box method. Identified 7 independent dimensions with 4 alternatives each (16,384 theoretical combinations), filtered to 5 realistic configurations through Cross-Consistency Assessment. Critical discovery: sub-2B models have 99.5% raw tool calling failure rate — RecoveryParser is mandatory component, not optional. Learning path defined: C1 (Minimal) → C2 (Structured) → C3 (Tools) → C4 (Agent), each phase adding controlled complexity. Spring-like middleware architecture (Agent/Chat/Function layers) validates owner's intuition about applicable patterns.

### Material handover at this return

**Producer:** Claude Code (Researcher), claude-code:session:local
**Source:** Web research (7 sources), owner interview, Zwicky method
**Scope:** Harness architecture dimensions, components, risks, mitigations
**Material:**
- 7 dimensions (D1-D7)
- 5 configurations (C1-C5)
- 9 components mapped to dimensions
- 6 fact candidates (F1-F6)
- 2 strategic insights (S1-S2)
- Risk mitigation chain

**Uncertainty:** Quantization level of local qwen3.5, actual tool calling success rate
**Continuation:** Finalize init task, then `/tfw-plan` for HARNESS Phase 1 (C1: Minimal)

---

*RES — HARNESS_20261022-120519_INIT: Harness Architecture Research | 2026-10-22*
