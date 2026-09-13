(() => {
  const root = document.querySelector("[data-custom-workout-demo]");
  if (!root) return;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  const baseActivities = [
    ["walking", "images/workout-walking.svg"],
    ["running", "images/workout-running.svg"],
    ["strength", "images/workout-lifting.svg"],
    ["yoga", "images/workout-yoga.svg"],
    ["cycling", "images/workout-biking.svg"],
    ["pilates", "images/workout-pilates.svg"]
  ].map(([name, icon]) => ({ name, icon, selected: true, custom: false }));

  const illustrations = [
    ["default", "images/custom-default.svg"],
    ["illustration 1", "images/custom-illustration-1.svg"],
    ["illustration 2", "images/custom-illustration-2.svg"],
    ["illustration 3", "images/custom-illustration-3.svg"],
    ["illustration 4", "images/custom-illustration-4.svg"],
    ["illustration 5", "images/custom-illustration-5.svg"],
    ["illustration 6", "images/custom-illustration-6.svg"]
  ].map(([name, icon]) => ({ name, icon }));

  const activities = [...baseActivities];
  const grid = root.querySelector("[data-custom-workout-grid]");
  const scroll = root.querySelector("[data-custom-workout-scroll]");
  const layer = root.querySelector("[data-custom-workout-layer]");
  const form = root.querySelector("[data-custom-workout-form]");
  const nameInput = root.querySelector("[data-custom-workout-name]");
  const saveButton = root.querySelector("[data-custom-workout-save]");
  const iconGrid = root.querySelector("[data-custom-workout-icons]");
  const announcement = root.querySelector("[data-custom-workout-announcement]");
  let selectedIllustration = 0;

  const sourceStatus = document.querySelector(".demo-status");
  const statusSlot = root.querySelector("[data-custom-workout-status]");
  if (sourceStatus && statusSlot) statusSlot.replaceWith(sourceStatus.cloneNode(true));

  function renderGrid() {
    grid.innerHTML = activities.map((activity, index) => `
      <button
        class="workout-editor-tile"
        type="button"
        data-custom-activity="${index}"
        aria-pressed="${activity.selected}"
        aria-label="${activity.selected ? "Hide" : "Show"} ${escapeHTML(activity.name)}"
      >
        <img src="${activity.icon}" alt="" />
        <span>${escapeHTML(activity.name)}</span>
        <span class="workout-editor-toggle" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m5.5 12.5 4 4 9-10" /></svg>
        </span>
      </button>
    `).join("") + `
      <button class="workout-editor-tile custom-workout-add-tile" type="button" data-custom-workout-open>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
        <span>new workout</span>
      </button>
    `;
  }

  function renderIllustrations() {
    iconGrid.innerHTML = illustrations.map((illustration, index) => `
      <button
        class="custom-workout-icon-choice"
        type="button"
        role="radio"
        data-custom-illustration="${index}"
        aria-checked="${index === selectedIllustration}"
        aria-label="Choose ${illustration.name}"
      >
        <img src="${illustration.icon}" alt="" />
      </button>
    `).join("");
  }

  function openSheet() {
    nameInput.value = "";
    selectedIllustration = 0;
    saveButton.disabled = true;
    renderIllustrations();
    layer.inert = false;
    layer.classList.add("is-open");
    layer.setAttribute("aria-hidden", "false");
  }

  function closeSheet() {
    layer.classList.remove("is-open");
    layer.setAttribute("aria-hidden", "true");
    layer.inert = true;
    grid.querySelector("[data-custom-workout-open]")?.focus({ preventScroll: true });
  }

  grid.addEventListener("click", (event) => {
    if (event.target.closest("[data-custom-workout-open]")) {
      openSheet();
      if (navigator.vibrate) navigator.vibrate(8);
      return;
    }

    const tile = event.target.closest("[data-custom-activity]");
    if (!tile) return;
    const activity = activities[Number(tile.dataset.customActivity)];
    activity.selected = !activity.selected;
    tile.setAttribute("aria-pressed", String(activity.selected));
    tile.setAttribute("aria-label", `${activity.selected ? "Hide" : "Show"} ${activity.name}`);
    announcement.textContent = `${activity.name} ${activity.selected ? "selected" : "unselected"}.`;
    if (navigator.vibrate) navigator.vibrate(8);
  });

  iconGrid.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-custom-illustration]");
    if (!choice) return;
    selectedIllustration = Number(choice.dataset.customIllustration);
    renderIllustrations();
    iconGrid.querySelector(`[data-custom-illustration="${selectedIllustration}"]`)?.focus({ preventScroll: true });
    if (navigator.vibrate) navigator.vibrate(8);
  });

  nameInput.addEventListener("input", () => {
    saveButton.disabled = nameInput.value.trim().length === 0;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;

    activities.push({
      name,
      icon: illustrations[selectedIllustration].icon,
      selected: true,
      custom: true
    });
    renderGrid();
    closeSheet();
    announcement.textContent = `${name} added to your workouts.`;
    if (navigator.vibrate) navigator.vibrate(12);
    requestAnimationFrame(() => scroll.scrollTo({
      top: scroll.scrollHeight,
      behavior: reduceMotion.matches ? "auto" : "smooth"
    }));
  });

  root.querySelectorAll("[data-custom-workout-cancel]")
    .forEach((button) => button.addEventListener("click", closeSheet));

  function escapeHTML(value) {
    const element = document.createElement("span");
    element.textContent = value;
    return element.innerHTML;
  }

  renderGrid();
  renderIllustrations();
})();
