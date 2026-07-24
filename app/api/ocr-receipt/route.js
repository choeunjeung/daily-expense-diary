export async function POST(request) {
  const apiKey = process.env.UPSTAGE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "서버에 UPSTAGE_API_KEY가 설정되어 있지 않아요." },
      { status: 500 }
    );
  }

  const incomingForm = await request.formData();
  const file = incomingForm.get("file");
  if (!file) {
    return Response.json({ error: "영수증 이미지가 없어요." }, { status: 400 });
  }

  // 1단계: OCR로 영수증 텍스트 추출 (document-parse, 무료 요금제 사용 가능)
  const ocrForm = new FormData();
  ocrForm.append("document", file);
  ocrForm.append("model", "document-parse");
  ocrForm.append("output_formats", "['text']");

  const ocrRes = await fetch("https://api.upstage.ai/v1/document-digitization", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: ocrForm,
  });

  if (!ocrRes.ok) {
    const text = await ocrRes.text();
    return Response.json(
      { error: "영수증 텍스트 인식에 실패했어요.", detail: text },
      { status: 502 }
    );
  }

  const ocrResult = await ocrRes.json();
  const receiptText = ocrResult.content?.text || "";

  if (!receiptText.trim()) {
    return Response.json({ error: "영수증에서 글자를 찾지 못했어요." }, { status: 422 });
  }

  // 2단계: Solar LLM으로 텍스트에서 금액/상호명 파싱
  const chatRes = await fetch("https://api.upstage.ai/v1/chat/completions", {
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
            '너는 영수증 텍스트에서 정보를 뽑는 도우미야. 아래 규칙만 지켜서 JSON 하나만 출력해. 다른 설명은 절대 쓰지 마.\n{"amount": "최종 결제 총액(숫자만, 콤마/기호 제거)", "store": "가게 또는 상호명"}\n값을 못 찾으면 빈 문자열로 둬.',
        },
        { role: "user", content: receiptText },
      ],
      max_tokens: 100,
      temperature: 0,
    }),
  });

  if (!chatRes.ok) {
    return Response.json({ error: "영수증 정보 파싱에 실패했어요." }, { status: 502 });
  }

  const chatResult = await chatRes.json();
  const raw = chatResult.choices?.[0]?.message?.content?.trim() || "{}";

  let parsed = {};
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    parsed = {};
  }

  const amount = String(parsed.amount || "").replace(/[^0-9]/g, "");
  const memo = String(parsed.store || "");

  return Response.json({ amount, memo });
}
