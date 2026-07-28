# Contributing Guidelines & Governance

## Branch & Pull Request Rules
- Direct pushes to `main` or `production` branches are strictly prohibited.
- All code enhancements, bug fixes, or modifications must be submitted via Pull Requests (PRs).
- Before merging, 1 mandatory review approval from a `SUPER_ADMIN` is required.

## Technical Coding Standards
- Work in phases: perform research, outline plans, and execute step-by-step.
- Verify security compliance using `python manage.py check --deploy` before any production updates.
- Ensure all automated unit tests (`python manage.py test`) pass cleanly.
