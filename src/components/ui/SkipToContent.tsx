"use client";

export default function SkipToContent() {
  return <a href="#main-content" className="skip-link" onClick={(event) => {
    const target = document.querySelector<HTMLElement>("#main-content, main");
    if (!target) return;
    event.preventDefault();
    target.tabIndex = -1;
    target.focus();
    target.scrollIntoView({ block: "start" });
  }}>Skip to main content</a>;
}
