import React, { useState } from 'react';
import { HospitalProvider, useHospital } from './context/HospitalContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { PatientPortal } from './components/PatientPortal';
import { DoctorPortal } from './components/DoctorPortal';
import { EpidemiologyDashboard } from './components/EpidemiologyDashboard';
import { LedgerExplorer } from './components/LedgerExplorer';
import { GeminiChatbot } from './components/GeminiChatbot';
import { LiveVoiceConversation } from './components/LiveVoiceConversation';
import { WebRtcConsultationModal } from './components/WebRtcConsultationModal';
import { AcademicReportModal } from './components/AcademicReportModal';
import { ToastContainer } from './components/Toast';
import { Button } from './components/ui/button';
import { FileText, Shield } from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    currentUser, 
    switchRole, 
    blocks, 
    activeSession, 
    toasts, 
    dismissToast,
    closeVideoCall,
    firebaseUser,
  } = useHospital();

  const [activeTab, setActiveTab] = useState<'patient' | 'doctor' | 'epidemiology' | 'ledger' | 'chatbot' | 'voice' | 'thesis'>('patient');
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isThesisModalOpen, setIsThesisModalOpen] = useState(false);

  const handleLaunchCall = (consultId: string) => {
    setIsCallModalOpen(true);
  };

  const handleProceedToDiagnosis = () => {
    setIsCallModalOpen(false);
    setActiveTab('doctor');
  };

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'patient':
        return { num: '01', title: 'PATIENT INTAKE & TELEHEALTH', desc: 'Secure triage, encrypted intake & smart quarantine passes' };
      case 'doctor':
        return { num: '02', title: 'CLINICAL TRIAGE & DIAGNOSIS', desc: 'Differential diagnosis engine & cryptographic block minting' };
      case 'epidemiology':
        return { num: '03', title: 'OUTBREAK SURVEILLANCE & GEO-TRACKING', desc: 'Real-time pathogen clustering & transmission metrics' };
      case 'chatbot':
        return { num: '04', title: 'GEMINI MEDICAL AI COPILOT', desc: 'Multimodal pathogen analysis & clinical decision support' };
      case 'voice':
        return { num: '05', title: 'LIVE VOICE TELEMEDICINE CONSOLE', desc: 'Real-time audio consultations & clinical voice dictation' };
      case 'ledger':
        return { num: '06', title: 'CONSENSUS LEDGER & AUDIT TRAIL', desc: 'Merkle tree verification & immutability proofs' };
      default:
        return { num: '00', title: 'SYSTEM OVERVIEW', desc: 'Hospi-Chain Protocol' };
    }
  };

  const sectionInfo = getSectionTitle();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-rose-500/20 selection:text-rose-600 dark:selection:text-rose-200 transition-colors duration-150">
      
      {/* Top Bar Navigation with Theme Toggle */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openThesisModal={() => setIsThesisModalOpen(true)}
      />

      {/* Streamlined Swiss Status Bar & Quick Role Switcher */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/30 px-4 sm:px-6 py-2 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          
          {/* Telemetry Indicator */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-xs shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-zinc-800 dark:text-zinc-300 font-medium">MAINNET #2026</span>
            </div>

            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <span className="text-zinc-400 dark:text-zinc-500">BLOCK:</span>
              <span className="text-zinc-900 dark:text-zinc-200 font-bold tabular-nums">#{blocks.length}</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <span className="text-zinc-400 dark:text-zinc-500">ROLE:</span>
              <span className="text-zinc-800 dark:text-zinc-300 font-medium">{currentUser.name}</span>
            </div>
          </div>

          {/* Compact Role Switcher */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mr-1 hidden md:inline">
              PERSPECTIVE:
            </span>

            <Button
              variant={currentUser.role === 'Patient' ? 'swiss' : 'outline'}
              size="compact"
              onClick={() => {
                switchRole('Patient');
                setActiveTab('patient');
              }}
              className="text-[11px] h-6 px-2.5 cursor-pointer"
            >
              Patient
            </Button>

            <Button
              variant={currentUser.role === 'Doctor' ? 'default' : 'outline'}
              size="compact"
              onClick={() => {
                switchRole('Doctor');
                setActiveTab('doctor');
              }}
              className="text-[11px] h-6 px-2.5 cursor-pointer"
            >
              Doctor
            </Button>

            <Button
              variant={currentUser.role === 'HealthOfficer' ? 'default' : 'outline'}
              size="compact"
              onClick={() => {
                switchRole('HealthOfficer');
                setActiveTab('epidemiology');
              }}
              className="text-[11px] h-6 px-2.5 cursor-pointer"
            >
              Surveillance
            </Button>

            <Button
              variant={currentUser.role === 'Admin' ? 'default' : 'outline'}
              size="compact"
              onClick={() => {
                switchRole('Admin');
                setActiveTab('ledger');
              }}
              className="text-[11px] h-6 px-2.5 cursor-pointer"
            >
              Admin
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Section Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-950/60 px-4 sm:px-6 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-1.5 py-0.5 rounded-xs">
              {sectionInfo.num}
            </span>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-white font-sans inline-block mr-2">
                {sectionInfo.title}
              </h1>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                — {sectionInfo.desc}
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-xs border border-zinc-200 dark:border-zinc-800">
              SHA-256 VERIFIED
            </span>
            <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-xs border border-zinc-200 dark:border-zinc-800">
              WEBRTC P2P
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4">
        {activeTab === 'patient' && <PatientPortal onLaunchCall={handleLaunchCall} />}
        {activeTab === 'doctor' && <DoctorPortal onLaunchCall={handleLaunchCall} />}
        {activeTab === 'epidemiology' && <EpidemiologyDashboard />}
        {activeTab === 'chatbot' && <GeminiChatbot />}
        {activeTab === 'voice' && <LiveVoiceConversation />}
        {activeTab === 'ledger' && <LedgerExplorer />}
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-3 px-4 sm:px-6 text-xs text-zinc-500 dark:text-zinc-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <span className="font-bold text-zinc-900 dark:text-white tracking-wide">Hospi·Chain</span>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span>Decentralized Telemedicine & Epidemiologic Protocol</span>
            {firebaseUser && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">/</span>
                <span className="text-teal-600 dark:text-teal-400 font-mono text-[11px]">Auth: {firebaseUser.email}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
            <button
              onClick={() => setIsThesisModalOpen(true)}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 font-mono text-[11px] transition-colors cursor-pointer"
            >
              <FileText className="h-3 w-3" />
              <span>Technical Specification</span>
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="font-mono text-[11px]">v3.4 Production</span>
          </div>
        </div>
      </footer>

      {/* Active WebRTC Video Consultation Modal */}
      {isCallModalOpen && (
        <WebRtcConsultationModal
          onClose={() => {
            setIsCallModalOpen(false);
            closeVideoCall();
          }}
          onProceedToDiagnosis={handleProceedToDiagnosis}
        />
      )}

      {/* Technical Architecture & Specification Modal */}
      {isThesisModalOpen && (
        <AcademicReportModal onClose={() => setIsThesisModalOpen(false)} />
      )}

      {/* Real-Time Blockchain & Clinical Notification Toasts */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onViewTx={() => setActiveTab('ledger')}
      />

    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <HospitalProvider>
        <AppContent />
      </HospitalProvider>
    </ThemeProvider>
  );
}
