// Native `scrollTo({ behavior: "smooth" })` uses each browser's own default
// easing, which tends to look abrupt (near-linear, or front-loaded) rather
// than the premium ease-out-expo curve the rest of the homepage's motion
// (see .reveal-block in globals.css) is built around. This runs the same
// cubic-bezier(0.16, 1, 0.3, 1) curve by hand via rAF so carousel scrolling
// (autoplay and manual arrows alike) feels consistent with everything else.

// cubic-bezier(0.16, 1, 0.3, 1) approximated as an easing function of t.
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function smoothScrollTo(el: HTMLElement, targetLeft: number, duration = 550) {
  const startLeft = el.scrollLeft;
  const distance = targetLeft - startLeft;
  if (Math.abs(distance) < 1) return;

  const startTime = performance.now();

  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    el.scrollLeft = startLeft + distance * easeOutExpo(progress);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
