@AGENTS.md

# 오늘도 기록해요 🐣 — 하루 지출 가계부

지출을 기록할 때마다 캐릭터가 자라나는, 감정 태그와 스티커 달력이 있는 귀여운 하루 가계부 웹서비스.

## 배경
지출을 남길수록 재미와 보상을 느끼게 해서, 매번 포기하게 되던 가계부 기록 습관을 이어가도록 돕는 것이 목표. 자세한 기획은 [prd.md](prd.md) 참고.

## 기술 스택
- Next.js (App Router, JavaScript, `create-next-app` 기본 설정)
- Tailwind CSS (CSS 파일 없이 유틸리티 클래스로 스타일링)
- 데이터 저장은 서버/DB 없이 브라우저 `localStorage`만 사용 (키: `dailyExpenseEntries`)

## 구조
- `app/page.js` — 전체 기능이 들어있는 단일 클라이언트 컴포넌트 (캐릭터 성장, 감정 태그 입력, 오늘 기록 리스트, 스티커 달력)
- `app/layout.js`, `app/globals.css` — 공통 레이아웃과 전역 스타일/애니메이션(`wiggle`, `pop`)
- `old-static/` — Next.js로 전환하기 전 순수 HTML/CSS/JS 프로토타입 백업 (참고용, 더 이상 사용하지 않음)

## 개발 명령어
```bash
npm run dev    # 로컬 개발 서버 (http://localhost:3000)
npm run build  # 프로덕션 빌드
npm run lint   # ESLint 검사
```

## 배포
GitHub(`choeunjeung/daily-expense-diary`)에 푸시 후 Vercel과 연동해 배포 예정.

## 참고
- 사용자는 코딩 비전공자로, 초보자가 이해하기 쉬운 간단한 구조를 유지하는 것을 우선한다.
- 디자인 톤은 파스텔톤(핑크/피치/민트), 둥근 모서리, 이모지 중심의 아기자기한 스타일을 따른다.
