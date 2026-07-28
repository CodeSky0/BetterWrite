import { ThemeProvider } from '@/components/theme-provider';
import type { Metadata } from 'next';
import { Inter, Noto_Serif_SC } from 'next/font/google';
import '@/styles/globals.css';

/*
 * Yohaku 字体契约：
 * - Inter（可变字重）驱动 --font-inter → --font-sans 正文链
 * - Noto Serif SC 驱动 --font-noto-serif → --font-serif 标题/引用链
 * next/font 在构建期自托管字体文件，运行时无外部请求（无 FOUC/FOUT 闪烁，
 * 对国内网络环境友好）。CJK 切片按 unicode-range 按需加载，故关闭 preload。
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin'],
  variable: '--font-noto-serif',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'BetterWrite - 深圳中考英语作文AI辅导',
  description: '基于深圳中考英语作文评分标准的专业AI写作辅导系统',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${inter.variable} ${notoSerifSC.variable}`}
    >
      <body className="min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="page-transition-wrapper">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
