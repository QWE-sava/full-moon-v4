'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CameraCapture } from '@/components/CameraCapture';
import { LayoutGrid, Fingerprint, Send, AlertCircle, Info, RefreshCw } from 'lucide-react';

type Club = {
  id: number;
  name: string;
  votes_count: number;
};

export default function VotePage() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [faceHash, setFaceHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/api/results`);
        if (!res.ok) throw new Error('Failed to fetch clubs');
        const json = await res.json();
        setClubs(json.clubs || []);
      } catch (e) {
        console.error(e);
        setError('部活一覧の取得に失敗しました');
      }
    };
    fetchClubs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!faceHash) {
      setError('まずは顔をキャプチャしてハッシュを生成してください');
      return;
    }
    if (!selectedClubId) {
      setError('投票先の部活を選択してください');
      return;
    }

    setLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/api/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ face_hash: faceHash, club_id: selectedClubId }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json?.error === 'Already voted') {
          setError('すでに投票済みです。この顔（ハッシュ）では1回のみ投票可能です。');
        } else {
          setError(json?.error || '投票に失敗しました');
        }
        return;
      }

      const visitorId = json?.visitor_id as string | undefined;
      if (!visitorId) {
        setError('visitor_id の取得に失敗しました');
        return;
      }

      router.push(`/my-page/${visitorId}`);
    } catch (e) {
      console.error(e);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h2 className="text-2xl font-bold font-outfit mb-3">清き一票を、あなたの顔で。</h2>
        <p className="text-slate-400 max-w-lg mx-auto leading-relaxed">
          カメラで顔を認識し、世界で唯一の認証ハッシュを生成します。<br />
          画像自体は保存されない、プライバシー重視の投票システムです。
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Step 1 */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">1</div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-indigo-400" />
              顔認証ハッシュの生成
            </h3>
          </div>
          <CameraCapture onHashGenerated={setFaceHash} />
        </div>

        {/* Step 2 */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">2</div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-indigo-400" />
              投票先の部活を選択
            </h3>
          </div>
          
          {clubs.length === 0 ? (
            <div className="glass-card p-8 text-center text-slate-500 italic">
              部活情報を読み込み中...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clubs.map((club) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => setSelectedClubId(club.id)}
                  className={`relative group text-left p-5 rounded-2xl border transition-all duration-300 overflow-hidden ${
                    selectedClubId === club.id
                      ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60'
                  }`}
                >
                  {selectedClubId === club.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                  )}
                  <div className={`font-bold text-lg mb-1 transition-colors ${selectedClubId === club.id ? 'text-indigo-400' : 'text-slate-200'}`}>
                    {club.name}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    現在の得票数: <span className="text-slate-300">{club.votes_count}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="glass-card p-4 border-indigo-500/10 bg-indigo-500/5 flex gap-3 items-start">
          <Info className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            投票内容はブロックチェーンのように不可逆なハッシュ値で管理されます。
            一度投票すると、同じ顔での再投票はできません。
          </p>
        </div>

        {error && (
          <div className="glass-card p-4 border-red-500/30 bg-red-500/5 flex items-center gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || !faceHash || !selectedClubId}
            className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                投票を確定する
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
