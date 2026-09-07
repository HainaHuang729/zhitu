import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '知途 · 聊聊你的计划', description: '通过对话梳理留学背景与目标。' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="zh-CN"><body>{children}</body></html>; }
