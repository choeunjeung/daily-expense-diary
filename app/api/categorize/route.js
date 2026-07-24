const CATEGORIES = ["식비", "카페", "교통", "쇼핑", "문화/여가", "생활", "기타"];

export async function POST(request) {
  const apiKey = process.env.UPSTAGE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "서버에 UPSTAGE_API_KEY가 설정되어 있지 않아요." },
      { status: 500 }
    );
  }

  const { memo } = await request.json();
  if (!memo || !memo.trim()) {
    return Response.json({ category: "기타" });
  }

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
          content: `너는 가계부 메모를 보고 카테고리를 정하는 분류기야. 다음 카테고리 중 하나만 정확히 그대로 출력해: ${CATEGORIES.join(", ")}. 다른 설명 없이 카테고리 단어 하나만 출력해.`,
        },
        { role: "user", content: memo },
      ],
      max_tokens: 10,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    return Response.json({ category: "기타" });
  }

  const result = await res.json();
  const text = result.choices?.[0]?.message?.content?.trim() || "";
  const matched = CATEGORIES.find((c) => text.includes(c));

  return Response.json({ category: matched || "기타" });
}
