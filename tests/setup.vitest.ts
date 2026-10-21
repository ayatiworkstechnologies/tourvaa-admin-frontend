import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement scrollIntoView; several components call it on
// message-thread auto-scroll effects.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// jsdom does not provide ResizeObserver. DataTable observes its scroll
// container in real browsers so horizontal controls stay accurate after a
// resize; unit tests only need a standards-shaped no-op implementation.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
