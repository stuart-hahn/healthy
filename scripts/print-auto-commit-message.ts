/**
 * Prints one-line commit subject for staged changes (used by husky pre-push).
 * Run: npx tsx scripts/print-auto-commit-message.ts
 */
import { execSync } from "node:child_process";
import { buildAutoCommitMessage, parseGitNameStatus } from "../src/lib/git/autoCommitMessage";

try {
  const raw = execSync("git diff --cached --name-status", {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const entries = parseGitNameStatus(raw);
  process.stdout.write(`${buildAutoCommitMessage(entries)}\n`);
} catch (e) {
  console.error("print-auto-commit-message: failed to read git index", e);
  process.exit(1);
}
