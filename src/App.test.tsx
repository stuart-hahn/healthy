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

  it("renders title and exercise section", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /workout tracker/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /exercises/i })).toBeInTheDocument();
  });
});
