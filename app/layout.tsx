import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '知途 · 聊聊你的计划', description: 'AI 动态提问、留学初步规划报告与下一步行动。' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="zh-CN"><body>{children}</body></html>; }

