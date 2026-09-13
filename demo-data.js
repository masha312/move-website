(() => {
  const activities = [
    ["walking", "images/workout-walking.svg"],
    ["running", "images/workout-running.svg"],
    ["strength", "images/workout-lifting.svg"],
    ["yoga", "images/workout-yoga.svg"],
    ["cycling", "images/workout-biking.svg"],
    ["pilates", "images/workout-pilates.svg"]
  ].map(([name, icon]) => ({ name, icon }));

  const permutation = [
    151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,
    140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,
    247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,
    57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,
    74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,
    60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,
    65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,
    200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,
    52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,
    207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,
    119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,
    129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,
    218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,
    81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,
    184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,
    222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
  ];
  const gradients = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[1,0],[-1,0],[0,1],[0,-1],[0,1],[0,-1]];

  function simplexNoise(xin, yin) {
    const skewFactor = 0.5 * (Math.sqrt(3) - 1);
    const unskewFactor = (3 - Math.sqrt(3)) / 6;
    const skew = (xin + yin) * skewFactor;
    const i = Math.floor(xin + skew);
    const j = Math.floor(yin + skew);
    const unskew = (i + j) * unskewFactor;
    const x0 = xin - (i - unskew);
    const y0 = yin - (j - unskew);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + unskewFactor;
    const y1 = y0 - j1 + unskewFactor;
    const x2 = x0 - 1 + 2 * unskewFactor;
    const y2 = y0 - 1 + 2 * unskewFactor;
    const perm = (index) => permutation[index & 255];
    const contribution = (gradient, x, y) => {
      const t = 0.5 - x * x - y * y;
      if (t < 0) return 0;
      return t ** 4 * (gradient[0] * x + gradient[1] * y);
    };
    const gi0 = perm(i + perm(j)) % 12;
    const gi1 = perm(i + i1 + perm(j + j1)) % 12;
    const gi2 = perm(i + 1 + perm(j + 1)) % 12;
    return 70 * (
      contribution(gradients[gi0], x0, y0) +
      contribution(gradients[gi1], x1, y1) +
      contribution(gradients[gi2], x2, y2)
    );
  }

  const profiles = {
    walking:  { start: 1.2, end: 7.4, noise: 1.45, seed: 4.1 },
    running:  { start: 7.2, end: 2.1, noise: 1.35, seed: 8.7 },
    strength: { start: 3.4, end: 3.4, noise: 1.25, seed: 13.2 },
    yoga:     { start: 1.1, end: 4.6, noise: 1.15, seed: 19.4 },
    cycling:  { start: 4.5, end: 1.5, noise: 1.55, seed: 25.8 },
    pilates:  { start: 1.7, end: 2.2, noise: 1.05, seed: 31.6 }
  };

  const startMonth = new Date(2021, 0, 1, 12);
  const endMonth = new Date(2026, 6, 1, 12);
  const months = [];
  for (let date = new Date(startMonth); date <= endMonth; date.setMonth(date.getMonth() + 1)) {
    months.push(new Date(date));
  }

  function targetCount(name, monthIndex) {
    const profile = profiles[name];
    const progress = monthIndex / (months.length - 1);
    const trend = profile.start + (profile.end - profile.start) * progress;
    const broadNoise = simplexNoise(monthIndex * 0.105, profile.seed);
    const detailNoise = simplexNoise(monthIndex * 0.37, profile.seed + 17.3);
    const fineNoise = simplexNoise(monthIndex * 0.91, profile.seed + 61.2);
    return Math.max(0, Math.round(
      trend + broadNoise * profile.noise + detailNoise * 0.9 + fineNoise * 0.5
    ));
  }

  function eventDays(year, month, count, seed, monthIndex) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rankedDays = Array.from({ length: daysInMonth }, (_, index) => index + 1)
      .sort((first, second) => {
        const firstNoise = simplexNoise(first * 0.31 + monthIndex * 0.07, seed + 43.7);
        const secondNoise = simplexNoise(second * 0.31 + monthIndex * 0.07, seed + 43.7);
        return secondNoise - firstNoise;
      });
    return Array.from({ length: count }, (_, index) => rankedDays[index % rankedDays.length]);
  }

  const events = [];
  months.slice(0, -1).forEach((month, monthIndex) => {
    activities.forEach((activity) => {
      const profile = profiles[activity.name];
      const count = targetCount(activity.name, monthIndex);
      eventDays(month.getFullYear(), month.getMonth(), count, profile.seed, monthIndex)
        .forEach((day) => events.push({
          activity: activity.name,
          date: new Date(month.getFullYear(), month.getMonth(), day, 12)
        }));
    });
  });

  // July is explicit so the calendar and every stats range share these exact sessions.
  const julySessions = {
    31: ["walking", "pilates"], 30: ["walking", "yoga"],
    29: ["pilates", "walking", "running", "strength"], 28: ["yoga", "walking", "pilates"],
    27: ["cycling", "walking"], 26: ["running"], 25: ["strength", "yoga"],
    24: ["walking", "pilates"], 22: ["cycling", "running"], 20: ["walking"],
    18: ["strength", "pilates"], 16: ["yoga", "walking"], 14: ["running", "cycling"],
    12: ["pilates"], 10: ["walking", "strength"], 8: ["yoga"],
    6: ["cycling", "walking"], 4: ["running"], 2: ["pilates", "strength"]
  };
  Object.entries(julySessions).forEach(([day, names]) => {
    names.forEach((activity) => events.push({ activity, date: new Date(2026, 6, Number(day), 12) }));
  });

  const notify = () => window.dispatchEvent(new CustomEvent("move-demo-data-change"));
  const eventsBetween = (start, end) => events.filter((event) => event.date >= start && event.date <= end);
  const earliestEventDate = new Date(Math.min(...events.map((event) => event.date.getTime())));

  window.MoveDemoData = {
    activities,
    bounds: {
      month: [new Date(2026, 6, 1), new Date(2026, 6, 31, 23, 59, 59)],
      sixMonths: [new Date(2026, 0, 31), new Date(2026, 6, 31, 23, 59, 59)],
      year: [new Date(2025, 6, 31), new Date(2026, 6, 31, 23, 59, 59)],
      allTime: [earliestEventDate, new Date(2026, 6, 31, 23, 59, 59)]
    },
    eventsBetween,
    eventsForDay(date) {
      return events.filter((event) =>
        event.date.getFullYear() === date.getFullYear() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getDate() === date.getDate()
      );
    },
    addWorkout(date, activity) {
      events.push({ date: new Date(date), activity });
      notify();
    },
    removeOneWorkout(date, activity) {
      const index = events.findLastIndex((event) =>
        event.activity === activity &&
        event.date.getFullYear() === date.getFullYear() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getDate() === date.getDate()
      );
      if (index >= 0) events.splice(index, 1);
      notify();
    }
  };
})();
