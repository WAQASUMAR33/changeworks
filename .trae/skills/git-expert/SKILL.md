---
name: "git-expert"
description: "Handles complex Git operations, resolves merge conflicts, analyzes history, and manages branches. Invoke when user needs help with Git commands or version control issues."
---

# Git Expert

This skill provides advanced Git assistance, helping users manage their version control workflow effectively and safely.

## Capabilities

1.  **Complex Operations**: Handling rebase, cherry-pick, reset, and revert operations safely.
2.  **Conflict Resolution**: Assisting in identifying and resolving merge conflicts.
3.  **History Analysis**: searching logs, finding regressions (bisect), and analyzing blame.
4.  **Branch Management**: Cleaning up old branches, managing feature branches, and syncing with remotes.
5.  **Best Practices**: Enforcing commit message standards and clean history.

## Usage Guidelines

-   **Safety First**: Before performing destructive operations (reset hard, rebase), always ensure the working directory is clean or changes are stashed.
-   **Context Awareness**: Use `git status` and `git log` frequently to understand the current state before advising commands.
-   **Explanation**: Always explain what a complex command will do before running it.

## Common Workflows

### Resolving Conflicts
1.  Check status: `git status`
2.  Identify conflicting files.
3.  Use `git diff` to see the conflicts.
4.  After editing, use `git add` to mark resolved.
5.  Continue operation: `git rebase --continue` or `git merge --continue`.

### Undoing Changes
-   Discard local changes: `git checkout -- <file>` or `git restore <file>`
-   Unstage files: `git reset HEAD <file>` or `git restore --staged <file>`
-   Undo last commit (keep changes): `git reset --soft HEAD~1`
-   Undo last commit (discard changes): `git reset --hard HEAD~1` (Warn user!)

### Log Analysis
-   Compact graph: `git log --oneline --graph --all --decorate`
-   Search changes: `git log -S "search_string"`

## Instructions for the Assistant

When this skill is invoked:
1.  Assess the user's Git state immediately if not known.
2.  If the user asks for a specific complex command, verify the safety of that command in the current context.
3.  Provide clear, step-by-step commands.
4.  If a command fails, analyze the error message and suggest a specific fix.
