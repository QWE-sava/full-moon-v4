'use client';

export const runtime = 'edge';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Share2, Award, Ticket, Fingerprint, Star, Layers, Zap } from 'lucide-react';
import Link from 'next/link';

type MyPageData = {
  visitor_id: string;
  voted: boolean;
  club: {
    id: number;
    name: string;
  } | null;
  rank?: number;
};

type Title = {
  id: string;
  clubName: string;
  unlockedAt: string;
};

export default function MyPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<MyPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [myTitles, setMyTitles] = useState<Title[]>([]);
  const [newTitleUnlocked, setNewTitleUnlocked] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    
    const savedTitles = localStorage.getItem('fm_v3_titles');
    const titlesArray: Title[] = savedTitles ? JSON.parse(savedTitles) : [];
    setMyTitles(titlesArray);

    const fetchData = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
        
        // Fetch My Page Data (Now including Rank from Worker)
        const res = await fetch(`${baseUrl}/api/my-page?id=${params.id}`);
        const json = await res.json();
        setData(json);

        // --- Title System Logic ---
        if (json.voted && json.club) {
          const clubName = json.club.name;
          const isAlreadyUnlocked = titlesArray.some(t => t.clubName === clubName);
          
          if (!isAlreadyUnlocked) {
            const newTitle: Title = {
              id: params.id,
              clubName: clubName,
              unlockedAt: new Date().toISOString()
            };
            const updatedTitles = [...titlesArray, newTitle];
            localStorage.setItem('fm_v3_titles', JSON.stringify(updatedTitles));
            setMyTitles(updatedTitles);
            setNewTitleUnlocked(true);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (!data || !data.voted) return (
    <div className="text-center py-20 space-y-6">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-800 text-slate-500">
        <Fingerprint className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold">データが見つかりません</h2>
      <Link href="/vote" className="btn-primary inline-block">投票へ戻る</Link>
    </div>
  );

  return (
    <div className="max-w-md mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black font-outfit uppercase tracking-tighter italic">
          Biometric <span className="text-indigo-500">Pass</span>
        </h2>
        <p className="text-slate-400 text-sm">あなたの投票証明と獲得した称号</p>
      </div>

      <div className="glass-card overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/80 to-indigo-950/20">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase">Verification Complete</span>
          </div>
          {data.rank && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-300">RANK #{data.rank}</span>
            </div>
          )}
        </div>

        <div className="p-8 space-y-8 text-center">
          <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl">
            <QRCodeSVG value={url} size={140} level="H" />
          </div>

          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Voted For</p>
            <h3 className="text-3xl font-black text-white">{data.club?.name}</h3>
            <p className="text-indigo-400 text-sm font-medium pt-1">
              {data.rank === 1 ? '👑 伝説の第一投票者' : 
               data.rank && data.rank <= 10 ? '✨ エリートサポーター' : 
               '🔥 熱狂的なファン'}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-black/20 flex justify-between items-center text-[10px] font-mono text-slate-500 border-t border-white/5">
          <span>ID: {params.id.slice(0, 8)}</span>
          <span>SYSTEM: V3-ACCEL</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">称号コレクション</h4>
          <span className="ml-auto text-[10px] font-bold bg-white/5 px-2 py-1 rounded text-slate-500">
            {myTitles.length} COLLECTED
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {myTitles.map((title, i) => (
            <div 
              key={i} 
              className={`p-3 rounded-xl border flex flex-col gap-1 transition-all duration-500 ${
                title.clubName === data.club?.name 
                  ? 'bg-indigo-500/10 border-indigo-500/30' 
                  : 'bg-white/5 border-white/10 opacity-70'
              }`}
            >
              <div className="flex justify-between items-start">
                <Star className={`w-3 h-3 ${title.clubName === data.club?.name ? 'text-indigo-400' : 'text-slate-600'}`} />
                <span className="text-[8px] text-slate-600 font-mono">
                  {new Date(title.unlockedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-200 truncate">
                {title.clubName}の絆
              </p>
              <p className="text-[8px] text-slate-500 italic">称号: {title.clubName}推し</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => {
            const text = `Fullmoon V3で${data.club?.name}に投票しました！\n獲得称号: ${myTitles.length}個\n#FullmoonV3`;
            if (navigator.share) navigator.share({ title: '投票証明', text, url });
            else alert('URLをコピーしました！');
          }}
          className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 text-sm"
        >
          <Share2 className="w-4 h-4" /> 証明書をシェア
        </button>
        <Link href="/results" className="flex-1 btn-outline py-4 flex items-center justify-center text-sm">
          結果を確認
        </Link>
      </div>

      {newTitleUnlocked && (
        <div className="fixed bottom-6 left-6 right-6 p-4 bg-indigo-600 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">新称号アンロック！</p>
            <p className="text-[10px] text-indigo-100">「{data.club?.name}の絆」を獲得しました</p>
          </div>
          <button onClick={() => setNewTitleUnlocked(false)} className="ml-auto text-white/60 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
}
