import type { Metadata } from "next";
import "antd/dist/reset.css";
import "./globals.css";
import AntdProvider from "./antd-provider";

export const metadata: Metadata = {
  title: "后台管理",
  description: "后台管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AntdProvider>
          {children}
        </AntdProvider>
      </body>
    </html>
  );
}
