import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'知途 Pathwise · 留学探索工作台',description:'了解申请背景，梳理下一步，自主选择适合的留学服务。'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
