# Laravel Clean Architecture example

This example intentionally contains Laravel architecture violations so Revos can detect them.

It is not a real Laravel application. It is a small fake project used to demonstrate the Laravel plugin and the `laravel-clean-architecture` preset.

---

## Run

From the repository root:

```bash
pnpm --filter @revoscli/cli dev init examples/laravel-clean-architecture --preset laravel-clean-architecture --force
pnpm --filter @revoscli/cli dev scan examples/laravel-clean-architecture
