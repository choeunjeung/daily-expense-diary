@AGENTS.md

# 오늘도 기록해요 🐣 — 하루 지출 가계부

지출을 기록할 때마다 캐릭터가 자라나는, 감정 태그와 스티커 달력이 있는 귀여운 하루 가계부 웹서비스.

## 작업 원칙 (항상 지킬 것)

- **개발 작업 전 [PRD.md](PRD.md)를 먼저 확인**하고, 거기 적힌 방향에 맞게 작업한다.
- 사용자가 "이런 기능을 추가하고 싶어" 같은 새 요청을 하면, **코드를 만들기 전에 PRD.md부터 업데이트**해서 항상 PRD.md와 실제 서비스 내용이 같도록 유지한다.
- 사용자는 코딩 초보자다. 코드를 설명할 때는 전문 용어를 풀어서 쉬운 말로 설명한다.
- Vercel과 Supabase는 **반드시 무료 요금제(Free tier) 범위 안에서만** 구현한다. 유료 기능이 필요한 요청이 오면, 코드를 만들기 전에 무료로 가능한 대안을 먼저 제안한다.

## 기술 스택
- Next.js (App Router, JavaScript, `create-next-app` 기본 설정)
- Tailwind CSS (CSS 파일 없이 유틸리티 클래스로 스타일링)
- 주 저장소: 브라우저 `localStorage` (서버 DB 없음)
- 백업 저장소: **Notion 데이터베이스** (`지출 기록 (오늘도 기록해요)`) — 기록 즉시 best-effort로 동기화, 실패해도 앱 동작에 영향 없음
- 향후 계획: **Supabase**를 정식 데이터베이스로 도입 예정 (별도 단계에서 진행, 무료 요금제 범위 내에서만)
- 배포: **Vercel** — Vercel CLI로 로컬에서 연결/배포 완료 (`vercel link`, `vercel --prod`)
- 코드 백업: **GitHub**(`choeunjeung/daily-expense-diary`)에 저장소 유지, 실제 서비스 운영은 Vercel 배포 기준
- AI 연동: **Upstage**(영수증 OCR, 카테고리 분류, 주간 요약)

## 구조
- `app/page.js` — 전체 기능이 들어있는 클라이언트 컴포넌트 (캐릭터 성장, 감정 태그 입력, 오늘 기록 리스트, 스티커 달력)
- `app/layout.js`, `app/globals.css` — 공통 레이아웃과 전역 스타일/애니메이션(`wiggle`, `pop`)
- `old-static/` — Next.js로 전환하기 전 순수 HTML/CSS/JS 프로토타입 백업 (참고용, 더 이상 사용하지 않음)
- `PRD.md` — 이 서비스의 기획 문서. 작업 전 항상 참고

## 개발 명령어
```bash
npm run dev    # 로컬 개발 서버 (http://localhost:3000)
npm run build  # 프로덕션 빌드
npm run lint   # ESLint 검사
```

## 디자인 방향
- 파스텔톤(핑크/피치/민트), 둥근 모서리, 이모지 중심의 아기자기한 스타일
