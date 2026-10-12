import "./globals.css";

export const metadata = {
  title: "BOOKLOG — 나만의 독서 기록",
  description: "책을 찾고, 기록하고, 나만의 책장을 만들어 보세요.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
