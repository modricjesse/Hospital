import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { 
  Radio, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  Square,
  Activity,
  Terminal,
  Cpu
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

    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);

    const audioBuffer = ctx.createBuffer(1, int16.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < int16.length; i++) {
      channelData[i] = int16[i] / 32768.0;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

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

  const spokenTopics = [
    { num: '01', text: 'I have high fever and acute rash on palms after visiting an outbreak district.' },
    { num: '02', text: 'Explain how my quarantine certificate is verified on Ethereum Sepolia.' },
    { num: '03', text: 'What barrier nursing protocols are recommended for Lassa fever isolation?' },
    { num: '04', text: 'How do smart contracts eliminate single points of failure in telemedicine?' },
  ];

  return (
    <Card className="rounded-sm space-y-6 p-6">
      
      {/* Swiss Architectural Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-rose-600 text-white font-mono font-bold text-xs">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-sans">
                Live Voice Telemedicine Cockpit
              </h3>
              <Badge variant="outline" className="font-mono text-[9px]">
                gemini-3.8-live · DUPLEX
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              AUDIO: 16kHz PCM CAPTURE / 24kHz PCM PLAYBACK
            </p>
          </div>
        </div>

        <div>
          {!isConnected ? (
            <Button
              variant="swiss"
              size="default"
              onClick={startLiveSession}
              className="gap-2 font-mono text-xs"
            >
              <Mic className="h-4 w-4" />
              <span>START VOICE CONVERSATION</span>
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="default"
              onClick={stopLiveSession}
              className="gap-2 font-mono text-xs"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>DISCONNECT SESSION</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Audio Connection Alert</AlertTitle>
          <AlertDescription className="font-mono text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Visualizer & Console Cockpit */}
      <div className="border border-zinc-800 bg-zinc-950 rounded-sm p-8 flex flex-col items-center justify-center text-center space-y-5">
        <div className="relative">
          <div
            className={`h-28 w-28 rounded-none flex items-center justify-center transition-all border ${
              isConnected
                ? isSpeaking
                  ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/50'
                  : 'bg-zinc-900 border-rose-500/50'
                : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            {isConnected ? (
              isSpeaking ? (
                <Volume2 className="h-10 w-10 text-rose-400 animate-pulse" />
              ) : (
                <Mic className="h-10 w-10 text-zinc-100" />
              )
            ) : (
              <MicOff className="h-10 w-10 text-zinc-600" />
            )}
          </div>

          {isConnected && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-rose-500 animate-ping" />
          )}
        </div>

        <div>
          <div className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            {!isConnected
              ? '▪ VOICE INTERFACE STANDBY'
              : isSpeaking
              ? '▪ GEMINI SYNTHESIZING AUDIO (24kHz)'
              : isListening
              ? '▪ LISTENING TO MICROPHONE (16kHz PCM)'
              : '▪ SESSION ESTABLISHED'}
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-md font-sans">
            {!isConnected
              ? 'Initiate voice link to speak with the real-time Gemini Live AI model.'
              : 'Speak into your microphone. Converse regarding infectious illnesses, differential diagnosis, and quarantine tracking.'}
          </p>
        </div>

        {/* Audio Wave Simulation */}
        {isConnected && (
          <div className="flex items-center gap-1.5 h-8">
            {[30, 60, 90, 50, 80, 40, 95, 70, 35, 75, 45].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-rose-500 transition-all rounded-none"
                style={{
                  height: isSpeaking || isListening ? `${h}%` : '15%',
                  opacity: isSpeaking || isListening ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        )}

        {/* Spoken Topic Prompts in Swiss Grid */}
        <div className="pt-4 w-full max-w-xl border-t border-zinc-800/80">
          <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-3 text-left">
            RECOMMENDED CLINICAL QUERIES TO SPEAK:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {spokenTopics.map(topic => (
              <div 
                key={topic.num}
                className="bg-zinc-900 p-2.5 rounded-sm border border-zinc-800 text-left font-mono text-[11px] text-zinc-300 flex items-start gap-2"
              >
                <span className="text-rose-500 font-bold">{topic.num}</span>
                <span className="font-sans text-[11px] text-zinc-300">"{topic.text}"</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transcript Feed */}
      {transcriptHistory.length > 0 && (
        <Card className="rounded-sm">
          <CardHeader className="p-4 pb-2 border-b border-zinc-800/60">
            <CardTitle className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              LIVE CONVERSATION TRANSCRIPT
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-1.5 font-mono text-xs text-zinc-300">
            {transcriptHistory.map((line, idx) => (
              <div key={idx} className="bg-zinc-950 p-2.5 rounded-sm border border-zinc-800 text-zinc-300">
                {line}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </Card>
  );
};
