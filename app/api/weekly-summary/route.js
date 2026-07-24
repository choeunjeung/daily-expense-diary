export async function POST(request) {
  const apiKey = process.env.UPSTAGE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "서버에 UPSTAGE_API_KEY가 설정되어 있지 않아요." },
      { status: 500 }
    );
  }

  const { entries } = await request.json();
  if (!entries || entries.length === 0) {
    return Response.json({ summary: "이번 주엔 아직 기록이 없어요. 오늘부터 하나씩 남겨볼까요?" });
  }

  const linesText = entries
    .map((e) => `${e.date} ${e.emotion} ${e.category || "기타"} ${e.amount}원 ${e.memo || ""}`)
    .join("\n");

  const res = await fetch("https://api.upstage.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "solar-mini",
      messages: [
        {
          role: "system",
          content:
            "너는 귀여운 가계부 캐릭터야. 사용자의 최근 7일 지출 기록(날짜, 감정 이모지, 카테고리, 금액, 메모)을 보고, 2~3문장으로 다정하고 아기자기한 말투의 회고 코멘트를 한국어로 써줘. 숫자를 나열하지 말고, 눈에 띄는 패턴(자주 나온 카테고리나 감정)을 짚어줘.",
        },
        { role: "user", content: linesText },
      ],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    return Response.json(
      { error: "요약을 만드는 데 실패했어요." },
      { status: 502 }
    );
  }

  const result = await res.json();
  const summary = result.choices?.[0]?.message?.content?.trim() || "";

  return Response.json({ summary });
}
