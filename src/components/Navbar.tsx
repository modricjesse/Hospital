import React from 'react';
import { useHospital } from '../context/HospitalContext';
import { UserRole } from '../types/hospital';
import { 
  Activity, 
  Shield, 
  Stethoscope, 
  Users, 
  Cpu, 
  FileText, 
  ChevronDown,
  Bot,
  Radio,
  LogIn,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import { formatAddress } from '../utils/crypto';

interface NavbarProps {
  activeTab: 'patient' | 'doctor' | 'epidemiology' | 'ledger' | 'chatbot' | 'voice' | 'thesis';
  setActiveTab: (tab: 'patient' | 'doctor' | 'epidemiology' | 'ledger' | 'chatbot' | 'voice' | 'thesis') => void;
  openThesisModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, openThesisModal }) => {
  const { 
    currentUser, 
    availableUsers, 
    switchUser, 
    isMining,
    firebaseUser,
    signInWithGoogle,
    signOutFirebase,
    isFirebaseConnected
  } = useHospital();
  
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);
  const [authLoading, setAuthLoading] = React.useState(false);

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    try {
      if (firebaseUser) {
        await signOutFirebase();
      } else {
        await signInWithGoogle();
      }
    } catch (err) {
      console.error('Google Auth Failed:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Single element brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30">
            <Shield className="h-5 w-5" />
          </div>
          <button 
            onClick={() => setActiveTab('patient')}
            className="text-left font-bold tracking-tight text-white text-base hover:text-teal-400 transition-colors whitespace-nowrap shrink-0"
          >
            <span>DeHosp-Chain</span>
            <span className="hidden sm:inline text-xs font-normal text-slate-400 ml-2 font-mono">UNN 2026</span>
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('patient')}
            className={`whitespace-nowrap shrink-0 pb-1 border-b-2 transition-colors ${
              activeTab === 'patient'
                ? 'border-teal-400 text-teal-300 font-semibold'
                : 'border-transparent hover:text-white hover:border-slate-700'
            }`}
          >
            Patient Portal
          </button>

          <button
            onClick={() => setActiveTab('doctor')}
            className={`whitespace-nowrap shrink-0 pb-1 border-b-2 transition-colors ${
              activeTab === 'doctor'
                ? 'border-teal-400 text-teal-300 font-semibold'
                : 'border-transparent hover:text-white hover:border-slate-700'
            }`}
          >
            Doctor Triage
          </button>

          <button
            onClick={() => setActiveTab('epidemiology')}
            className={`whitespace-nowrap shrink-0 pb-1 border-b-2 transition-colors ${
              activeTab === 'epidemiology'
                ? 'border-teal-400 text-teal-300 font-semibold'
                : 'border-transparent hover:text-white hover:border-slate-700'
            }`}
          >
            Outbreak Surveillance
          </button>

          <button
            onClick={() => setActiveTab('chatbot')}
            className={`whitespace-nowrap shrink-0 pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'chatbot'
                ? 'border-teal-400 text-teal-300 font-semibold'
                : 'border-transparent hover:text-white hover:border-slate-700'
            }`}
          >
            <Bot className="h-3.5 w-3.5 text-teal-400" />
            <span>Gemini Chatbot</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`whitespace-nowrap shrink-0 pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'voice'
                ? 'border-teal-400 text-teal-300 font-semibold'
                : 'border-transparent hover:text-white hover:border-slate-700'
            }`}
          >
            <Radio className="h-3.5 w-3.5 text-teal-400" />
            <span>Live Voice</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`whitespace-nowrap shrink-0 pb-1 border-b-2 transition-colors ${
              activeTab === 'ledger'
                ? 'border-teal-400 text-teal-300 font-semibold'
                : 'border-transparent hover:text-white hover:border-slate-700'
            }`}
          >
            Blockchain Ledger
          </button>

          <button
            onClick={() => openThesisModal()}
            className="whitespace-nowrap shrink-0 pb-1 border-b-2 border-transparent text-slate-400 hover:text-amber-300 hover:border-amber-400/40 transition-colors"
          >
            UNN Project Report
          </button>
        </nav>

        {/* Zone 3: Firebase Google Auth & User Profile */}
        <div className="relative flex items-center gap-2.5 shrink-0">
          {/* Firebase Google Auth Button */}
          <button
            onClick={handleGoogleAuth}
            disabled={authLoading}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              firebaseUser
                ? 'border-teal-500/40 bg-teal-950/60 text-teal-200 hover:bg-teal-900/60'
                : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
            }`}
            title={firebaseUser ? `Signed in as ${firebaseUser.email}. Click to sign out.` : 'Sign in with Google via Firebase Auth'}
          >
            {firebaseUser ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                <span className="hidden sm:inline font-mono truncate max-w-[100px]">{firebaseUser.email?.split('@')[0]}</span>
                <span className="sm:hidden">Google</span>
                <LogOut className="h-3 w-3 text-slate-400 ml-0.5" />
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5 text-slate-400" />
                <span>Google Sign In</span>
              </>
            )}
          </button>

          {isMining && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-teal-400 bg-teal-950/60 border border-teal-800/60 px-2.5 py-1 rounded">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping"></span>
              <span>Mining Block...</span>
            </div>
          )}

          {/* Persona / Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs text-slate-200 hover:border-slate-700 hover:bg-slate-800 transition-colors"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-teal-400 text-[10px] font-bold border border-slate-700">
                {currentUser.name.charAt(0)}
              </div>
              <span className="text-[10px] uppercase font-semibold text-teal-400/90 bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-900/50 hidden sm:inline">
                {currentUser.role}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg border border-slate-800 bg-slate-900 p-2 shadow-xl shadow-black/60 z-50">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Switch Simulated Actor</div>
                  <div className="text-xs text-slate-300 mt-0.5">Select a role to test multi-party workflows</div>
                </div>

                <div className="space-y-1">
                  {availableUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user);
                        setUserDropdownOpen(false);
                        if (user.role === 'Patient') setActiveTab('patient');
                        if (user.role === 'Doctor') setActiveTab('doctor');
                        if (user.role === 'HealthOfficer') setActiveTab('epidemiology');
                        if (user.role === 'Admin') setActiveTab('ledger');
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors text-xs ${
                        currentUser.id === user.id
                          ? 'bg-teal-950/70 text-teal-300 border border-teal-800/60'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-medium text-white truncate">{user.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{formatAddress(user.walletAddress)}</div>
                      </div>
                      <span className="text-[10px] font-semibold uppercase text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {user.role}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      openThesisModal();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-center py-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors"
                  >
                    View Project Report & Architecture
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile nav links */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800/80 px-4 py-2 gap-4 text-xs">
        <button
          onClick={() => setActiveTab('patient')}
          className={`whitespace-nowrap ${activeTab === 'patient' ? 'text-teal-400 font-bold' : 'text-slate-400'}`}
        >
          Patient
        </button>
        <button
          onClick={() => setActiveTab('doctor')}
          className={`whitespace-nowrap ${activeTab === 'doctor' ? 'text-teal-400 font-bold' : 'text-slate-400'}`}
        >
          Doctor
        </button>
        <button
          onClick={() => setActiveTab('epidemiology')}
          className={`whitespace-nowrap ${activeTab === 'epidemiology' ? 'text-teal-400 font-bold' : 'text-slate-400'}`}
        >
          Surveillance
        </button>
        <button
          onClick={() => setActiveTab('chatbot')}
          className={`whitespace-nowrap flex items-center gap-1 ${activeTab === 'chatbot' ? 'text-teal-400 font-bold' : 'text-slate-400'}`}
        >
          <Bot className="h-3 w-3" />
          <span>Chatbot</span>
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={`whitespace-nowrap flex items-center gap-1 ${activeTab === 'voice' ? 'text-teal-400 font-bold' : 'text-slate-400'}`}
        >
          <Radio className="h-3 w-3" />
          <span>Live Voice</span>
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`whitespace-nowrap ${activeTab === 'ledger' ? 'text-teal-400 font-bold' : 'text-slate-400'}`}
        >
          Ledger
        </button>
        <button
          onClick={() => openThesisModal()}
          className="whitespace-nowrap text-amber-400 font-medium"
        >
          UNN Report
        </button>
      </div>
    </header>
  );
};
