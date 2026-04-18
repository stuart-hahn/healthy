import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";
import { STORAGE_KEY_V1, STORAGE_KEY_V2 } from "./storage/constants";

describe("App", () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY_V1);
    localStorage.removeItem(STORAGE_KEY_V2);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY_V1);
    localStorage.removeItem(STORAGE_KEY_V2);
  });

  it("renders title, presets, exercises, and settings", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /workout tracker/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /presets/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /exercises/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /training settings/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /session history/i })).toBeInTheDocument();
  });
});
