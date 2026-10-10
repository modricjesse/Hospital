import React, { useState, useRef, useEffect } from 'react';
import { 
  Radio, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  Sparkles, 
  Square,
  Activity
} from 'lucide-react';

export const LiveVoiceConversation: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const startLiveSession = async () => {
    setError(null);
    try {
      // 1. Initialize AudioContext for 24kHz playback
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      nextStartTimeRef.current = audioCtx.currentTime;

      // 2. Open WebSocket to server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        // 3. Start capturing mic at 16kHz PCM
        await startMicCapture(ws);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'audio' && data.audio) {
            setIsSpeaking(true);
            playAudioChunk(data.audio);
          } else if (data.type === 'text' && data.text) {
            setTranscriptHistory(prev => [...prev.slice(-6), data.text]);
          } else if (data.type === 'interrupted') {
            setIsSpeaking(false);
          } else if (data.type === 'error') {
            setError(data.error);
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        setError('Failed to connect to Live API Voice service.');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsSpeaking(false);
        setIsListening(false);
      };
    } catch (err: any) {
      console.error('Failed to start Live session:', err);
      setError(err.message || 'Error initializing Live Voice session');
    }
  };

  const startMicCapture = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      inputAudioContextRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32 to Int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Base64 encode
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        ws.send(JSON.stringify({
          type: 'audio',
          audio: base64Audio,
        }));
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);
      setIsListening(true);
    } catch (err: any) {
      console.error('Mic capture error:', err);
      setError('Microphone permission required for Live voice conversation.');
    }
  };

  const playAudioChunk = (base64Audio: string) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Decode base64 to 16-bit PCM little endian
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);

    // Convert to Float32 AudioBuffer
    const audioBuffer = ctx.createBuffer(1, int16.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < int16.length; i++) {
      channelData[i] = int16[i] / 32768.0;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    // Schedule gapless playback
    const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;

    source.onended = () => {
      if (ctx.currentTime >= nextStartTimeRef.current - 0.05) {
        setIsSpeaking(false);
      }
    };
  };

  const stopLiveSession = () => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
  };

  return (
    <div className="border border-slate-800 bg-slate-900/80 rounded-2xl p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Live Voice Clinical Assistant</span>
              <span className="text-[10px] font-mono text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800 font-semibold">
                gemini-3.8-live (Live API)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Low-latency real-time voice conversation powered by Gemini Live API
            </p>
          </div>
        </div>

        <div>
          {!isConnected ? (
            <button
              onClick={startLiveSession}
              className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              <span>Start Voice Conversation</span>
            </button>
          ) : (
            <button
              onClick={stopLiveSession}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-2"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Disconnect Voice Session</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Visualizer & Status Area */}
      <div className="border border-slate-800 bg-slate-950 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="relative">
          <div
            className={`h-28 w-28 rounded-full flex items-center justify-center transition-all ${
              isConnected
                ? isSpeaking
                  ? 'bg-teal-500/20 border-2 border-teal-400 shadow-xl shadow-teal-500/20 animate-pulse'
                  : 'bg-slate-900 border-2 border-teal-500/40'
                : 'bg-slate-900 border border-slate-800'
            }`}
          >
            {isConnected ? (
              isSpeaking ? (
                <Volume2 className="h-10 w-10 text-teal-300" />
              ) : (
                <Mic className="h-10 w-10 text-teal-400" />
              )
            ) : (
              <MicOff className="h-10 w-10 text-slate-600" />
            )}
          </div>

          {isConnected && (
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-teal-400 border-2 border-slate-950 animate-ping" />
          )}
        </div>

        <div>
          <div className="text-sm font-semibold text-white">
            {!isConnected
              ? 'Voice Session Offline'
              : isSpeaking
              ? 'Gemini Live Speaking (24kHz PCM)...'
              : isListening
              ? 'Listening to Microphone (16kHz PCM)...'
              : 'Connected · Awaiting Input'}
          </div>
          <div className="text-xs text-slate-400 mt-1 max-w-md">
            {!isConnected
              ? 'Click "Start Voice Conversation" to talk directly with the Gemini 3.8 Live API model.'
              : 'Speak naturally into your microphone. Ask about communicable illnesses, quarantine timelines, or differential diagnosis.'}
          </div>
        </div>

        {/* Audio Wave Simulation when active */}
        {isConnected && (
          <div className="flex items-center gap-1.5 h-8">
            {[40, 70, 95, 60, 85, 45, 90, 65, 35, 80, 50].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-teal-400 rounded-full transition-all"
                style={{
                  height: isSpeaking || isListening ? `${h}%` : '20%',
                  opacity: isSpeaking || isListening ? 1 : 0.4,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Transcript Feed */}
      {transcriptHistory.length > 0 && (
        <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-300">Live Spoken Transcript</div>
          <div className="space-y-1 text-xs text-slate-300 font-sans">
            {transcriptHistory.map((line, idx) => (
              <p key={idx} className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
