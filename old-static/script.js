const STORAGE_KEY = "dailyExpenseEntries";

const CHARACTER_STAGES = [
  { min: 0, emoji: "🥚", message: "알을 깨고 나올 준비를 하고 있어요..." },
  { min: 3, emoji: "🐣", message: "삐약! 세상 밖으로 나왔어요" },
  { min: 7, emoji: "🐤", message: "제법 씩씩해졌어요" },
  { min: 14, emoji: "🐥", message: "폭신폭신 잘 자라고 있어요" },
  { min: 25, emoji: "🦜", message: "화려한 날개가 생겼어요!" },
  { min: 40, emoji: "🦄", message: "전설의 친구가 되었어요!" },
];

let calendarDate = new Date();
calendarDate.setDate(1);

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function todayKey() {
  return formatKey(new Date());
}

function formatKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function totalEntryCount(data) {
  return Object.values(data).reduce((sum, list) => sum + list.length, 0);
}

function getStage(count) {
  let current = CHARACTER_STAGES[0];
  for (const stage of CHARACTER_STAGES) {
    if (count >= stage.min) current = stage;
  }
  return current;
}

function nextStageThreshold(count) {
  const next = CHARACTER_STAGES.find((s) => s.min > count);
  return next ? next.min : null;
}

function renderCharacter(animate) {
  const data = loadData();
  const count = totalEntryCount(data);
  const stage = getStage(count);
  const characterEl = document.getElementById("character");
  const messageEl = document.getElementById("characterMessage");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");

  characterEl.textContent = stage.emoji;
  messageEl.textContent = stage.message;

  if (animate) {
    characterEl.classList.remove("pop");
    void characterEl.offsetWidth;
    characterEl.classList.add("pop");
  }

  const next = nextStageThreshold(count);
  if (next === null) {
    progressFill.style.width = "100%";
    progressText.textContent = `${count} 기록 · 최고 단계 달성!`;
  } else {
    const prevMin = stage.min;
    const ratio = (count - prevMin) / (next - prevMin);
    progressFill.style.width = `${Math.round(ratio * 100)}%`;
    progressText.textContent = `${count} / ${next} 기록`;
  }
}

function renderTodayList() {
  const data = loadData();
  const list = data[todayKey()] || [];
  const listEl = document.getElementById("todayList");
  listEl.innerHTML = "";

  if (list.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-msg";
    li.textContent = "아직 기록이 없어요";
    listEl.appendChild(li);
    return;
  }

  list.slice().reverse().forEach((entry) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span><span class="entry-emotion">${entry.emotion}</span>${entry.memo ? entry.memo : "지출"}</span>
      <span class="entry-amount">${Number(entry.amount).toLocaleString()}원</span>
    `;
    listEl.appendChild(li);
  });
}

function renderCalendar() {
  const data = loadData();
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  document.getElementById("calendarTitle").textContent = `${year}년 ${month + 1}월`;

  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = formatKey(today);

  let monthTotal = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const key = formatKey(new Date(year, month, day));
    const list = data[key] || [];
    monthTotal += list.reduce((sum, e) => sum + Number(e.amount), 0);
  }
  document.getElementById("calendarTotal").textContent = `이번 달 총지출 ${monthTotal.toLocaleString()}원`;

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    empty.className = "day-cell empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const key = formatKey(cellDate);
    const cell = document.createElement("div");
    cell.className = "day-cell";
    if (key === todayStr) cell.classList.add("today");

    const dayNum = document.createElement("span");
    dayNum.textContent = day;
    cell.appendChild(dayNum);

    const dayEntries = data[key] || [];
    const dayTotal = dayEntries.reduce((sum, e) => sum + Number(e.amount), 0);
    const hasEntries = dayEntries.length > 0;
    const isPastOrToday = cellDate <= today;

    if (hasEntries) {
      const sticker = document.createElement("span");
      sticker.className = "sticker";
      sticker.textContent = "💸";
      cell.appendChild(sticker);

      const amountEl = document.createElement("span");
      amountEl.className = "day-amount";
      amountEl.textContent = dayTotal.toLocaleString();
      cell.appendChild(amountEl);
    } else if (isPastOrToday && key !== todayStr) {
      const sticker = document.createElement("span");
      sticker.className = "sticker";
      sticker.textContent = "⭐";
      cell.appendChild(sticker);
    }

    grid.appendChild(cell);
  }
}

function renderAll(animate) {
  renderCharacter(animate);
  renderTodayList();
  renderCalendar();
}

function setupEmotionPicker() {
  const picker = document.getElementById("emotionPicker");
  picker.addEventListener("click", (e) => {
    const btn = e.target.closest(".emotion-btn");
    if (!btn) return;
    picker.querySelectorAll(".emotion-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
}

function getSelectedEmotion() {
  const selected = document.querySelector(".emotion-btn.selected");
  return selected ? selected.dataset.emotion : "😊";
}

function setupForm() {
  const form = document.getElementById("expenseForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const amountInput = document.getElementById("amount");
    const memoInput = document.getElementById("memo");
    const amount = Number(amountInput.value);
    if (!amount || amount <= 0) return;

    const entry = {
      amount,
      emotion: getSelectedEmotion(),
      memo: memoInput.value.trim(),
      time: new Date().toISOString(),
    };

    const data = loadData();
    const key = todayKey();
    if (!data[key]) data[key] = [];
    data[key].push(entry);
    saveData(data);

    form.reset();
    document.querySelectorAll(".emotion-btn").forEach((b) => b.classList.remove("selected"));

    renderAll(true);
  });
}

function setupCalendarNav() {
  document.getElementById("prevMonth").addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById("nextMonth").addEventListener("click", () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  });
}

setupEmotionPicker();
setupForm();
setupCalendarNav();
renderAll(false);
