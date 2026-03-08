import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "node_modules/**",
      ".svelte-kit/**",
      ".vercel/**",
      "playwright-report/**",
      "test-results/**",
      "static/**",
      "supabase/**",
    ],
  },
  {
    files: ["**/*.{js,ts,mjs,cjs}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {},
  },
];
