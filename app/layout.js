import "./globals.css";

export const metadata = {
  title: "오늘도 기록해요 🐣",
  description: "지출을 남길 때마다 캐릭터가 자라나는 귀여운 하루 가계부",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
