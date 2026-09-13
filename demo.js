(() => {
  const HOLD_DURATION = 1100;
  const RELEASE_THRESHOLD = 0.9;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const status = document.querySelector("[data-demo-status]");

  document.querySelectorAll(".demo-workout").forEach((button) => {
    let frame = 0;
    let startTime = 0;
    let activePointer = null;
    let completed = false;

    const draw = (now) => {
      const progress = Math.min((now - startTime) / HOLD_DURATION, 1);
      button.style.setProperty("--hold-progress", `${progress * 360}deg`);

      if (progress === 1) {
        complete();
        return;
      }

      frame = requestAnimationFrame(draw);
    };

    const begin = (event) => {
      if (completed || activePointer !== null) return;
      if (event.type === "pointerdown" && event.button !== 0) return;

      event.preventDefault();
      activePointer = event.pointerId ?? "keyboard";
      if (event.pointerId !== undefined) button.setPointerCapture(event.pointerId);
      startTime = performance.now();
      button.classList.add("is-holding");
      frame = requestAnimationFrame(draw);
    };

    const end = (event) => {
      if (activePointer === null) return;
      if (event?.pointerId !== undefined && event.pointerId !== activePointer) return;

      const elapsed = performance.now() - startTime;
      cancelAnimationFrame(frame);
      activePointer = null;

      if (!completed && elapsed / HOLD_DURATION >= RELEASE_THRESHOLD) {
        complete();
      } else if (!completed) {
        button.classList.remove("is-holding");
        button.style.transition = "transform 160ms var(--ease-out-soft)";
        button.style.setProperty("--hold-progress", "0deg");
      }
    };

    const complete = () => {
      if (completed) return;
      completed = true;
      activePointer = null;
      cancelAnimationFrame(frame);
      button.classList.remove("is-holding");
      button.classList.add("is-complete");
      status.textContent = `${button.dataset.workout} logged in the demo.`;
      window.MoveDemoData?.addWorkout(new Date(2026, 6, 31, 12), button.dataset.workout);
      playCompletionHaptics();
      if (!reduceMotion.matches) burst(button);

      setTimeout(() => {
        button.classList.remove("is-complete");
        button.style.setProperty("--hold-progress", "0deg");
        completed = false;
      }, reduceMotion.matches ? 220 : 620);
    };

    button.addEventListener("pointerdown", begin);
    button.addEventListener("pointerup", end);
    button.addEventListener("pointercancel", end);
    button.addEventListener("lostpointercapture", end);
    button.addEventListener("keydown", (event) => {
      if ((event.key === " " || event.key === "Enter") && !event.repeat) begin(event);
    });
    button.addEventListener("keyup", (event) => {
      if (event.key === " " || event.key === "Enter") end(event);
    });
    button.addEventListener("contextmenu", (event) => event.preventDefault());
  });

  function playCompletionHaptics() {
    if (!("vibrate" in navigator)) return;

    // A stronger success pulse followed by the lighter confirmation tap used
    // by the app. Unsupported browsers safely ignore this feature.
    navigator.vibrate([32, 80, 16]);
  }

  function burst(button) {
    const circleRadius = button.getBoundingClientRect().width / 2;

    for (let index = 0; index < 30; index += 1) {
      const particle = document.createElement("i");
      const angle = (index / 30) * Math.PI * 2 + ((index * 17) % 7 - 3) * 0.025;
      const startDistance = circleRadius - 8 + ((index * 11) % 5 - 2) * 0.45;
      const endDistance = startDistance + 9 + ((index * 13) % 8);
      particle.className = "demo-particle";
      particle.style.setProperty("--particle-start-x", `${Math.cos(angle) * startDistance}px`);
      particle.style.setProperty("--particle-start-y", `${Math.sin(angle) * startDistance}px`);
      particle.style.setProperty("--particle-end-x", `${Math.cos(angle) * endDistance}px`);
      particle.style.setProperty("--particle-end-y", `${Math.sin(angle) * endDistance}px`);
      particle.style.setProperty("--particle-size", `${1.5 + ((index * 7) % 5) * 0.35}px`);
      particle.style.setProperty("--particle-opacity", `${0.52 + ((index * 3) % 7) * 0.055}`);
      button.append(particle);
      particle.addEventListener("animationend", () => particle.remove(), { once: true });
    }
  }
})();
