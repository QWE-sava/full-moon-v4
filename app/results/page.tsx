import React from 'react';
import { BarChart3, Trophy, Medal, Crown, TrendingUp, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type Club = {
  id: number;
  name: string;
  votes_count: number;
};

type ResultsResponse = {
  clubs: Club[];
};

async function fetchResults(): Promise<ResultsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/results`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch results');
  return res.json();
}

export default async function ResultsPage() {
  let data: ResultsResponse | null = null;
  let error: string | null = null;

  try {
    data = await fetchResults();
  } catch (e) {
    console.error(e);
    error = '最新結果の取得に失敗しました。';
  }

  const clubs = data?.clubs ?? [];
  const totalVotes = clubs.reduce((acc, club) => acc + club.votes_count, 0);

  return (
    <div className="space-y-10">
      <section className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black font-outfit flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-500" />
            投票集計結果
          </h2>
          <p className="text-slate-400 text-sm">
            リアルタイムで集計が行われています（総得票数: <span className="text-slate-200 font-bold">{totalVotes}</span>）
          </p>
        </div>
        <Link href="/results" className="text-indigo-400 hover:text-indigo-300 transition-colors">
          <RefreshCw className="w-5 h-5" />
        </Link>
      </section>

      {error && (
        <div className="glass-card p-4 border-red-500/30 bg-red-500/5 text-red-400 text-center text-sm">
          {error}
        </div>
      )}

      <section className="space-y-4">
        {clubs.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-500 italic">
            まだ投票がありません。あなたの第一歩をお待ちしています。
          </div>
        ) : (
          <div className="space-y-4">
            {clubs.map((club, index) => {
              const percentage = totalVotes > 0 ? (club.votes_count / totalVotes) * 100 : 0;
              const isFirst = index === 0 && club.votes_count > 0;
              
              return (
                <div key={club.id} className="relative group">
                  <div className={`glass-card p-6 flex items-center gap-6 overflow-hidden relative ${
                    isFirst ? 'border-amber-500/20 bg-amber-500/5' : ''
                  }`}>
                    {/* Rank Badge */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 ${
                      index === 0 ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]' :
                      index === 1 ? 'bg-slate-300 text-slate-950' :
                      index === 2 ? 'bg-orange-600 text-slate-950' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {index === 0 ? <Crown className="w-6 h-6" /> : index + 1}
                    </div>

                    <div className="flex-grow space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-lg">{club.name}</div>
                        <div className="text-right">
                          <span className="text-2xl font-black font-outfit text-white">{club.votes_count}</span>
                          <span className="text-xs text-slate-500 ml-1 font-bold">VOTES</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            index === 0 ? 'bg-amber-500' :
                            index === 1 ? 'bg-slate-300' :
                            index === 2 ? 'bg-orange-600' :
                            'bg-indigo-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Progress Percentage Overlay */}
                    <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none text-8xl font-black select-none translate-y-1/4">
                       {Math.round(percentage)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="pt-8">
        <Link href="/vote" className="btn-primary w-full flex items-center justify-center gap-2">
           <TrendingUp className="w-5 h-5" />
           投票ページに戻る
        </Link>
      </div>
    </div>
  );
}
