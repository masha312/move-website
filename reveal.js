(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const show = (el) => el.classList.add("is-inview");

  if (reduce) {
    document.querySelectorAll(".panel, .legal-page").forEach(show);
    return;
  }

  const panels = document.querySelectorAll(".panel");
  if (panels.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    panels.forEach((panel) => observer.observe(panel));
  }

  const legal = document.querySelector(".legal-page");
  if (legal) {
    requestAnimationFrame(() => show(legal));
  }
})();
