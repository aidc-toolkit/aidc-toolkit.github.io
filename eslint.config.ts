import { esLintConfigAIDCToolkit } from "@aidc-toolkit/dev";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        ignores: [".vitepress/cache", ".vitepress/dist", "site"]
    },
    ...esLintConfigAIDCToolkit
]);
