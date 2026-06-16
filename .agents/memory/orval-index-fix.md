---
name: Orval codegen index.ts collision fix
description: Orval always regenerates lib/api-zod/src/index.ts with both api and types exports; the fix is a post-codegen patch in the codegen script.
---

## The Rule
After running Orval with `client: "zod"` and `mode: "split"`, Orval overwrites `lib/api-zod/src/index.ts` and adds `export * from './generated/types'` even when the `schemas` option is removed from the config. This causes TS2308 name collisions if both api and types export the same names.

## The Fix
In `lib/api-spec/package.json`, the codegen script patches the index.ts immediately after Orval runs:
```json
"codegen": "orval --config ./orval.config.ts && printf 'export * from \"./generated/api\";\\n' > ../api-zod/src/index.ts && pnpm -w run typecheck:libs"
```

**Why:** Orval's generated index.ts is not configurable for this case; patching after the fact is the only reliable solution.

**How to apply:** Always run `pnpm --filter @workspace/api-spec run codegen` (not raw `orval`) so the patch runs automatically.
