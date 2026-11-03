# Agent Engineering Lab - Claude Code Rules

## Project Identity
- Name: agent-engineering-lab
- Stack: Node.js, Ollama, JavaScript/TypeScript
- Owner: Жансултан Абенов (@zhabenov), Innoforce

## Session Start
Read `.user_preferences.md` if it exists. It contains owner's collaboration preferences.

## Mandatory Rules
1. **No sycophancy**: Be direct, precise, concrete.
2. **No placeholders**: Provide complete working code/config.
3. **Language**: Reply in Russian (project content language).
4. **TFW task discipline**: Follow `.tfw/workflows/` for every task.
5. **Critical mindset**: Question assumptions, flag risks.
6. **Tutorial mode**: Provide detailed explanations of TFW concepts.

<!-- TFW:CLAUDE:START -->
## TFW (Trace-First Workflow)

This project follows Trace-First Workflow. The tool-agnostic core lives in `.tfw/`.
Version: see `.tfw/VERSION`.

**Working material and comments.** Keep raw output, logs, exports, screenshots and scratch
scripts in the system temporary directory under `tfw/<task or record ID>/`, never in the project,
and remove them when your work ends. A comment exists only when it carries value for its file's
reader or a program reads it, never as a note to agents, deferred work, history or an excuse.

### Command Routing

Root instructions are already active; do not reload them. For `/tfw-*`, open the matching
`.claude/commands/tfw-*.md` copy and its canonical workflow completely. The workflow's Read
Contract selects task state, addressed shared ranges, templates, and knowledge inputs.

### Slash Commands

| Command | Workflow | Role | Purpose |
|---------|----------|------|---------|
| `/tfw-plan` | `.tfw/workflows/plan.md` | Coordinator | Research, write HL, freeze the contract, RESEARCH gate, route amendments, write TS |
| `/tfw-research` | `.tfw/workflows/research/base.md` | Researcher | Structured investigation - pipeline or standalone |
| `/tfw-handoff` | `.tfw/workflows/handoff.md` | Executor | ONB, implement, RF |
| `/tfw-review` | `.tfw/workflows/review.md` | Reviewer | Review RF against checklist, Purpose Check against the contract baseline, write REVIEW |
| `/tfw-docs` | `.tfw/workflows/docs.md` | Coordinator | Update KNOWLEDGE.md after REVIEW |
| `/tfw-knowledge` | `.tfw/workflows/knowledge.md` | Coordinator | Consolidate fact candidates into verified project knowledge |
| `/tfw-release` | `.tfw/workflows/release.md` | Coordinator | Version bump, CHANGELOG, tag |
| `/tfw-init` | `.tfw/workflows/init.md` | Coordinator | Initialize TFW in a project - discover, interview, setup |
| `/tfw-economics` | `.tfw/workflows/economics.md` | Coordinator | Analyze sourced economics; retain active Role Lock |
| `/tfw-update` | `.tfw/workflows/update.md` | Coordinator | Fetch upstream, compare versions, sync adapters |
| `/tfw-config` | `.tfw/workflows/config.md` | Coordinator | Interactive config change, propagate to all inline values |

### Discovery References (not preload)

- `.tfw/README.md` - philosophy, thesis, lifecycle
- `.tfw/conventions.md` - all formal rules
- `.tfw/glossary.md` - terminology definitions
- `.tfw/templates/` - canonical artifact templates
- `.tfw/CHANGELOG.md` - version history
- `.tfw/project_config.yaml` - project parameters
<!-- TFW:CLAUDE:END -->

## Code Standards

- Use ES modules (`.mjs` extension)
- Prefer async/await over callbacks
- Document harness components with JSDoc
- Test with preflight-v2.mjs patterns
