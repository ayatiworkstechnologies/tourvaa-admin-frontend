import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import SearchableSelect from "@/components/ui/SearchableSelect";

const OPTIONS = [
  { value: "india", label: "India (IN)" },
  { value: "georgia", label: "Georgia (GE)" },
  { value: "canada", label: "Canada (CA)" },
];

describe("SearchableSelect", () => {
  it("searches the full label and selects Georgia", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SearchableSelect
        value="india"
        onChange={onChange}
        options={OPTIONS}
        placeholder="Select country"
        searchPlaceholder="Search any country or code"
        ariaLabel="Preview country"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Preview country" });
    await user.click(trigger);
    const search = screen.getByRole("textbox", { name: "Search any country or code" });
    await user.type(search, "GE");

    expect(screen.getByRole("option", { name: "Georgia (GE)" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "India (IN)" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "Georgia (GE)" }));
    expect(onChange).toHaveBeenCalledWith("georgia");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("shows an empty result and closes with Escape", async () => {
    const user = userEvent.setup();
    render(
      <SearchableSelect
        value=""
        onChange={() => {}}
        options={OPTIONS}
        placeholder="Select country"
        searchPlaceholder="Search any country or code"
        ariaLabel="Editing country"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Editing country" });
    await user.click(trigger);
    await user.type(screen.getByRole("textbox", { name: "Search any country or code" }), "Atlantis");
    expect(screen.getByRole("status")).toHaveTextContent("No matching options");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
