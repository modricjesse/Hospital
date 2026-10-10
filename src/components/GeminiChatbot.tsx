import React, { useState, useRef, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Loader2, 
  Trash2, 
  ShieldAlert, 
  Cpu, 
  Settings2,
  Mic
} from 'lucide-react';
import { AudioTranscriber } from './AudioTranscriber';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
}

export const GeminiChatbot: React.FC = () => {
  const { currentUser, firebaseUser } = useHospital();
  
  // Model state: gemini-3.5-flash (general), gemini-3.1-pro-preview (complex), gemini-3.1-flash-lite (fast)
  const [model, setModel] = useState<string>('gemini-3.5-flash');
  const [rolePreset, setRolePreset] = useState<string>('clinical');
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-seed-1',
      role: 'model',
      content: 
        'Hello! I am the DeHosp-Chain Communicable Disease & Epidemiological AI Advisor. I can assist you with infection triage assessment, quarantine protocols, differential diagnosis for regional pathogens (Lassa fever, Mpox, Cholera), and explain how our smart contracts enforce immutable audit trails. How can I assist you today?',
      timestamp: Date.now() - 60000,
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const systemInstructions: Record<string, string> = {
    clinical: 
      'You are a senior infectious disease clinical specialist and virology consultant for DeHosp-Chain online hospital. You advise patients and doctors on communicable disease containment, symptoms, incubation periods, and barrier nursing protocols.',
    epidemiology: 
      'You are a state outbreak surveillance epidemiologist. You analyze regional transmission vectors, active case velocity, threshold alarms, and recommend public health containment measures.',
    blockchain: 
      'You are the lead distributed systems architect for DeHosp-Chain. You provide technical explanations of how Solidity smart contracts, Merkle roots, SHA-256 IPFS hashes, and hybrid storage eliminate single points of failure in telemedicine.',
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
      modelUsed: model,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Persist to Firestore if user is authenticated
      if (firebaseUser) {
        try {
          await addDoc(collection(db, 'chats'), {
            userId: firebaseUser.uid,
            role: 'user',
            content: userText,
            modelUsed: model,
            timestamp: Date.now(),
          });
        } catch (fErr) {
          console.warn('Firestore chat save error:', fErr);
        }
      }

      const conversationHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory,
          model,
          systemInstruction: systemInstructions[rolePreset],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const modelMessage: Message = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply || 'No response generated.',
        timestamp: Date.now(),
        modelUsed: model,
      };

      setMessages(prev => [...prev, modelMessage]);

      if (firebaseUser) {
        try {
          await addDoc(collection(db, 'chats'), {
            userId: firebaseUser.uid,
            role: 'model',
            content: data.reply,
            modelUsed: model,
            timestamp: Date.now(),
          });
        } catch (fErr) {
          console.warn('Firestore chat save error:', fErr);
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Error: ${err.message || 'Unable to communicate with Gemini API'}. Please ensure your API key is configured.`,
        timestamp: Date.now(),
        modelUsed: model,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'model',
        content: 'Conversation history reset. How can I help with communicable disease care today?',
        timestamp: Date.now(),
        modelUsed: model,
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[750px] border border-slate-800 bg-slate-900/80 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Top Header with Model & Role Selection */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm flex items-center gap-2">
              <span>Gemini Clinical Triage Advisor</span>
              <span className="text-[10px] font-mono text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                Multi-Turn
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Role-guided clinical AI assistant with model switching
            </div>
          </div>
        </div>

        {/* Model & Persona Selector Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Model selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Cpu className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="gemini-3.5-flash" className="bg-slate-900 text-slate-200">
                gemini-3.5-flash (General)
              </option>
              <option value="gemini-3.1-pro-preview" className="bg-slate-900 text-slate-200">
                gemini-3.1-pro-preview (Complex)
              </option>
              <option value="gemini-3.1-flash-lite" className="bg-slate-900 text-slate-200">
                gemini-3.1-flash-lite (Fast)
              </option>
            </select>
          </div>

          {/* Role Preset selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            <Settings2 className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={rolePreset}
              onChange={e => setRolePreset(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="clinical" className="bg-slate-900 text-slate-200">
                Clinical Virology Doctor
              </option>
              <option value="epidemiology" className="bg-slate-900 text-slate-200">
                Outbreak Epidemiologist
              </option>
              <option value="blockchain" className="bg-slate-900 text-slate-200">
                Blockchain Architect
              </option>
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Clear conversation thread"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg text-xs font-bold ${
                  isUser
                    ? 'bg-teal-500 text-slate-950'
                    : 'bg-slate-800 text-teal-400 border border-slate-700'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div className={`space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-teal-500 text-slate-950 font-medium'
                      : 'bg-slate-950 border border-slate-800 text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                <div
                  className={`flex items-center gap-2 text-[10px] font-mono text-slate-500 px-1 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.modelUsed && (
                    <>
                      <span>·</span>
                      <span>{msg.modelUsed}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-xl">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-teal-400 border border-slate-700">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />
              <span>Thinking with {model}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar with integrated Audio Transcription */}
      <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between mb-2">
          <AudioTranscriber
            onTranscriptionComplete={text => setInput(prev => (prev ? `${prev} ${text}` : text))}
            buttonLabel="Voice Dictation (gemini-3.5-transcribe)"
          />
          <span className="text-[11px] text-slate-500 font-mono">
            Active Model: <span className="text-teal-400 font-semibold">{model}</span>
          </span>
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about communicable triage, Lassa fever protocols, or smart contract verification..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

    </div>
  );
};
