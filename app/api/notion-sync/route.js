export async function POST(request) {
  const apiKey = process.env.NOTION_API_KEY;
  const dataSourceId = process.env.NOTION_DATABASE_ID;

  if (!apiKey || !dataSourceId) {
    // Notion 연동이 아직 설정되지 않았어도 앱 사용에는 지장이 없어야 하므로 조용히 무시
    return Response.json({ skipped: true });
  }

  const { date, amount, emotion, category, memo, time } = await request.json();

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": "2025-09-03",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { data_source_id: dataSourceId },
      icon: { type: "emoji", emoji: emotion || "💸" },
      properties: {
        메모: { title: [{ text: { content: memo || "지출" } }] },
        날짜: { date: { start: date } },
        금액: { number: amount },
        감정: { select: { name: emotion } },
        카테고리: { select: { name: category || "기타" } },
        기록시각: { date: { start: time } },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return Response.json({ error: "Notion 저장에 실패했어요.", detail }, { status: 502 });
  }

  return Response.json({ ok: true });
}
