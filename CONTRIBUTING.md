# Contributing to Solar System 3D

Thank you for your interest in contributing! This guide covers everything you need to submit a good pull request.

---

## Development Setup

```bash
git clone https://github.com/kuldeepcodes/solar-system-3d.git
cd solar-system-3d
nvm use          # switches to Node 22 via .nvmrc
npm install
npm run dev      # dev server at http://localhost:5173
```

Optionally download planet textures (the app works without them via procedural fallback):

```bash
npm run textures
```

---

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<short-description>` | `feat/comet-catalogue` |
| Bug fix | `fix/<short-description>` | `fix/moon-node-regression` |
| Documentation | `docs/<short-description>` | `docs/architecture-diagram` |
| Refactor | `refactor/<short-description>` | `refactor/orbital-solver` |
| Chore | `chore/<short-description>` | `chore/update-dependencies` |

Branch off `main` and target `main` with your PR.

---

## Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <short summary>

<optional body>

<optional footer>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`

**Examples:**

```
feat(eclipses): add penumbra shader to lunar eclipse demo
fix(orbital): correct Moon periapsis precession sign
docs(architecture): add mermaid data-flow diagram
```

Keep the subject line under 72 characters. Use the body to explain *why*, not *what*.

---

## Before Pushing

Run all three checks locally — CI will run them too, but catching failures before push saves time:

```bash
npm run lint       # oxlint — must pass with zero errors
npm run typecheck  # tsc -b --noEmit — must produce no type errors
npm test -- --run  # vitest single pass — all tests must pass
```

If you changed the build configuration or Vite config, also verify:

```bash
npm run build      # must complete without errors
```

---

## Pull Request Requirements

- **All CI checks must pass** before a PR can be merged. The CI workflow runs lint, typecheck, tests, and build.
- **Scope your PR to one concern.** Separate refactors, feature additions, and bug fixes into separate PRs.
- **Do not modify `src/` files if your PR is not a source-code change.** Documentation, workflow, and configuration PRs should stay in their respective directories.
- **Update documentation** in `docs/` if your change affects documented behaviour (features, controls, architecture, data sources).
- **Write or update tests** for any new logic in `src/lib/` or `src/state/`.

---

## Questions

Open a [GitHub Discussion](https://github.com/kuldeepcodes/solar-system-3d/discussions) for questions, ideas, or feedback. Use [GitHub Issues](https://github.com/kuldeepcodes/solar-system-3d/issues) for confirmed bugs.
