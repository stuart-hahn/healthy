import { describe, expect, it } from "vitest";
import { buildAutoCommitMessage } from "./autoCommitMessage";

describe("buildAutoCommitMessage", () => {
  it("uses docs subject when all paths are under docs/", () => {
    const msg = buildAutoCommitMessage([
      { status: "M", path: "docs/context/FOO.md" },
      { status: "A", path: "docs/context/BAR.md" },
    ]);
    expect(msg).toBe("docs: update documentation");
  });

  it("uses test subject when every path looks like a test file", () => {
    const msg = buildAutoCommitMessage([
      { status: "M", path: "src/lib/foo.test.ts" },
      { status: "M", path: "src/storage/bar.test.ts" },
    ]);
    expect(msg).toBe("test: update tests");
  });

  it("uses feat(app) when only src/ and something added", () => {
    const msg = buildAutoCommitMessage([
      { status: "M", path: "src/App.tsx" },
      { status: "A", path: "src/lib/new.ts" },
    ]);
    expect(msg).toBe("feat(app): update application code");
  });

  it("uses chore(app) when only src/ and no adds", () => {
    const msg = buildAutoCommitMessage([{ status: "M", path: "src/App.tsx" }]);
    expect(msg).toBe("chore(app): update application code");
  });

  it("uses mixed chore when areas differ", () => {
    const msg = buildAutoCommitMessage([
      { status: "M", path: "src/App.tsx" },
      { status: "M", path: "docs/context/X.md" },
    ]);
    expect(msg).toBe("chore: sync docs, src");
  });
});
