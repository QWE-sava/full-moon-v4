import './globals.css';
import type { ReactNode } from 'react';
import { Inter, Outfit } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
  title: 'Fullmoon V3 Accel | 部活投票システム',
  description: '顔認証技術を活用した次世代の部活投票システム（MVP）',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen font-sans bg-slate-950 text-slate-50 relative overflow-x-hidden">
        {/* Background Decorations */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-50">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12 relative z-10">
          <header className="mb-12 flex flex-col items-center text-center">
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-4">
              <span className="text-3xl">🌕</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight font-outfit bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Fullmoon V3 Accel
            </h1>
            <p className="text-slate-400 mt-2 font-medium">
              顔認証 × 部活投票システム
            </p>
            <div className="w-12 h-1 bg-indigo-500 rounded-full mt-6 opacity-50" />
          </header>
          
          <main className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </main>

          <footer className="mt-20 pt-8 border-t border-slate-900 text-center text-slate-500 text-sm">
            &copy; 2024 Fullmoon V3 Project
          </footer>
        </div>
      </body>
    </html>
  );
}
