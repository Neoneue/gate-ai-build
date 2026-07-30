# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset over Biome that enforces
code quality through automated formatting and linting.

## Quick Reference

- **Format code**: `npm exec -- ultracite fix`
- **Check for issues**: `npm exec -- ultracite check`
- **Diagnose setup**: `npm exec -- ultracite doctor`

Most issues are auto-fixable. `ultracite fix` applies UNSAFE fixes — review the
diff. The pre-commit hook and the `PostToolUse` hook both run a fix pass, so
formatting rarely needs manual attention.

## When Biome Can't Help

Biome's linter catches the mechanical issues. Spend your attention on:

1. **Business logic correctness** — Biome can't validate your algorithms
2. **Meaningful naming** — descriptive names for functions, variables, types
3. **Architecture decisions** — component structure, data flow, API design
4. **Edge cases** — boundary conditions and error states
5. **User experience** — accessibility, performance, usability
6. **Documentation** — comment complex logic, but prefer self-documenting code
