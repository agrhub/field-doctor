import { defineConfig } from 'vitest/config';

/** Security rules tests; run inside the emulators with `npm run test:rules`. */
export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
});
