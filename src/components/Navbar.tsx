import React, { useState, useRef, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Shield, 
  ChevronDown,
  Bot,
  Radio,
  LogIn,
  LogOut,
  CheckCircle2,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Sun,
  Moon
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
  } = useHospital();
  
  const { theme, toggleTheme } = useTheme();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const navItems = [
    { id: 'patient' as const, label: 'Patient Portal', num: '01' },
    { id: 'doctor' as const, label: 'Doctor Triage', num: '02' },
    { id: 'epidemiology' as const, label: 'Surveillance', num: '03' },
    { id: 'chatbot' as const, label: 'Gemini AI', num: '04', icon: Bot },
    { id: 'voice' as const, label: 'Live Voice', num: '05', icon: Radio },
    { id: 'ledger' as const, label: 'Ledger', num: '06', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-colors duration-150">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Zone 1: Swiss Architectural Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setActiveTab('patient')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xs bg-rose-600 text-white font-bold shadow-xs ring-1 ring-rose-500">
              <span className="text-sm font-mono leading-none">✚</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-zinc-900 dark:text-white text-sm font-sans">
                  Hospi<span className="text-rose-500">·</span>Chain
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-1 py-0.2 border border-zinc-200 dark:border-zinc-800 rounded-xs">
                  v3.4
                </span>
              </div>
              <div className="hidden sm:block font-mono text-[9px] text-zinc-500 dark:text-zinc-400 tracking-wider">
                COMMUNICABLE DISEASE PROTOCOL
              </div>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links in Swiss Typographic Grid */}
        <nav className="hidden lg:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/60 p-1 border border-zinc-200 dark:border-zinc-800 rounded-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-xs transition-all font-medium select-none cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs border border-zinc-300 dark:border-zinc-700 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/40'
                }`}
              >
                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{item.num}</span>
                {Icon && <Icon className={`h-3 w-3 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-500 dark:text-zinc-400'}`} />}
                <span>{item.label}</span>
              </button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={openThesisModal}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10 dark:hover:bg-amber-950/20 text-xs font-mono gap-1 ml-0.5 h-7 px-2 cursor-pointer"
          >
            <FileText className="h-3 w-3" />
            <span>Tech Spec</span>
          </Button>
        </nav>

        {/* Zone 3: Actions, Light/Dark Toggle, Auth, Mining & Persona */}
        <div className="flex items-center gap-2 shrink-0" ref={dropdownRef}>
          
          {/* Light / Dark Mode Toggle Button */}
          <Button
            variant="outline"
            size="compact"
            onClick={toggleTheme}
            className="h-7.5 w-7.5 p-0 flex items-center justify-center rounded-xs border-zinc-300 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme mode"
          >
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-indigo-600 transition-transform hover:-rotate-12" />
            )}
          </Button>

          {isMining && (
            <Badge variant="verified" className="animate-pulse hidden sm:inline-flex text-[10px] py-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span>MINING</span>
            </Badge>
          )}

          {/* Firebase Google Auth Button */}
          <Button
            variant={firebaseUser ? "secondary" : "outline"}
            size="sm"
            onClick={handleGoogleAuth}
            disabled={authLoading}
            className="h-7.5 gap-1.5 text-xs font-mono px-2.5 cursor-pointer"
            title={firebaseUser ? `Signed in as ${firebaseUser.email}. Click to sign out.` : 'Sign in with Google via Firebase Auth'}
          >
            {firebaseUser ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                <span className="hidden sm:inline truncate max-w-[80px]">{firebaseUser.email?.split('@')[0]}</span>
                <span className="sm:hidden">Auth</span>
                <LogOut className="h-3 w-3 text-zinc-500 ml-0.5" />
              </>
            ) : (
              <>
                <LogIn className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                <span className="hidden sm:inline">Google Auth</span>
                <span className="sm:hidden">Login</span>
              </>
            )}
          </Button>

          {/* Persona / Role Switcher Popover */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="h-7.5 gap-1.5 border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs px-2 cursor-pointer"
            >
              <div className="flex h-4.5 w-4.5 items-center justify-center rounded-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 text-[10px] font-mono font-bold border border-zinc-300 dark:border-zinc-700">
                {currentUser.name.charAt(0)}
              </div>
              <Badge variant="secondary" className="text-[9px] uppercase font-mono font-semibold py-0 hidden sm:inline-flex">
                {currentUser.role}
              </Badge>
              <ChevronDown className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
            </Button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80 mb-1.5">
                  <div className="font-mono text-[9px] tracking-widest uppercase text-zinc-500 dark:text-zinc-400">
                    ACTOR CONTEXT
                  </div>
                  <div className="text-[11px] text-zinc-800 dark:text-zinc-300 font-medium">
                    Select active clinical role
                  </div>
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
                      className={`w-full flex items-center justify-between p-2 rounded-xs text-left transition-colors text-xs border cursor-pointer ${
                        currentUser.id === user.id
                          ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white border-zinc-300 dark:border-zinc-700 font-semibold'
                          : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5 text-xs">
                          <span>{user.name}</span>
                          {currentUser.id === user.id && (
                            <span className="text-emerald-500 text-[9px]">●</span>
                          )}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-500 tracking-tight">
                          {formatAddress(user.walletAddress)}
                        </div>
                      </div>
                      <Badge 
                        variant={user.role === 'Doctor' ? 'default' : user.role === 'HealthOfficer' ? 'warning' : user.role === 'Admin' ? 'swiss' : 'secondary'}
                        className="text-[9px] uppercase font-mono py-0"
                      >
                        {user.role}
                      </Badge>
                    </button>
                  ))}
                </div>

                <div className="mt-1.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      openThesisModal();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-xs font-mono text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-200 justify-center h-7 cursor-pointer"
                  >
                    View System Specification
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile nav bar with Swiss grid styling */}
      <div className="flex lg:hidden overflow-x-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1 gap-1 text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-2 py-0.5 rounded-xs text-xs font-medium transition-colors cursor-pointer ${
              activeTab === item.id
                ? 'bg-zinc-900 dark:bg-zinc-800 text-white font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          onClick={openThesisModal}
          className="whitespace-nowrap px-2 py-0.5 rounded-xs text-xs font-mono text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer"
        >
          Tech Spec
        </button>
      </div>
    </header>
  );
};
