const { overrides } = require('@netlify/eslint-config-node')

module.exports = {
  extends: ['@netlify/eslint-config-node'],
  rules: {
    // For now
    'func-style': 'off',
    // This is compiled, so we can use modern syntax
    'node/no-unsupported-features/es-syntax': 'off',
    // This is a duplicate of `import/no-duplicates` but can handle "import type"
    'no-duplicate-imports': 'off',
    'max-depth': ['error', 4],
    'n/no-missing-import': 'off',
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
        'n/no-unpublished-import': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'n/global-require': 'off',
        'import/no-dynamic-require': 'off',
        'import/no-unresolved': 'off',
        'n/no-unpublished-require': 'off',
        'n/no-missing-require': 'off',
        'n/no-missing-import': 'off',
        'max-lines': 'off',
        complexity: 'off',
        'max-statements': 'off',
        'n/prefer-global/process': 'off',
        'unicorn/filename-case': 'off',
      },
    },
    {
      files: ['plugin/test/**/*'],
      rules: {
        'n/no-unpublished-import': 'off',
        'max-lines': 'off',
        'n/no-unpublished-require': 'off',
        'n/no-missing-require': 'off',
        'n/no-missing-import': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'n/global-require': 'off',
        'n/prefer-global/process': 'off',
      },
    },
  ],
}
