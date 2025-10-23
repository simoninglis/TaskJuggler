import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './tests/setup.js',
    include: ['tests/test-*.spec.js'],
    exclude: ['tests/test-milestones.spec.js', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/js/**/*.js'],
      exclude: [
        'src/js/components/**',
        'src/js/debug-client.js',
        'node_modules/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
