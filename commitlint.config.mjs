export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "chore",
        "docs",
        "test",
        "refactor",
        "ci",
        "build",
        "perf",
        "style",
        "revert",
      ],
    ],
    "subject-case": [0],
    "body-max-line-length": [0],
  },
};
