import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement scrollIntoView; several components call it on
// message-thread auto-scroll effects.
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
