module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    jest: true, // eslint will recognize describe, test, etc...
  },
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
    'no-console': 'off',
    'consistent-return': 'off',
    'no-underscore-dangle': ['error', { allow: ['_id', '_doc'] }],
    'import/no-extraneous-dependencies': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
    quotes: [2, 'single'],
  },
};
