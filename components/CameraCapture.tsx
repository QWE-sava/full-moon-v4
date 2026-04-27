'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import { Camera, RefreshCw, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

type Props = {
  onDescriptorGenerated: (descriptor: number[]) => void;
};

export const CameraCapture: React.FC<Props> = ({ onDescriptorGenerated }) => {
  const webcamRef = useRef<Webcam | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setIsModelsLoaded(true);
      } catch (e) {
        console.error(e);
        setError('顔認証モデルの読み込みに失敗しました。');
      }
    };
    loadModels();
  }, []);

  const capture = useCallback(async () => {
    if (!webcamRef.current || !isModelsLoaded) return;
    
    const video = webcamRef.current.video;
    if (!video) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Detect single face and compute descriptor
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error('顔が検出されませんでした。正面をしっかり向いて再度お試しください。');
      }

      setPreview(webcamRef.current.getScreenshot());
      
      // Convert Float32Array to number[] for transmission
      const descriptorArray = Array.from(detection.descriptor);
      onDescriptorGenerated(descriptorArray);
      setSuccess(true);
    } catch (e: any) {
      console.error(e);
      setError(e.message || '認証に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [isModelsLoaded, onDescriptorGenerated]);

  const reset = () => {
    setPreview(null);
    setSuccess(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="relative aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        {!preview ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover scale-x-[-1]"
            videoConstraints={{ facingMode: 'user' }}
          />
        ) : (
          <img src={preview} alt="preview" className="w-full h-full object-cover scale-x-[-1]" />
        )}
        
        {loading && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-indigo-400 font-medium">顔の特徴をスキャン中...</p>
          </div>
        )}

        {!isModelsLoaded && !preview && !loading && (
           <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
              <div className="flex items-center gap-3 text-slate-300">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">モデル読み込み中...</span>
              </div>
           </div>
        )}
      </div>

      <div className="flex justify-center gap-4">
        {!preview ? (
          <button
            type="button"
            onClick={capture}
            disabled={!isModelsLoaded || loading}
            className="btn-primary flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            顔を認証して投票へ
          </button>
        ) : (
          <button type="button" onClick={reset} className="btn-outline flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> 特徴を再取得する
          </button>
        )}
      </div>

      {error && (
        <div className="glass-card p-4 border-red-500/20 bg-red-500/5 flex items-center gap-3 text-red-400 text-sm animate-shake">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {success && (
        <div className="glass-card p-4 flex items-start gap-3 border-emerald-500/20 bg-emerald-500/5">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-400 underline decoration-emerald-500/30">本人識別ベクトル生成完了</p>
            <p className="text-[10px] text-slate-500 mt-1 opacity-70 italic leading-tight">
              128-dimensional biometric descriptor has been successfully computed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
