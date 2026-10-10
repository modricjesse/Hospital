import React, { useState } from 'react';
import { HospitalProvider, useHospital } from './context/HospitalContext';
import { Navbar } from './components/Navbar';
import { PatientPortal } from './components/PatientPortal';
import { DoctorPortal } from './components/DoctorPortal';
import { EpidemiologyDashboard } from './components/EpidemiologyDashboard';
import { LedgerExplorer } from './components/LedgerExplorer';
import { GeminiChatbot } from './components/GeminiChatbot';
import { LiveVoiceConversation } from './components/LiveVoiceConversation';
import { WebRtcConsultationModal } from './components/WebRtcConsultationModal';
import { AcademicReportModal } from './components/AcademicReportModal';
import { 
  Shield, 
  Stethoscope, 
  Activity, 
  Cpu, 
  GraduationCap, 
  ArrowRight,
  UserCheck,
  Bot,
  Radio
} from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor' | 'epidemiology' | 'ledger' | 'chatbot' | 'voice' | 'thesis'>('patient');
  const [isThesisModalOpen, setIsThesisModalOpen] = useState<boolean>(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false);

  const { currentUser, switchRole, startVideoCall, closeVideoCall, firebaseUser } = useHospital();

  const handleLaunchCall = (consultId: string) => {
    startVideoCall(consultId);
    setIsCallModalOpen(true);
  };

  const handleProceedToDiagnosis = () => {
    setIsCallModalOpen(false);
    setActiveTab('doctor');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-200">
      
      {/* Top Bar Contract Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openThesisModal={() => setIsThesisModalOpen(true)}
      />

      {/* Role Quick Selector Strip for Evaluation / Demonstrations */}
      <div className="border-b border-slate-900 bg-slate-950/70 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-slate-300">Quick Persona Switch:</span>
            <span>Test multi-party interactions across actors</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                switchRole('Patient');
                setActiveTab('patient');
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                currentUser.role === 'Patient'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Patient (Amaka Obi)
            </button>

            <button
              onClick={() => {
                switchRole('Doctor');
                setActiveTab('doctor');
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                currentUser.role === 'Doctor'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Doctor (Dr. E. Okafor)
            </button>

            <button
              onClick={() => {
                switchRole('HealthOfficer');
                setActiveTab('epidemiology');
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                currentUser.role === 'HealthOfficer'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Surveillance (Dr. N. Eze)
            </button>

            <button
              onClick={() => {
                switchRole('Admin');
                setActiveTab('ledger');
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                currentUser.role === 'Admin'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Admin (Muodili Jesse)
            </button>

            <span className="text-slate-700 mx-1">|</span>

            <button
              onClick={() => setActiveTab('chatbot')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'chatbot'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                  : 'bg-slate-900 text-teal-400/90 hover:text-teal-300 border border-slate-800'
              }`}
            >
              <Bot className="h-3 w-3" />
              <span>AI Chatbot</span>
            </button>

            <button
              onClick={() => setActiveTab('voice')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'voice'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                  : 'bg-slate-900 text-teal-400/90 hover:text-teal-300 border border-slate-800'
              }`}
            >
              <Radio className="h-3 w-3" />
              <span>Live Voice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'patient' && <PatientPortal onLaunchCall={handleLaunchCall} />}
        {activeTab === 'doctor' && <DoctorPortal onLaunchCall={handleLaunchCall} />}
        {activeTab === 'epidemiology' && <EpidemiologyDashboard />}
        {activeTab === 'chatbot' && <GeminiChatbot />}
        {activeTab === 'voice' && <LiveVoiceConversation />}
        {activeTab === 'ledger' && <LedgerExplorer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-white">DeHosp-Chain</span>
            <span>·</span>
            <span>University of Nigeria, Nsukka (UNN)</span>
            <span>·</span>
            <span className="font-mono">Reg: 2021/249152</span>
            {firebaseUser && (
              <>
                <span>·</span>
                <span className="text-teal-400 font-mono">Firebase Auth: {firebaseUser.email}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsThesisModalOpen(true)}
              className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>B.Sc. Project Dissertation Documentation</span>
            </button>
            <span>·</span>
            <span>Muodili Sopuluchukwu Jesse (2026)</span>
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

      {/* Full Academic Project Report Modal */}
      {isThesisModalOpen && (
        <AcademicReportModal onClose={() => setIsThesisModalOpen(false)} />
      )}

    </div>
  );
};

export default function App() {
  return (
    <HospitalProvider>
      <AppContent />
    </HospitalProvider>
  );
}
