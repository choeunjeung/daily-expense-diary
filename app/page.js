"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "dailyExpenseEntries";

const CHARACTER_STAGES = [
  { min: 0, emoji: "🥚", message: "알을 깨고 나올 준비를 하고 있어요..." },
  { min: 3, emoji: "🐣", message: "삐약! 세상 밖으로 나왔어요" },
  { min: 7, emoji: "🐤", message: "제법 씩씩해졌어요" },
  { min: 14, emoji: "🐥", message: "폭신폭신 잘 자라고 있어요" },
  { min: 25, emoji: "🦜", message: "화려한 날개가 생겼어요!" },
  { min: 40, emoji: "🦄", message: "전설의 친구가 되었어요!" },
];

const EMOTIONS = ["😊", "🤩", "😅", "😢", "😡"];

function formatKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

export default function Home() {
  const [data, setData] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [amount, setAmount] = useState("");
  const [emotion, setEmotion] = useState(EMOTIONS[0]);
  const [memo, setMemo] = useState("");
  const [pop, setPop] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setData(JSON.parse(raw));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  const todayKey = useMemo(() => formatKey(new Date()), []);
  const totalCount = useMemo(
    () => Object.values(data).reduce((sum, list) => sum + list.length, 0),
    [data]
  );
  const stage = getStage(totalCount);
  const nextThreshold = nextStageThreshold(totalCount);
  const progressPct =
    nextThreshold === null
      ? 100
      : Math.round(((totalCount - stage.min) / (nextThreshold - stage.min)) * 100);

  const todayList = data[todayKey] || [];

  async function handleSubmit(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;

    setSaving(true);
    const trimmedMemo = memo.trim();
    let category = "기타";
    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memo: trimmedMemo }),
      });
      if (res.ok) {
        const json = await res.json();
        category = json.category || "기타";
      }
    } catch {
      // 분류 실패 시 "기타"로 저장
    }

    const entry = {
      amount: value,
      emotion,
      memo: trimmedMemo,
      category,
      time: new Date().toISOString(),
    };
    setData((prev) => {
      const next = { ...prev };
      next[todayKey] = [...(next[todayKey] || []), entry];
      return next;
    });

    setAmount("");
    setMemo("");
    setEmotion(EMOTIONS[0]);
    setSaving(false);
    setPop(true);
    setTimeout(() => setPop(false), 500);
  }

  async function handleReceiptUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setOcrLoading(true);
    setOcrError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/ocr-receipt", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setOcrError(json.error || "영수증 인식에 실패했어요.");
        return;
      }
      if (json.amount) setAmount(json.amount);
      if (json.memo) setMemo(json.memo);
    } catch {
      setOcrError("영수증 인식 중 문제가 생겼어요.");
    } finally {
      setOcrLoading(false);
    }
  }

  async function handleWeeklySummary() {
    setSummaryLoading(true);
    setSummaryError("");
    setSummary("");

    const recentEntries = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = formatKey(d);
      (data[key] || []).forEach((entry) => recentEntries.push({ date: key, ...entry }));
    }

    try {
      const res = await fetch("/api/weekly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: recentEntries }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSummaryError(json.error || "요약을 만드는 데 실패했어요.");
        return;
      }
      setSummary(json.summary);
    } catch {
      setSummaryError("요약 생성 중 문제가 생겼어요.");
    } finally {
      setSummaryLoading(false);
    }
  }

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  let monthTotal = 0;
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const key = formatKey(cellDate);
    const list = data[key] || [];
    const dayTotal = list.reduce((sum, e) => sum + Number(e.amount), 0);
    monthTotal += dayTotal;
    cells.push({
      day,
      key,
      dayTotal,
      hasEntries: list.length > 0,
      isToday: key === todayKey,
      isPast: cellDate < today && key !== todayKey,
    });
  }

  return (
    <div className="min-h-screen px-4 py-6 pb-16">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <header className="text-center">
          <h1 className="text-2xl font-bold">
            오늘도 기록해요 <span className="wiggle inline-block">🐣</span>
          </h1>
          <p className="mt-1 text-sm text-[#a68b8b]">지출을 남길 때마다 나만의 친구가 자라나요</p>
        </header>

        <section className="rounded-[22px] bg-white/80 p-5 text-center shadow-[0_6px_18px_rgba(255,182,193,0.25)]">
          <div className={`text-6xl ${pop ? "pop" : ""}`}>{stage.emoji}</div>
          <p className="mt-2 mb-3 text-sm text-[#a68b8b]">{stage.message}</p>
          <div className="h-3 overflow-hidden rounded-full bg-[#ffe3ec]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ffb6c1] to-[#ffd59e] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[#a68b8b]">
            {nextThreshold === null
              ? `${totalCount} 기록 · 최고 단계 달성!`
              : `${totalCount} / ${nextThreshold} 기록`}
          </p>
        </section>

        <section className="rounded-[22px] bg-white/80 p-5 shadow-[0_6px_18px_rgba(255,182,193,0.25)]">
          <h2 className="mb-3 text-base font-semibold">오늘의 지출 남기기 ✏️</h2>

          <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#ffd0dd] bg-[#fff9fb] py-3 text-sm font-semibold text-[#d97a97]">
            {ocrLoading ? "영수증을 읽는 중... 📸" : "영수증 사진으로 자동 입력하기 📷"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={ocrLoading}
              onChange={handleReceiptUpload}
            />
          </label>
          {ocrError && <p className="mb-3 text-center text-xs text-red-400">{ocrError}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#8a6f6f]">금액</label>
              <input
                type="number"
                min="0"
                required
                placeholder="예: 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-2xl border-2 border-[#ffe3ec] bg-[#fffaf9] px-3.5 py-2.5 text-base outline-none focus:border-[#ffb6c1]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#8a6f6f]">기분</label>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmotion(e)}
                    className={`rounded-2xl border-2 px-2.5 py-2 text-xl transition-transform hover:scale-110 ${
                      emotion === e ? "border-[#ffb6c1] bg-[#ffe3ec]" : "border-transparent bg-[#fff5f7]"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#8a6f6f]">메모 (선택)</label>
              <input
                type="text"
                placeholder="어디에 썼나요?"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="rounded-2xl border-2 border-[#ffe3ec] bg-[#fffaf9] px-3.5 py-2.5 text-base outline-none focus:border-[#ffb6c1]"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-gradient-to-r from-[#ffb6c1] to-[#ffd59e] py-3 font-bold text-[#6b3f3f] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {saving ? "기록하는 중..." : "기록하기 💖"}
            </button>
          </form>
        </section>

        <section className="rounded-[22px] bg-white/80 p-5 shadow-[0_6px_18px_rgba(255,182,193,0.25)]">
          <h2 className="mb-3 text-base font-semibold">오늘 기록 📋</h2>
          <ul className="flex flex-col gap-2">
            {todayList.length === 0 && (
              <li className="rounded-2xl bg-[#fff5f7] py-2.5 text-center text-sm text-[#cbb4b4]">
                아직 기록이 없어요
              </li>
            )}
            {todayList
              .slice()
              .reverse()
              .map((entry, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-2xl bg-[#fff5f7] px-3.5 py-2.5 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{entry.emotion}</span>
                    <span>{entry.memo || "지출"}</span>
                    {entry.category && (
                      <span className="rounded-full bg-[#ffe3ec] px-2 py-0.5 text-[0.65rem] font-semibold text-[#d97a97]">
                        {entry.category}
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-[#d97a97]">
                    {Number(entry.amount).toLocaleString()}원
                  </span>
                </li>
              ))}
          </ul>
        </section>

        <section className="rounded-[22px] bg-white/80 p-5 shadow-[0_6px_18px_rgba(255,182,193,0.25)]">
          <div className="mb-2 flex items-center justify-between">
            <button
              className="h-8 w-8 rounded-[10px] bg-[#ffe3ec] text-sm text-[#d97a97]"
              onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
            >
              ◀
            </button>
            <h2 className="text-base font-semibold">
              {year}년 {month + 1}월
            </h2>
            <button
              className="h-8 w-8 rounded-[10px] bg-[#ffe3ec] text-sm text-[#d97a97]"
              onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
            >
              ▶
            </button>
          </div>

          <p className="mb-3 rounded-xl bg-[#fff5f7] py-1.5 text-center text-sm font-bold text-[#d97a97]">
            이번 달 총지출 {monthTotal.toLocaleString()}원
          </p>

          <div className="mb-1.5 grid grid-cols-7 text-center text-xs text-[#a68b8b]">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((cell, i) =>
              cell === null ? (
                <div key={`empty-${i}`} className="aspect-square" />
              ) : (
                <div
                  key={cell.key}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl bg-[#fff5f7] text-xs text-[#8a6f6f] ${
                    cell.isToday ? "outline outline-2 outline-[#ffb6c1]" : ""
                  }`}
                >
                  <span>{cell.day}</span>
                  {cell.hasEntries ? (
                    <>
                      <span className="mt-0.5 text-base leading-none">💸</span>
                      <span className="text-[0.62rem] font-bold text-[#d97a97]">
                        {cell.dayTotal.toLocaleString()}
                      </span>
                    </>
                  ) : cell.isPast ? (
                    <span className="mt-0.5 text-base leading-none">⭐</span>
                  ) : null}
                </div>
              )
            )}
          </div>

          <p className="mt-3.5 text-center text-xs text-[#a68b8b]">
            ⭐ 무지출 데이 &nbsp;&nbsp; 💸 지출 기록 있음
          </p>
        </section>

        <section className="rounded-[22px] bg-white/80 p-5 shadow-[0_6px_18px_rgba(255,182,193,0.25)]">
          <h2 className="mb-3 text-base font-semibold">이번 주 돌아보기 🗓️</h2>
          <button
            onClick={handleWeeklySummary}
            disabled={summaryLoading}
            className="w-full rounded-2xl bg-gradient-to-r from-[#ffb6c1] to-[#ffd59e] py-3 font-bold text-[#6b3f3f] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {summaryLoading ? "이번 주를 돌아보는 중..." : "이번 주 요약 보기 💌"}
          </button>
          {summaryError && <p className="mt-3 text-center text-xs text-red-400">{summaryError}</p>}
          {summary && (
            <p className="mt-3 rounded-2xl bg-[#fff5f7] p-3.5 text-sm leading-relaxed text-[#6b3f3f]">
              {summary}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
