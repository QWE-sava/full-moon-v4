export const runtime = 'edge';
import React from 'react';
import { User, CheckCircle, ExternalLink, ArrowLeft, Trophy } from 'lucide-react';
import Link from 'next/link';

type Club = {
  id: number;
  name: string;
  votes_count: number;
};

type MyPageResponse = {
  visitor_id: string;
  voted: boolean;
  club: Club | null;
};

type Props = {
  params: { id: string };
};

export default async function MyPage({ params }: Props) {
  const { id } = params;
  let data: MyPageResponse | null = null;
  let error: string | null = null;

  try {
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/api/my-page?id=${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch my page');
    data = await res.json();
  } catch (e) {
    console.error(e);
    error = '投票情報の取得に失敗しました。時間をおいて再度お試しください。';
  }

  return (
    <div className="space-y-10">
      <section className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-2">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black font-outfit">投票完了！</h2>
        <p className="text-slate-400">
          あなたの清き一票は正常に記録されました。
        </p>
      </section>

      <div className="glass-card overflow-hidden">
        <div className="bg-slate-900/80 p-4 border-b border-slate-800 flex items-center gap-3">
          <User className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">My Digital Identity</span>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Visitor ID (Encrypted)</label>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs break-all text-indigo-300">
              {id}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Vote Destination</label>
            {error ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            ) : data?.voted && data.club ? (
              <div className="p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-xs mb-1">あなたが投票した部活</div>
                  <div className="text-2xl font-bold text-white">{data.club.name}</div>
                </div>
                <Trophy className="w-10 h-10 text-indigo-500 opacity-50" />
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700 text-slate-400 italic text-center">
                投票データが見つかりません。
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/results" className="btn-outline flex items-center justify-center gap-2 py-4">
          <ExternalLink className="w-4 h-4" />
          今の結果を見る
        </Link>
        <Link href="/vote" className="btn-outline flex items-center justify-center gap-2 py-4 opacity-70 hover:opacity-100">
          <ArrowLeft className="w-4 h-4" />
          投票ページへ
        </Link>
      </div>
    </div>
  );
}
