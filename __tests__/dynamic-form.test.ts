import { describe, expect, it } from "vitest";
import { normalizeDynamicForm } from "@/components/common/DynamicModulePage";

describe("normalizeDynamicForm", () => {
  it("converts boolean and number select values", () => {
    const payload = normalizeDynamicForm(
      [
        { name: "is_active", label: "Status", valueType: "boolean" },
        { name: "role_id", label: "Role", valueType: "number" },
        { name: "name", label: "Name" },
      ],
      {
        is_active: "false",
        role_id: "12",
        name: " Admin ",
      }
    );

    expect(payload).toEqual({
      is_active: false,
      role_id: 12,
      name: "Admin",
    });
  });
});
