(() => {
  const root = document.querySelector("[data-calendar-demo]");
  if (!root) return;

  const data = window.MoveDemoData;
  const activities = data.activities;

  const days = Array.from({ length: 31 }, (_, index) => {
    const day = 31 - index;
    return {
      day,
      expanded: day === 30,
      note: day === 27 ? "easy session before breakfast" : "",
      workouts: []
    };
  });

  const daysElement = root.querySelector("[data-calendar-days]");
  const scrollElement = root.querySelector("[data-calendar-scroll]");
  const workoutLayer = root.querySelector("[data-calendar-sheet-layer]");
  const noteLayer = root.querySelector("[data-note-sheet-layer]");
  const picker = root.querySelector("[data-calendar-workout-picker]");
  const noteInput = root.querySelector("[data-note-input]");
  const noteSave = root.querySelector("[data-note-save]");
  let activeDay = null;
  let initialNote = "";
  let sheetSelections = new Set();

  const sourceStatus = document.querySelector(".demo-status");
  const statusSlot = root.querySelector("[data-calendar-status]");
  if (sourceStatus && statusSlot) statusSlot.replaceWith(sourceStatus.cloneNode(true));

  const activityFor = (name) => activities.find((activity) => activity.name === name);
  const dateFor = (day) => new Date(2026, 6, day);
  const shortWeekday = (day) => new Intl.DateTimeFormat("en-US", { weekday: "short" })
    .format(dateFor(day)).toLowerCase();
  const longDate = (day) => new Intl.DateTimeFormat("en-US", {
    weekday: "long", month: "long", day: "numeric"
  }).format(dateFor(day)).toLowerCase();

  function syncWorkouts() {
    days.forEach((item) => {
      item.workouts = data.eventsForDay(dateFor(item.day)).map((event) => event.activity);
    });
    renderDays();
  }

  function renderDays() {
    daysElement.innerHTML = days.map((item) => {
      const previews = item.workouts.slice(0, 3).map((name, index) => {
        if (index === 2 && item.workouts.length > 3) {
          return `<span class="calendar-preview-icon">+${item.workouts.length - 2}</span>`;
        }
        const activity = activityFor(name);
        return `<span class="calendar-preview-icon"><img src="${activity.icon}" alt="" /></span>`;
      }).join("");

      const rows = item.workouts.map((name) => {
        const activity = activityFor(name);
        return `<div class="calendar-workout-row"><span class="calendar-workout-icon"><img src="${activity.icon}" alt="" /></span><span>${name}</span></div>`;
      }).join("");

      return `
        <article class="calendar-day${item.expanded ? " is-expanded" : ""}" data-calendar-day="${item.day}">
          <button class="calendar-day-summary" type="button" aria-expanded="${item.expanded}">
            <span class="calendar-day-number"><strong>${item.day}</strong><small>${shortWeekday(item.day)}</small></span>
            <span class="calendar-preview-icons">${previews}</span>
            <span class="calendar-chevron">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </span>
          </button>
          <div class="calendar-day-details">
            <div class="calendar-day-details-inner">
              <button class="calendar-note-button${item.note ? " has-note" : ""}" type="button" data-calendar-note>${escapeHTML(item.note || "add a note")}</button>
              <div>${rows}</div>
              <button class="calendar-add-workout" type="button" data-calendar-add>
                <span class="calendar-add-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </span>
                <span>add a workout</span>
              </button>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  function renderPicker() {
    picker.innerHTML = activities.map((activity) => {
      const selected = sheetSelections.has(activity.name);
      return `<button class="calendar-picker-row${selected ? " is-selected" : ""}" type="button" data-picker-workout="${activity.name}" aria-pressed="${selected}"><img src="${activity.icon}" alt="" /><span>${activity.name}</span><span class="calendar-picker-check">✓</span></button>`;
    }).join("");
  }

  function openWorkoutSheet(day) {
    activeDay = days.find((item) => item.day === day);
    sheetSelections = new Set();
    root.querySelector("[data-calendar-sheet-title]").textContent = longDate(day);
    renderPicker();
    workoutLayer.hidden = false;
    picker.querySelector("button")?.focus({ preventScroll: true });
  }

  function closeWorkoutSheet() {
    workoutLayer.hidden = true;
    renderDays();
    root.querySelector(`[data-calendar-day="${activeDay.day}"] [data-calendar-add]`)?.focus({ preventScroll: true });
  }

  function openNoteSheet(day) {
    activeDay = days.find((item) => item.day === day);
    initialNote = activeDay.note;
    noteInput.value = initialNote;
    noteSave.disabled = true;
    root.querySelector("[data-note-sheet-title]").textContent = longDate(day);
    noteLayer.hidden = false;
    setTimeout(() => noteInput.focus({ preventScroll: true }), 100);
  }

  function closeNoteSheet() {
    noteLayer.hidden = true;
  }

  daysElement.addEventListener("click", (event) => {
    const card = event.target.closest("[data-calendar-day]");
    if (!card) return;
    const item = days.find((day) => day.day === Number(card.dataset.calendarDay));

    if (event.target.closest(".calendar-day-summary")) {
      item.expanded = !item.expanded;
      card.classList.toggle("is-expanded", item.expanded);
      card.querySelector(".calendar-day-summary").setAttribute("aria-expanded", String(item.expanded));
    } else if (event.target.closest("[data-calendar-add]")) {
      openWorkoutSheet(item.day);
    } else if (event.target.closest("[data-calendar-note]")) {
      openNoteSheet(item.day);
    }
  });

  picker.addEventListener("click", (event) => {
    const row = event.target.closest("[data-picker-workout]");
    if (!row) return;
    const name = row.dataset.pickerWorkout;
    if (sheetSelections.has(name)) {
      sheetSelections.delete(name);
      data.removeOneWorkout(dateFor(activeDay.day), name);
    } else {
      sheetSelections.add(name);
      data.addWorkout(dateFor(activeDay.day), name);
    }
    renderPicker();
    root.querySelector(`[data-picker-workout="${name}"]`)?.focus({ preventScroll: true });
    if (navigator.vibrate) navigator.vibrate(10);
  });

  scrollElement.addEventListener("scroll", () => {
    if (root.classList.contains("is-header-collapsed")) {
      if (scrollElement.scrollTop < 12) root.classList.remove("is-header-collapsed");
    } else if (scrollElement.scrollTop > 42) {
      root.classList.add("is-header-collapsed");
    }
  }, { passive: true });

  root.querySelectorAll("[data-calendar-sheet-close], [data-calendar-sheet-dismiss]")
    .forEach((button) => button.addEventListener("click", closeWorkoutSheet));
  root.querySelectorAll("[data-note-cancel]")
    .forEach((button) => button.addEventListener("click", closeNoteSheet));

  noteInput.addEventListener("input", () => {
    noteSave.disabled = noteInput.value === initialNote;
  });

  noteSave.addEventListener("click", () => {
    activeDay.note = noteInput.value;
    noteLayer.hidden = true;
    renderDays();
    root.querySelector(`[data-calendar-day="${activeDay.day}"] [data-calendar-note]`)?.focus({ preventScroll: true });
  });

  function escapeHTML(value) {
    const element = document.createElement("span");
    element.textContent = value;
    return element.innerHTML;
  }

  window.addEventListener("move-demo-data-change", syncWorkouts);
  syncWorkouts();
})();
