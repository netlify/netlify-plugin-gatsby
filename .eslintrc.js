const { overrides } = require('@netlify/eslint-config-node')

module.exports = {
  extends: '@netlify/eslint-config-node',
  // TODO: remove after https://github.com/netlify/eslint-config-node/pull/230 is merged and released
  rules: {
    'node/no-unsupported-features/es-syntax': [
      'error',
      {
        ignores: ['modules'],
      },
    ],
    'func-style': ['error', 'declaration'],
    'import/no-dynamic-require': 'off',
  },
  overrides: [
    ...overrides,
    // TODO: remove after https://github.com/netlify/eslint-config-node/pull/230 is merged and released
    {
      files: ['*.ts'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
      ],
    },
  ],
  settings: {
    // TODO: remove after https://github.com/netlify/eslint-config-node/pull/230 is merged and released
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.d.ts', '.ts', '.tsx'],
      },
      typescript: {
        alwaysTryTypes: true,
      },
    },
    node: {
      tryExtensions: ['.js', '.ts', '.d.ts'],
    },
  },
}
