# project-1: Budget tracker (React + Vite + TypeScript)

Before doing any work, read these using the `brain` MCP server:
1. C:/Repos/second-brain/CLAUDE.md
2. C:/Repos/second-brain/wiki/conventions.md
3. C:/Repos/second-brain/wiki/projects/budget-app/spec.md
4. C:/Repos/second-brain/wiki/projects/budget-app/tasks.md
5. C:/Repos/second-brain/wiki/projects/budget-app/decisions.md

If the `brain` MCP tools are unavailable or can't reach the Brain, stop and tell me. Don't edit Brain files through the shell unless I say so.

## Rules
- Work on a feature branch, never directly on main. Name branches feat/<short-name>.
- Branch each new task off the previous task's branch unless I say otherwise. Tell me which branch you're on before starting.
- Do one task from tasks.md at a time, then stop.
- Commit with a conventional message (feat:, fix:, chore:, docs:).
- Never run git push without asking me first, with one standing exception: in the Brain's "Ship step" (conventions section 1), after a task has "approved, commit" in review.md and is committed, push that task branch, open a pull request to main with `gh pr create` and merge it with `gh pr merge --merge`. Never force-push, never push to main directly, never rewrite history; on any error, stop and tell me. Any other push still needs my ask.
- Don't add dependencies that aren't listed in conventions.md without asking me.
- When a task is done: tick it in tasks.md, record any decision in decisions.md, append to wiki/log.md.