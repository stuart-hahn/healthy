import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    expect(screen.getByRole("heading", { name: /preset browser/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /exercises/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /training settings/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /session history/i })).toBeInTheDocument();
  });

  it("after save, post-save summary shows next-session hint and history actions", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText(/e\.g\. bench press/i), "Squat");
    await user.click(screen.getByRole("button", { name: /^add exercise$/i }));

    const logSection = screen.getByRole("heading", { name: /^log session$/i }).closest("section");
    expect(logSection).toBeTruthy();
    const exerciseSelect = within(logSection as HTMLElement).getByRole("combobox", {
      name: /^exercise$/i,
    });
    await user.selectOptions(exerciseSelect, "Squat");

    await user.type(screen.getByLabelText(/exercise 1 set 1 weight/i), "100");
    await user.type(screen.getByLabelText(/exercise 1 set 1 reps/i), "5");

    await user.click(screen.getByRole("button", { name: /^save session$/i }));

    expect(screen.getByRole("heading", { name: /session saved/i })).toBeInTheDocument();
    expect(screen.getByText(/try 105/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open in session history/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lift history & trends/i })).toBeInTheDocument();
  });
});
