import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // External worktrees and harness working dirs: not part of this repo build.
    ".kilo/**",
    ".agents/**",
    ".sauron/**",
    // Vendored Bklit registry code (has its own biome config upstream).
    // Reviewed on install; our stricter rules don't apply to it.
    "components/charts/**",
    "components/shimmering-text.tsx",
    // Vendored KokonutUI registry code, adapted on install to honour the
    // reduced-motion and server-rendering contracts. See each file's header.
    "components/kokonutui/**",
  ]),
]);

export default eslintConfig;
