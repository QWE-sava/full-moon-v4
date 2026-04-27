import Link from 'next/link';
import { Vote, BarChart3, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-12 py-12">
      <section className="text-center space-y-6">
        <h2 className="text-5xl font-black font-outfit leading-tight">
          次世代の投票体験を、<br />
          <span className="text-indigo-500">もっと身近に。</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
          Fullmoon V3 Accel は、顔認証テクノロジーを活用した、
          部活動のためのスマートな投票プラットフォームです。
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6">
        <Link href="/vote" className="group glass-card p-8 hover:border-indigo-500/50 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
              <Vote className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">投票する</h3>
              <p className="text-slate-400 text-sm">顔認証を使って、あなたの推し部活に一票を。</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-indigo-400 transition-colors" />
        </Link>

        <Link href="/results" className="group glass-card p-8 hover:border-emerald-500/50 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">結果を見る</h3>
              <p className="text-slate-400 text-sm">現在の投票状況をリアルタイムで確認できます。</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-emerald-400 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
