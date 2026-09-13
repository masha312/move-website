(() => {
  const root = document.querySelector("[data-workout-editor-demo]");
  if (!root) return;

  const HOLD_DURATION = 1100;
  const RELEASE_THRESHOLD = 0.9;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const activities = [
    ["walking", "images/workout-walking.svg", true],
    ["running", "images/workout-running.svg", true],
    ["strength", "images/workout-lifting.svg", true],
    ["yoga", "images/workout-yoga.svg", true],
    ["cycling", "images/workout-biking.svg", true],
    ["pilates", "images/workout-pilates.svg", true],
    ["swimming", "images/workout-swimming.svg", false],
    ["hiking", "images/workout-hiking.svg", false],
    ["dancing", "images/workout-dancing.svg", false],
    ["climbing", "images/workout-climbing.svg", false],
    ["basketball", "images/workout-basketball.svg", false],
    ["tennis", "images/workout-tennis.svg", false]
  ].map(([name, icon, selected]) => ({ name, icon, selected }));

  const editorView = root.querySelector("[data-workout-editor-view]");
  const completeView = root.querySelector("[data-workout-complete-view]");
  const editorGrid = root.querySelector("[data-workout-editor-grid]");
  const completeGrid = root.querySelector("[data-workout-complete-grid]");
  const editorScroll = root.querySelector("[data-workout-editor-scroll]");
  const doneButton = root.querySelector("[data-workout-editor-done]");
  const editButton = root.querySelector("[data-workout-editor-open]");
  const announcement = root.querySelector("[data-workout-editor-announcement]");

  const sourceStatus = document.querySelector(".demo-status");
  const statusSlot = root.querySelector("[data-workout-editor-status]");
  if (sourceStatus && statusSlot) statusSlot.replaceWith(sourceStatus.cloneNode(true));

  function renderEditor() {
    editorGrid.innerHTML = activities.map((activity) => `
      <button
        class="workout-editor-tile"
        type="button"
        data-editor-workout="${activity.name}"
        aria-pressed="${activity.selected}"
        aria-label="${activity.selected ? "Hide" : "Show"} ${activity.name}"
      >
        <img src="${activity.icon}" alt="" />
        <span>${activity.name}</span>
        <span class="workout-editor-toggle" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
</svg>

        </span>
      </button>
    `).join("");
  }

  function renderCompletionGrid() {
    const selected = activities.filter((activity) => activity.selected);
    completeGrid.innerHTML = selected.map((activity) => `
      <button class="demo-workout" type="button" data-editor-complete-workout="${activity.name}">
        <span class="demo-workout-progress"></span>
        <img src="${activity.icon}" alt="" />
        <span>${activity.name}</span>
      </button>
    `).join("");

    completeGrid.querySelectorAll("[data-editor-complete-workout]").forEach(bindHoldGesture);
  }

  function setEditing(isEditing) {
    if (!isEditing) renderCompletionGrid();

    editorView.classList.toggle("is-active", isEditing);
    completeView.classList.toggle("is-active", !isEditing);
    editorView.setAttribute("aria-hidden", String(!isEditing));
    completeView.setAttribute("aria-hidden", String(isEditing));

    if (navigator.vibrate) navigator.vibrate(8);
    const nextFocus = isEditing ? doneButton : editButton;
    window.setTimeout(() => nextFocus.focus({ preventScroll: true }), reduceMotion.matches ? 0 : 240);
  }

  editorGrid.addEventListener("click", (event) => {
    const tile = event.target.closest("[data-editor-workout]");
    if (!tile) return;

    const activity = activities.find((item) => item.name === tile.dataset.editorWorkout);
    activity.selected = !activity.selected;
    tile.setAttribute("aria-pressed", String(activity.selected));
    tile.setAttribute("aria-label", `${activity.selected ? "Hide" : "Show"} ${activity.name}`);
    announcement.textContent = `${activity.name} ${activity.selected ? "selected" : "unselected"}.`;
    if (navigator.vibrate) navigator.vibrate(8);
  });

  editorScroll.addEventListener("scroll", () => {
    if (editorView.classList.contains("is-header-collapsed")) {
      if (editorScroll.scrollTop < 12) editorView.classList.remove("is-header-collapsed");
    } else if (editorScroll.scrollTop > 42) {
      editorView.classList.add("is-header-collapsed");
    }
  }, { passive: true });

  doneButton.addEventListener("click", () => setEditing(false));
  editButton.addEventListener("click", () => {
    editorScroll.scrollTop = 0;
    editorView.classList.remove("is-header-collapsed");
    setEditing(true);
  });

  function bindHoldGesture(button) {
    let frame = 0;
    let startTime = 0;
    let activePointer = null;
    let completed = false;

    const complete = () => {
      if (completed) return;
      completed = true;
      activePointer = null;
      cancelAnimationFrame(frame);
      button.classList.remove("is-holding");
      button.classList.add("is-complete");
      announcement.textContent = `${button.dataset.editorCompleteWorkout} logged in the demo.`;
      if (navigator.vibrate) navigator.vibrate([32, 80, 16]);
      if (!reduceMotion.matches) burst(button);

      window.setTimeout(() => {
        button.classList.remove("is-complete");
        button.style.setProperty("--hold-progress", "0deg");
        completed = false;
      }, reduceMotion.matches ? 220 : 620);
    };

    const draw = (now) => {
      const progress = Math.min((now - startTime) / HOLD_DURATION, 1);
      button.style.setProperty("--hold-progress", `${progress * 360}deg`);
      if (progress === 1) complete();
      else frame = requestAnimationFrame(draw);
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
      if (!completed && elapsed / HOLD_DURATION >= RELEASE_THRESHOLD) complete();
      else if (!completed) {
        button.classList.remove("is-holding");
        button.style.setProperty("--hold-progress", "0deg");
      }
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

  renderEditor();
})();
