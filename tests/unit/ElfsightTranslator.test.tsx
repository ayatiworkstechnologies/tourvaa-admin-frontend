import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ElfsightTranslator from "@/components/public/ElfsightTranslator";

describe("ElfsightTranslator", () => {
  it("injects the shared mild shadow into the widget shadow root", async () => {
    render(<ElfsightTranslator />);

    const host = document.createElement("div");
    host.className = "es-embed-root eapps-website-translator-test-custom-css-root";
    const shadowRoot = host.attachShadow({ mode: "open" });
    const trigger = document.createElement("div");
    trigger.className = "background__Container-test";
    shadowRoot.append(trigger);
    document.body.append(host);

    await waitFor(() => {
      const style = shadowRoot.getElementById("tourvaa-translator-elevation");
      expect(style?.textContent).toContain("0 2px 7px rgba(15, 23, 42, 0.13)");
    });
  });
});
