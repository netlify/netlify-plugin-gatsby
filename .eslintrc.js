const { overrides } = require('@netlify/eslint-config-node')

module.exports = {
  extends: '@netlify/eslint-config-node',
  rules: {
    // For now
    'func-style': 'off',
    // This is compiled, so we can use modern syntax
    'node/no-unsupported-features/es-syntax': 'off',
    // This is a duplicate of `import/no-duplicates` but can handle "import type"
    'no-duplicate-imports': 'off',
    'max-depth': ['error', 4],
  },
  env: {
    jest: true,
  },
  parserOptions: {
    sourceType: 'module',
  },
  overrides: [
    ...overrides,
    {
      // Tests use lots of nested callbacks
      files: ['*-test.js', '*.spec.js', '**/e2e-tests/*.js'],
      rules: {
        'max-nested-callbacks': 'off',
      },
    },
    {
      // Templates import files from the site itself and needs lots of dynamic requires
      files: ['plugin/src/templates/**/*'],
      rules: {
        'node/no-unpublished-import': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'node/global-require': 'off',
        'import/no-dynamic-require': 'off',
        'import/no-unresolved': 'off',
        'node/no-unpublished-require': 'off',
        'node/no-missing-require': 'off',
        'max-lines': 'off',
        complexity: 'off',
        'max-statements': 'off',
        'node/prefer-global/process': 'off',
        'unicorn/filename-case': 'off',
      },
    },
  ],
}
