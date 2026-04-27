export const runtime = 'edge';
'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Share2, ArrowLeft, Ticket, Fingerprint, Calendar } from 'lucide-react';
import Link from 'next/link';

type MyPageData = {
  visitor_id: string;
  voted: boolean;
  club: {
    id: number;
    name: string;
  } | null;
};

export default function MyPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<MyPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(window.location.href);
    const fetchData = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/api/my-page?id=${params.id}`);
        const json = await res.json();
        setData(json);
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
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">データが見つかりません</h2>
        <p className="text-slate-400">まだ投票が完了していないか、URLが正しくありません。</p>
      </div>
      <Link href="/vote" className="btn-primary inline-block">
        投票ページへ移動する
      </Link>
    </div>
  );

  return (
    <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black font-outfit">投票完了！</h2>
        <p className="text-slate-400">あなたの投票は安全に記録されました。</p>
      </div>

      {/* Digital Pass Card */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative glass-card overflow-hidden">
          {/* Header */}
          <div className="bg-white/5 p-6 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold tracking-wider text-sm opacity-80">VOTING PASS</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-black/30 px-2 py-1 rounded">V3-ACCEL</span>
          </div>

          <div className="p-8 space-y-8 text-center">
            {/* QR Code */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl shadow-indigo-500/20">
              <QRCodeSVG value={url} size={160} level="H" />
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1">Voted For</p>
                <p className="text-2xl font-black text-indigo-400">{data.club?.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 text-left">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">ID Ref</p>
                  <p className="text-xs font-mono text-slate-300 truncate">{data.visitor_id.split('-')[0]}...</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Verified By</p>
                  <div className="flex items-center gap-1 text-xs text-emerald-400">
                    <Fingerprint className="w-3 h-3" />
                    <span>Biometrics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="bg-indigo-500 p-1 flex justify-between px-6">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={() => {
             if (navigator.share) {
               navigator.share({ title: 'Fullmoon V3 投票証明', url });
             } else {
               navigator.clipboard.writeText(url);
               alert('URLをコピーしました！');
             }
          }}
          className="btn-outline flex items-center justify-center gap-2 py-4"
        >
          <Share2 className="w-4 h-4" /> ページをシェア
        </button>
        <Link href="/results" className="text-center text-sm text-slate-500 hover:text-indigo-400 transition-colors py-2 flex items-center justify-center gap-2">
          全体の投票結果を見る <ArrowLeft className="w-3 h-3 rotate-180" />
        </Link>
      </div>
    </div>
  );
}
