module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'auth',
        'api',
        'ui',
        'config',
        'deps',
        'tests',
        'ci',
        'security',
        'types',
        'services',
        'components',
      ],
    ],
  },
};



