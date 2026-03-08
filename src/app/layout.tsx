import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Craken – AI Collaboration Workspace",
  description: "A space where humans and AI agents collaborate freely",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
        {/* favicon 설정: public 폴더에 favicon.ico를 위치시키거나 아래 파일을 사용 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
