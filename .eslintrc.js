module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect', // Tells eslint-plugin-react to automatically detect the version of React to use
    },
  },
  plugins: ['simple-import-sort', 'baseui', 'prettier', '@typescript-eslint', 'react'],
  extends: [
    'plugin:react/recommended', // Uses the recommended rules from @eslint-plugin-react
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:baseui/recommended',
    'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  rules: {
    indent: 'off', // leave this to prettier
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { vars: 'all', args: 'none', varsIgnorePattern: '_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    'baseui/deprecated-theme-api': 'warn',
    'baseui/deprecated-component-api': 'warn',
    'prefer-const': 'off',
    'baseui/no-deep-imports': 'warn',
    'simple-import-sort/sort': 'error', // sort imports
    'sort-imports': 'off', // turn off to avoid conflicts with simple-import-sort
    'import/order': 'off', // turn off to avoid conflicts with simple-import-sort
    'react/prop-types': 'off',
    'react/display-name': 'off',
  },
};
