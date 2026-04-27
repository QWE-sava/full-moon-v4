'use client';

import React, { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, CheckCircle2 } from 'lucide-react';

type Props = {
  onHashGenerated: (hash: string) => void;
};

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(digest));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export const CameraCapture: React.FC<Props> = ({ onHashGenerated }) => {
  const webcamRef = useRef<Webcam | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    setPreview(screenshot);
    setLoading(true);
    try {
      const generatedHash = await sha256(screenshot);
      setHash(generatedHash);
      onHashGenerated(generatedHash);
    } catch (e) {
      console.error(e);
      alert('顔ハッシュの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [onHashGenerated]);

  const reset = () => {
    setPreview(null);
    setHash(null);
  };

  return (
    <div className="space-y-6">
      <div className="relative aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group">
        {!preview ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover scale-x-[-1]"
            videoConstraints={{
              facingMode: 'user',
              width: 1280,
              height: 720,
            }}
          />
        ) : (
          <img
            src={preview}
            alt="preview"
            className="w-full h-full object-cover scale-x-[-1]"
          />
        )}
        
        {/* Overlay scanning effect */}
        {!preview && !loading && (
          <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-3xl pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-scan" />
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-indigo-400 font-medium">ハッシュを生成中...</p>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4">
        {!preview ? (
          <button
            type="button"
            onClick={capture}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            顔をキャプチャ
          </button>
        ) : (
          <button
            type="button"
            onClick={reset}
            className="btn-outline flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            撮り直す
          </button>
        )}
      </div>

      {hash && (
        <div className="glass-card p-4 flex items-start gap-3 border-emerald-500/20 bg-emerald-500/5">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-400 underline decoration-emerald-500/30">認証ハッシュ生成完了</p>
            <code className="block text-[10px] break-all text-slate-400 mt-1 opacity-70">
              {hash}
            </code>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
};
