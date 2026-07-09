import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Provide the minimum valid env so config/env.ts passes validation when
    // pure-logic modules (which transitively import it) are loaded in tests.
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret-at-least-16-chars-long',
      DATABASE_URL: 'postgres://financeai:financeai@localhost:5432/financeai_test',
    },
    include: ['tests/**/*.test.ts'],
  },
});
