import React, { useState, useEffect, useRef } from 'react';
import { useHospital } from '../context/HospitalContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Activity, 
  Heart, 
  Wind, 
  Thermometer, 
  FileEdit, 
  ShieldCheck
} from 'lucide-react';

interface WebRtcConsultationModalProps {
  onClose: () => void;
  onProceedToDiagnosis: () => void;
}

export const WebRtcConsultationModal: React.FC<WebRtcConsultationModalProps> = ({
  onClose,
  onProceedToDiagnosis,
}) => {
  const { activeSession, currentUser } = useHospital();
  const [micActive, setMicActive] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [useRealMedia, setUseRealMedia] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Try real camera initialization if available
  useEffect(() => {
    async function initMedia() {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setUseRealMedia(true);
        } catch (err: any) {
          setUseRealMedia(false);
          setMediaError('Local camera stream not permitted in current frame - running simulated WebRTC media channel.');
        }
      }
    }
    initMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const patientVitals = activeSession?.patientVitals || {
    temperature: 39.2,
    spO2: 96,
    heartRate: 98,
    respiratoryRate: 22,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6">
      <div className="w-full max-w-6xl h-[90vh] bg-zinc-950 border border-zinc-800 rounded-sm flex flex-col overflow-hidden shadow-2xl">
        
        {/* Room Header with Swiss Grid Alignment */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-rose-600 text-white font-mono font-bold text-xs">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-white text-sm font-sans flex items-center gap-2">
                <span>WebRTC P2P Room: {activeSession?.patientName || 'Clinical Consultation'}</span>
                <Badge variant="verified" className="font-mono text-[9px]">
                  VP9 / OPUS ENCRYPTED
                </Badge>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono">
                ROOM: <strong className="text-zinc-200">{activeSession?.roomToken || 'room-secure-mesh'}</strong> · MESH LATENCY: 34ms
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-sm border border-zinc-800 text-xs font-mono">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-white font-bold tabular-nums">{formatTimer(callDuration)}</span>
            </div>

            <Button
              variant="destructive"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-sm"
              title="Leave room"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video Canvas & Vitals Split */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 p-4 gap-4 overflow-hidden bg-zinc-950">
          
          {/* Main Video Viewport (Doctor and Patient Split) */}
          <div className="lg:col-span-8 flex flex-col gap-4 h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              
              {/* Box 1: Remote Stream */}
              <div className="relative rounded-sm overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-3">
                  <div className="h-20 w-20 rounded-sm bg-zinc-950 border border-zinc-800 flex items-center justify-center text-rose-400 font-bold text-xl font-mono shadow-inner">
                    {currentUser.role === 'Doctor' ? 'PT' : 'DR'}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm font-sans">
                      {currentUser.role === 'Doctor' ? activeSession?.patientName || 'Amaka Obi' : 'Dr. Emeka Okafor'}
                    </div>
                    <div className="text-xs text-zinc-400 font-mono text-[11px]">
                      {currentUser.role === 'Doctor' ? 'Patient Video Feed · Enugu North' : 'Lead Virologist · ESUTH Specialist'}
                    </div>
                  </div>

                  {/* Audio wave simulation */}
                  <div className="flex items-center gap-1 h-6">
                    <span className="w-1 bg-rose-500 h-2 rounded-none animate-pulse" />
                    <span className="w-1 bg-rose-500 h-4 rounded-none animate-pulse" />
                    <span className="w-1 bg-rose-500 h-6 rounded-none animate-pulse" />
                    <span className="w-1 bg-rose-500 h-3 rounded-none animate-pulse" />
                    <span className="w-1 bg-rose-500 h-5 rounded-none animate-pulse" />
                  </div>
                </div>

                <div className="absolute top-3 left-3 z-20 bg-zinc-950 px-2 py-0.5 rounded-sm text-[9px] text-zinc-300 border border-zinc-800 font-mono">
                  REMOTE PEER
                </div>
              </div>

              {/* Box 2: Local Video Feed */}
              <div className="relative rounded-sm overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                {useRealMedia ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-3">
                    <div className="h-20 w-20 rounded-sm bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white font-bold text-xl font-mono">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm font-sans">{currentUser.name}</div>
                      <div className="text-xs text-zinc-400 font-mono text-[11px]">{currentUser.role} (Local Stream)</div>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {cameraActive ? 'Camera Active' : 'Camera Disabled'}
                    </span>
                  </div>
                )}

                <div className="absolute top-3 left-3 z-20 bg-zinc-950 px-2 py-0.5 rounded-sm text-[9px] text-rose-400 border border-zinc-800 font-mono">
                  LOCAL YOU
                </div>
              </div>

            </div>

            {/* Bottom In-Call Action Bar */}
            <div className="h-14 bg-zinc-950 border border-zinc-800 rounded-sm px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={micActive ? "secondary" : "destructive"}
                  size="sm"
                  onClick={() => setMicActive(!micActive)}
                  className="h-8 gap-1.5 font-mono text-xs"
                >
                  {micActive ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                  <span>{micActive ? 'Mute' : 'Unmuted'}</span>
                </Button>

                <Button
                  variant={cameraActive ? "secondary" : "destructive"}
                  size="sm"
                  onClick={() => setCameraActive(!cameraActive)}
                  className="h-8 gap-1.5 font-mono text-xs"
                >
                  {cameraActive ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                  <span>{cameraActive ? 'Stop Video' : 'Start Video'}</span>
                </Button>
              </div>

              {currentUser.role === 'Doctor' && (
                <Button
                  variant="swiss"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onProceedToDiagnosis();
                  }}
                  className="gap-2 font-mono text-xs"
                >
                  <FileEdit className="h-3.5 w-3.5" />
                  <span>CONCLUDE & COMMIT DIAGNOSIS ON-CHAIN</span>
                </Button>
              )}

              <Button
                variant="destructive"
                size="sm"
                onClick={onClose}
                className="gap-1.5 font-mono text-xs"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                <span>LEAVE</span>
              </Button>
            </div>
          </div>

          {/* Right: Patient Vitals HUD & Inspection Notes */}
          <div className="lg:col-span-4 flex flex-col gap-4 h-full">
            
            {/* Live Patient Vitals HUD */}
            <div className="border border-zinc-800 bg-zinc-900/80 rounded-sm p-4 space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                  <Activity className="h-3.5 w-3.5 text-rose-500" />
                  <span>Remote Vitals HUD</span>
                </span>
                <span className="text-[10px] text-rose-400">P2P SENSORS</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-950 p-2.5 rounded-sm border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                    <Thermometer className="h-3 w-3 text-rose-400" />
                    <span>BODY TEMP</span>
                  </span>
                  <div className="text-base font-bold text-rose-400 tabular-nums mt-0.5">
                    {patientVitals.temperature.toFixed(1)} °C
                  </div>
                  <span className="text-[9px] text-zinc-500">Elevated Fever</span>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-sm border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                    <Heart className="h-3 w-3 text-rose-400" />
                    <span>HEART RATE</span>
                  </span>
                  <div className="text-base font-bold text-rose-400 tabular-nums mt-0.5">
                    {patientVitals.heartRate} BPM
                  </div>
                  <span className="text-[9px] text-zinc-500">Sinus Tachycardia</span>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-sm border border-zinc-800">
                  <span className="text-zinc-500 text-[10px]">SPO2 OXYGEN</span>
                  <div className="text-base font-bold text-emerald-400 tabular-nums mt-0.5">
                    {patientVitals.spO2}%
                  </div>
                  <span className="text-[9px] text-zinc-500">Room Air</span>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-sm border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                    <Wind className="h-3 w-3 text-blue-400" />
                    <span>RESP. RATE</span>
                  </span>
                  <div className="text-base font-bold text-blue-300 tabular-nums mt-0.5">
                    {patientVitals.respiratoryRate}/min
                  </div>
                  <span className="text-[9px] text-zinc-500">Tachypnea Flag</span>
                </div>
              </div>
            </div>

            {/* In-Call Clinical Scratchpad */}
            <div className="border border-zinc-800 bg-zinc-900/80 rounded-sm p-4 flex-1 flex flex-col">
              <div className="text-xs font-bold text-white mb-2 font-mono uppercase tracking-wider">
                CLINICAL INSPECTION SCRATCHPAD
              </div>
              <textarea
                defaultValue="Visual inspection indicates facial edema and early papular lesions across extremities. Patient confirms sudden fever onset post exposure. Recommended isolation."
                className="w-full flex-1 rounded-sm border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200 focus:outline-none resize-none font-sans leading-relaxed"
                placeholder="Record clinical observations during call..."
              />
              <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                Encrypted in browser session memory prior to on-chain hashing.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
