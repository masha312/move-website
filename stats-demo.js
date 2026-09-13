(() => {
  const root = document.querySelector("[data-stats-demo]");
  if (!root) return;

  const data = window.MoveDemoData;
  const activities = data.activities.map((activity) => activity.name);
  const cards = root.querySelector("[data-stats-cards]");
  const title = root.querySelector("[data-stats-date-title]");
  const stickyTitle = root.querySelector("[data-stats-sticky-title]");
  const scrollElement = root.querySelector("[data-stats-scroll]");
  const picker = root.querySelector(".stats-range-picker");
  const rangeButtons = Array.from(picker.querySelectorAll("[data-stats-range]"));
  const tooltip = document.createElement("span");
  let selectedRange = "month";
  let rangeTransitionVersion = 0;
  let activeRangeTransition = null;

  tooltip.className = "stats-tooltip stats-tooltip-overlay";
  tooltip.setAttribute("role", "status");
  tooltip.setAttribute("aria-hidden", "true");
  document.body.append(tooltip);

  const sourceStatus = document.querySelector(".demo-status");
  const statusSlot = root.querySelector("[data-stats-status]");
  if (sourceStatus && statusSlot) statusSlot.replaceWith(sourceStatus.cloneNode(true));

  function monthsBetween(start, end) {
    const months = [];
    const month = new Date(start.getFullYear(), start.getMonth(), 1, 12);
    while (month <= end) {
      months.push(new Date(month));
      month.setMonth(month.getMonth() + 1);
    }
    return months;
  }

  function formatMonth(date) {
    return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" })
      .format(date).toLowerCase();
  }

  function formatDay(day) {
    const date = new Date(2026, 6, day);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long", month: "short", day: "numeric"
    }).format(date).toLowerCase();
  }

  function formatRangeDate(date) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric"
    }).format(date).toLowerCase();
  }

  function linePath(values) {
    const width = 200;
    const height = 55;
    const max = Math.max(1, ...values);
    const points = values.map((value, index) => {
      const x = values.length === 1 ? width / 2 : index * width / (values.length - 1);
      const y = height - value / max * (height - 5);
      return { x, y };
    });

    if (points.length === 1) return `M${points[0].x},${points[0].y}`;

    let path = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
    for (let index = 0; index < points.length - 1; index += 1) {
      const previous = points[index - 1] || points[index];
      const current = points[index];
      const next = points[index + 1];
      const following = points[index + 2] || next;
      const control1X = current.x + (next.x - previous.x) / 6;
      const control1Y = current.y + (next.y - previous.y) / 6;
      const control2X = next.x - (following.x - current.x) / 6;
      const control2Y = next.y - (following.y - current.y) / 6;
      path += ` C${control1X.toFixed(2)},${control1Y.toFixed(2)} ${control2X.toFixed(2)},${control2Y.toFixed(2)} ${next.x.toFixed(2)},${next.y.toFixed(2)}`;
    }
    return path;
  }

  function chartMarkup(name, rangeEvents, start, end) {
    if (selectedRange === "month") {
      const values = Array.from({ length: 31 }, (_, index) => rangeEvents.filter((event) =>
        event.activity === name && event.date.getDate() === index + 1
      ).length);
      const dots = values.map((count, index) => {
        const label = `${formatDay(index + 1)} · ${count}`;
        return `<button class="stats-dot${count ? " has-workout" : ""}" type="button" data-stats-dot data-tooltip-text="${label}" aria-label="${name}, ${label}"></button>`;
      }).join("");
      return `<div class="stats-dot-grid">${dots}</div>`;
    }

    const months = monthsBetween(start, end);
    const values = months.map((month) => rangeEvents.filter((event) =>
      event.activity === name &&
      event.date.getFullYear() === month.getFullYear() &&
      event.date.getMonth() === month.getMonth()
    ).length);
    const labels = months.map((month, index) => `${formatMonth(month)} · ${values[index]}`);
    return `
      <div class="stats-line-chart" data-stats-line data-values='${JSON.stringify(values)}' data-labels='${JSON.stringify(labels)}'>
        <svg viewBox="0 0 200 55" preserveAspectRatio="none" aria-hidden="true">
          <path class="stats-line-path" d="${linePath(values)}"></path>
          <line class="stats-line-rule" x1="0" x2="0" y1="0" y2="55"></line>
        </svg>
      </div>`;
  }

  function render() {
    tooltip.classList.remove("is-visible");
    tooltip.setAttribute("aria-hidden", "true");
    const [start, end] = data.bounds[selectedRange];
    const dateTitle = `${formatRangeDate(start)} – ${formatRangeDate(end)}`;
    title.textContent = dateTitle;
    stickyTitle.textContent = dateTitle;
    const rangeEvents = data.eventsBetween(start, end);

    if (!cards.children.length) {
      cards.innerHTML = activities.map(cardMarkup).join("");
    }

    activities.forEach((name) => {
      const card = Array.from(cards.children).find((item) => item.dataset.statsActivity === name);
      const total = rangeEvents.filter((event) => event.activity === name).length;
      card.classList.remove("has-tooltip");
      card.querySelector("[data-stats-total]").textContent = total;
      card.querySelector("[data-stats-visual]").innerHTML = chartMarkup(name, rangeEvents, start, end);
    });
  }

  function cardMarkup(name) {
    return `
      <article class="stats-card" data-stats-activity="${name}">
        <header class="stats-card-header"><span>${name}</span></header>
        <div class="stats-card-changing" data-stats-changing>
          <span class="stats-card-total" data-stats-total></span>
          <div class="stats-card-visual" data-stats-visual></div>
        </div>
      </article>`;
  }

  function showTooltip(card, text, x, y) {
    cards.querySelectorAll(".stats-card.has-tooltip").forEach((item) => item.classList.remove("has-tooltip"));
    tooltip.textContent = text;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.setAttribute("aria-hidden", "false");
    tooltip.classList.add("is-visible");
    card.classList.add("has-tooltip");
  }

  function showDotTooltip(dot) {
    const card = dot.closest(".stats-card");
    const dotBounds = dot.getBoundingClientRect();
    showTooltip(
      card,
      dot.dataset.tooltipText,
      dotBounds.left + dotBounds.width / 2,
      dotBounds.top + dotBounds.height / 2 - 4
    );
  }

  function hideTooltip(target) {
    target.closest(".stats-card")?.classList.remove("has-tooltip");
    tooltip.classList.remove("is-visible");
    tooltip.setAttribute("aria-hidden", "true");
  }

  function selectLinePoint(chart, event) {
    const values = JSON.parse(chart.dataset.values);
    const labels = JSON.parse(chart.dataset.labels);
    const rect = chart.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const index = Math.round(ratio * (values.length - 1));
    const x = values.length === 1 ? 100 : index * 200 / (values.length - 1);
    const max = Math.max(1, ...values);
    const y = 55 - values[index] / max * 50;
    const card = chart.closest(".stats-card");
    const rule = chart.querySelector(".stats-line-rule");
    rule.setAttribute("x1", x);
    rule.setAttribute("x2", x);
    rule.classList.add("is-visible");
    showTooltip(
      card,
      labels[index],
      rect.left + x / 200 * rect.width,
      rect.top + y / 55 * rect.height
    );
  }

  function changingContent() {
    return Array.from(cards.querySelectorAll("[data-stats-changing]"));
  }

  function finishRangeTransition() {
    if (!activeRangeTransition) return;
    const transition = activeRangeTransition;
    activeRangeTransition = null;
    transition.animations.forEach((animation) => {
      try { animation.finish(); } catch {}
    });
    transition.ghosts.forEach((ghost) => ghost.remove());
    cards.classList.remove("is-range-transitioning");
  }

  function snapshotChangingContent() {
    return changingContent().map((element) => {
      const card = element.closest(".stats-card");
      const cardBounds = card.getBoundingClientRect();
      const bounds = element.getBoundingClientRect();
      const ghost = element.cloneNode(true);

      ghost.removeAttribute("data-stats-changing");
      ghost.classList.add("stats-changing-ghost");
      ghost.setAttribute("aria-hidden", "true");
      ghost.querySelectorAll(".is-selected, .is-visible").forEach((item) => {
        item.classList.remove("is-selected", "is-visible");
      });
      ghost.querySelectorAll("button").forEach((button) => { button.tabIndex = -1; });
      ghost.style.left = `${bounds.left - cardBounds.left}px`;
      ghost.style.top = `${bounds.top - cardBounds.top}px`;
      ghost.style.width = `${bounds.width}px`;
      ghost.style.height = `${bounds.height}px`;
      card.append(ghost);
      return ghost;
    });
  }

  function switchRange() {
    const version = ++rangeTransitionVersion;
    finishRangeTransition();
    const ghosts = snapshotChangingContent();
    render();
    cards.classList.add("is-range-transitioning");

    const timing = {
      duration: 200,
      easing: "cubic-bezier(0.645, 0.045, 0.355, 1)",
      fill: "forwards"
    };
    const animations = [
      ...ghosts.map((ghost) => ghost.animate([{ opacity: 1 }, { opacity: 0 }], timing)),
      ...changingContent().map((element) => element.animate([{ opacity: 0 }, { opacity: 1 }], timing))
    ];
    const transition = { animations, ghosts, version };
    activeRangeTransition = transition;

    Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (activeRangeTransition !== transition || version !== rangeTransitionVersion) return;
      activeRangeTransition = null;
      ghosts.forEach((ghost) => ghost.remove());
      cards.classList.remove("is-range-transitioning");
    });
  }

  picker.addEventListener("click", (event) => {
    const button = event.target.closest("[data-stats-range]");
    if (!button || button.dataset.statsRange === selectedRange) return;
    selectedRange = button.dataset.statsRange;
    const rangeIndex = rangeButtons.indexOf(button);
    picker.style.setProperty("--range-offset", `calc(${rangeIndex * 100}% + ${rangeIndex}px)`);
    rangeButtons.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    switchRange();
    if (navigator.vibrate) navigator.vibrate(8);
  });

  scrollElement.addEventListener("scroll", () => {
    if (root.classList.contains("is-header-collapsed")) {
      if (scrollElement.scrollTop < 12) root.classList.remove("is-header-collapsed");
    } else if (scrollElement.scrollTop > 42) {
      root.classList.add("is-header-collapsed");
    }
  }, { passive: true });

  cards.addEventListener("pointerover", (event) => {
    const dot = event.target.closest("[data-stats-dot]");
    if (!dot) return;
    cards.querySelectorAll(".stats-dot.is-selected").forEach((item) => item.classList.remove("is-selected"));
    dot.classList.add("is-selected");
    showDotTooltip(dot);
  });

  cards.addEventListener("focusin", (event) => {
    const dot = event.target.closest("[data-stats-dot]");
    if (!dot) return;
    dot.classList.add("is-selected");
    showDotTooltip(dot);
  });

  cards.addEventListener("pointermove", (event) => {
    const chart = event.target.closest("[data-stats-line]");
    if (chart) selectLinePoint(chart, event);
  });

  cards.addEventListener("pointerout", (event) => {
    const dot = event.target.closest("[data-stats-dot]");
    if (dot && !dot.contains(event.relatedTarget)) {
      dot.classList.remove("is-selected");
      hideTooltip(dot);
    }
    const chart = event.target.closest("[data-stats-line]");
    if (chart && !chart.contains(event.relatedTarget)) {
      chart.querySelector(".stats-line-rule").classList.remove("is-visible");
      hideTooltip(chart);
    }
  });

  cards.addEventListener("focusout", (event) => {
    const dot = event.target.closest("[data-stats-dot]");
    if (!dot) return;
    dot.classList.remove("is-selected");
    hideTooltip(dot);
  });

  window.addEventListener("move-demo-data-change", () => {
    finishRangeTransition();
    render();
  });
  render();
})();
