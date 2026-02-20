# Codex Agents and Skills Registry

This file indexes custom agents and skills stored in this repository.

## Agents
- ArchitectureAgent: Enforces TestApp architecture layering and responsibilities.
  - Path: .codex/skills/architecture/SKILL.md
- EvenAgent: Domain knowledge for EvenHub (SDK, Simulator, CLI, navigation rules, event mapping).
  - Path: .codex/skills/even_agent/SKILL.md

## Skills
- architecture: Same as ArchitectureAgent (kept under skills for reuse).
  - Path: .codex/skills/architecture/SKILL.md
- even_agent: Same as EvenAgent (kept under skills for reuse).
  - Path: .codex/skills/even_agent/SKILL.md

## Conventions
- Each agent/skill lives in its own folder under `.codex/skills/<name>/`.
- The canonical entry file is `SKILL.md`.
