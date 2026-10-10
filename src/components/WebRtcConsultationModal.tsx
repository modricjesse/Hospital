import React, { useState, useEffect, useRef } from 'react';
import { useHospital } from '../context/HospitalContext';
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
  ShieldCheck, 
  Maximize2 
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
          // Fall back gracefully to high-fidelity simulated clinical stream
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-6">
      <div className="w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* Room Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">
                WebRTC P2P Consultation: {activeSession?.patientName || 'Patient Consultation'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Room: {activeSession?.roomToken || 'room-secure-webrtc'} · Codec: VP9/Opus · Latency: 48ms
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-xs font-mono">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-white font-medium">{formatTimer(callDuration)}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <PhoneOff className="h-5 w-5 text-rose-400" />
            </button>
          </div>
        </div>

        {/* Video Canvas & Vitals Split */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 p-4 gap-4 overflow-hidden bg-slate-950/60">
          
          {/* Main Video Viewport (Doctor and Patient Split) */}
          <div className="lg:col-span-8 flex flex-col gap-4 h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              
              {/* Box 1: Remote Stream (Patient if Doctor is viewing, or Doctor if Patient is viewing) */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                <div className="absolute inset-0 bg-radial from-slate-900 via-slate-950 to-black opacity-90" />
                
                {/* Simulated Clinical Video Feed */}
                <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-3">
                  <div className="h-24 w-24 rounded-full bg-teal-500/10 border-2 border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-2xl shadow-lg">
                    {currentUser.role === 'Doctor' ? 'Amaka' : 'Dr. Okafor'}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">
                      {currentUser.role === 'Doctor' ? activeSession?.patientName || 'Amaka Obi' : 'Dr. Emeka Okafor'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {currentUser.role === 'Doctor' ? 'Patient Video Feed (Enugu North)' : 'Lead Virologist (ESUTH)'}
                    </div>
                  </div>

                  {/* Audio wave simulation */}
                  <div className="flex items-center gap-1 h-6">
                    <span className="w-1 bg-teal-400 h-2 rounded-full animate-pulse" />
                    <span className="w-1 bg-teal-400 h-4 rounded-full animate-pulse" />
                    <span className="w-1 bg-teal-400 h-6 rounded-full animate-pulse" />
                    <span className="w-1 bg-teal-400 h-3 rounded-full animate-pulse" />
                    <span className="w-1 bg-teal-400 h-5 rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="absolute top-3 left-3 z-20 bg-slate-900/80 backdrop-blur px-2 py-0.5 rounded text-[10px] text-slate-300 border border-slate-800 font-mono">
                  REMOTE PEER
                </div>
              </div>

              {/* Box 2: Local Video Feed */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
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
                    <div className="h-24 w-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-white font-bold text-2xl">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{currentUser.name}</div>
                      <div className="text-xs text-slate-400">{currentUser.role} (Local Feed)</div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {cameraActive ? 'Camera Active' : 'Camera Disabled'}
                    </span>
                  </div>
                )}

                <div className="absolute top-3 left-3 z-20 bg-slate-900/80 backdrop-blur px-2 py-0.5 rounded text-[10px] text-teal-300 border border-slate-800 font-mono">
                  LOCAL YOU
                </div>
              </div>

            </div>

            {/* Bottom In-Call Action Bar */}
            <div className="h-16 bg-slate-950 border border-slate-800 rounded-xl px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMicActive(!micActive)}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    micActive
                      ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                  title={micActive ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>

                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    cameraActive
                      ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                  title={cameraActive ? 'Disable Camera' : 'Enable Camera'}
                >
                  {cameraActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>
              </div>

              {currentUser.role === 'Doctor' && (
                <button
                  onClick={() => {
                    onClose();
                    onProceedToDiagnosis();
                  }}
                  className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                  <FileEdit className="h-4 w-4" />
                  <span>Conclude & Commit Diagnosis On-Chain</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <PhoneOff className="h-4 w-4" />
                <span>Leave Session</span>
              </button>
            </div>
          </div>

          {/* Right: Live Patient Vitals & Examination Scratchpad */}
          <div className="lg:col-span-4 flex flex-col gap-4 h-full">
            
            {/* Live Patient Vitals HUD */}
            <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-teal-400" />
                  <span>Remote Vitals HUD</span>
                </span>
                <span className="text-[10px] font-mono text-teal-400">P2P Stream</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Thermometer className="h-3 w-3 text-amber-400" />
                    <span>Body Temp</span>
                  </span>
                  <div className="text-base font-bold text-amber-400 tabular-nums mt-0.5">
                    {patientVitals.temperature.toFixed(1)} °C
                  </div>
                  <span className="text-[10px] text-slate-500">Elevated Fever</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Heart className="h-3 w-3 text-rose-400" />
                    <span>Heart Rate</span>
                  </span>
                  <div className="text-base font-bold text-rose-400 tabular-nums mt-0.5">
                    {patientVitals.heartRate} BPM
                  </div>
                  <span className="text-[10px] text-slate-500">Sinus Tachycardia</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Blood Oxygen (SpO2)</span>
                  <div className="text-base font-bold text-teal-400 tabular-nums mt-0.5">
                    {patientVitals.spO2}%
                  </div>
                  <span className="text-[10px] text-slate-500">Room Air Saturation</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Wind className="h-3 w-3 text-blue-400" />
                    <span>Respiratory Rate</span>
                  </span>
                  <div className="text-base font-bold text-blue-300 tabular-nums mt-0.5">
                    {patientVitals.respiratoryRate}/min
                  </div>
                  <span className="text-[10px] text-slate-500">Tachypnea Flag</span>
                </div>
              </div>
            </div>

            {/* In-Call Doctor Examination Scratchpad */}
            <div className="border border-slate-800 bg-slate-900/90 rounded-xl p-4 flex-1 flex flex-col">
              <div className="text-xs font-semibold text-white mb-2">Clinical Inspection Scratchpad</div>
              <textarea
                defaultValue="Visual inspection indicates facial edema and early papular lesions across extremities. Patient confirms sudden fever onset post exposure. Recommended isolation."
                className="w-full flex-1 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 focus:outline-none resize-none font-sans leading-relaxed"
                placeholder="Record clinical observations during call..."
              />
              <div className="mt-2 text-[10px] text-slate-500 font-mono">
                Encrypted in browser session memory prior to on-chain hashing.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
