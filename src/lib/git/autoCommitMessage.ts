/**
 * Deterministic Conventional-Commits-style subject for automated pre-push commits.
 * Heuristic from staged paths only (no AI). Subject capped at 72 chars.
 */

export const MAX_AUTO_COMMIT_SUBJECT_LENGTH = 72;

export type GitIndexEntry = {
  status: string;
  path: string;
};

function isTestPath(p: string): boolean {
  return p.includes(".test.") || p.includes(".spec.") || p.includes("__tests__");
}

function isToolingPath(p: string): boolean {
  return (
    p.startsWith(".cursor/") ||
    p.startsWith("skills/") ||
    p.startsWith("scripts/") ||
    p.startsWith(".github/") ||
    p === ".gitignore" ||
    p === "package.json" ||
    p === "package-lock.json" ||
    p.endsWith("hooks.json")
  );
}

export function parseGitNameStatus(raw: string): GitIndexEntry[] {
  const out: GitIndexEntry[] = [];
  const lines = raw.trim().split("\n").filter(Boolean);
  for (const line of lines) {
    const tab = line.indexOf("\t");
    if (tab === -1) continue;
    const statusField = line.slice(0, tab).trim();
    let pathField = line.slice(tab + 1).trim();
    const status = statusField.charAt(0);
    if (status === "R") {
      const parts = pathField.split("\t");
      pathField = parts[parts.length - 1] ?? pathField;
    }
    if (pathField) out.push({ status, path: pathField });
  }
  return out;
}

export function buildAutoCommitMessage(entries: GitIndexEntry[]): string {
  if (entries.length === 0) {
    return "chore: empty commit";
  }

  const paths = entries.map((e) => e.path);
  const hasStatus = (s: string) => entries.some((e) => e.status === s);
  const anyAdded = hasStatus("A");

  const allDocs = paths.every((p) => p.startsWith("docs/"));
  const allTest = paths.every(isTestPath);
  const allTooling = paths.every(isToolingPath);
  const allSrc = paths.every((p) => p.startsWith("src/"));

  const nSrc = paths.filter((p) => p.startsWith("src/")).length;
  const nDocs = paths.filter((p) => p.startsWith("docs/")).length;
  const nCursor = paths.filter((p) => p.startsWith(".cursor/")).length;
  const nSkills = paths.filter((p) => p.startsWith("skills/")).length;
  const nScripts = paths.filter((p) => p.startsWith("scripts/")).length;
  const nGithub = paths.filter((p) => p.startsWith(".github/")).length;

  let subject: string;

  if (allDocs) {
    subject = "docs: update documentation";
  } else if (allTest) {
    subject = "test: update tests";
  } else if (allTooling) {
    subject = "chore(dev): update repo tooling";
  } else if (allSrc) {
    subject = anyAdded
      ? "feat(app): update application code"
      : "chore(app): update application code";
  } else {
    const areas = new Set<string>();
    if (nSrc) areas.add("src");
    if (nDocs) areas.add("docs");
    if (paths.some(isTestPath)) areas.add("tests");
    if (nCursor || nSkills || nScripts || nGithub) areas.add("tooling");
    const label = [...areas].sort().join(", ");
    subject = `chore: sync ${label}`;
  }

  if (subject.length > MAX_AUTO_COMMIT_SUBJECT_LENGTH) {
    subject = `${subject.slice(0, MAX_AUTO_COMMIT_SUBJECT_LENGTH - 1)}…`;
  }
  return subject;
}
