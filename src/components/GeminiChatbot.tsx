import React, { useState, useRef, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  Bot, 
  Send, 
  User, 
  Loader2, 
  Trash2, 
  Cpu, 
  Settings2,
  Copy,
  Check,
  Sparkles,
  Layers,
  Terminal
} from 'lucide-react';
import { AudioTranscriber } from './AudioTranscriber';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
}

export const GeminiChatbot: React.FC = () => {
  const { firebaseUser } = useHospital();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
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
        'Hello. I am the Hospi-Chain Communicable Disease & Epidemiological Decision Support Agent. I assist clinicians and public health officers with pathogen triage evaluation, isolation quarantine timelines, differential diagnoses for endemic outbreaks (Lassa fever, Mpox Clade II, Cholera), and cryptographically verified audit trails.',
      timestamp: Date.now() - 60000,
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    { label: 'Lassa Fever vs Malaria Differential Triage Signs', id: '01' },
    { label: 'Smart Contract Immutability vs Centralized DB Comparison', id: '02' },
    { label: 'Mpox Clade II Infection Control & Barrier Nursing Criteria', id: '03' },
    { label: 'Solidity Event Emitted upon Quarantine Violation', id: '04' },
  ];

  const systemInstructions: Record<string, string> = {
    clinical: 
      'You are a senior infectious disease clinical specialist and virology consultant for Hospi-Chain online hospital. You advise patients and doctors on communicable disease containment, symptoms, incubation periods, and barrier nursing protocols.',
    epidemiology: 
      'You are a state outbreak surveillance epidemiologist. You analyze regional transmission vectors, active case velocity, threshold alarms, and recommend public health containment measures.',
    blockchain: 
      'You are the lead distributed systems architect for Hospi-Chain. You provide technical explanations of how Solidity smart contracts, Merkle roots, SHA-256 IPFS hashes, and hybrid storage eliminate single points of failure in telemedicine.',
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
        content: 'Session state initialized. Triage dialogue ready.',
        timestamp: Date.now(),
        modelUsed: model,
      },
    ]);
  };

  return (
    <Card className="flex flex-col h-[740px] rounded-sm overflow-hidden">
      
      {/* Swiss Engineering Header Toolbar */}
      <CardHeader className="p-4 border-b border-zinc-800 bg-zinc-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-rose-600 text-white font-mono font-bold text-xs">
            AI
          </div>
          <div>
            <div className="font-bold text-white text-sm flex items-center gap-2 font-sans">
              <span>Gemini Clinical Triage Copilot</span>
              <Badge variant="outline" className="font-mono text-[9px]">
                MULTI-TURN RPC
              </Badge>
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              ROLE: <strong className="text-zinc-200">{rolePreset.toUpperCase()}</strong> · ENGINE: <strong className="text-zinc-200">{model}</strong>
            </div>
          </div>
        </div>

        {/* Model & Persona Selectors */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-sm">
            <Cpu className="h-3 w-3 text-zinc-400" />
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="gemini-3.5-flash" className="bg-zinc-950 text-zinc-200">
                gemini-3.5-flash (General)
              </option>
              <option value="gemini-3.1-pro-preview" className="bg-zinc-950 text-zinc-200">
                gemini-3.1-pro-preview (Complex)
              </option>
              <option value="gemini-3.1-flash-lite" className="bg-zinc-950 text-zinc-200">
                gemini-3.1-flash-lite (Fast)
              </option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-sm">
            <Settings2 className="h-3 w-3 text-zinc-400" />
            <select
              value={rolePreset}
              onChange={e => setRolePreset(e.target.value)}
              className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="clinical" className="bg-zinc-950 text-zinc-200">
                Clinical Virology Doctor
              </option>
              <option value="epidemiology" className="bg-zinc-950 text-zinc-200">
                Outbreak Epidemiologist
              </option>
              <option value="blockchain" className="bg-zinc-950 text-zinc-200">
                Blockchain Architect
              </option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearHistory}
            className="h-7 w-7 text-zinc-400 hover:text-white"
            title="Reset thread"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-950/40">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-sm text-[10px] font-mono font-bold ${
                  isUser
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'bg-zinc-900 text-rose-400 border border-zinc-800'
                }`}
              >
                {isUser ? 'U' : 'AI'}
              </div>

              <div className={`space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-sm px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-zinc-800 text-white font-medium border border-zinc-700'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-200 font-sans'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                <div
                  className={`flex items-center gap-2 text-[10px] font-mono text-zinc-500 px-1 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.modelUsed && (
                    <>
                      <span>/</span>
                      <span>{msg.modelUsed}</span>
                    </>
                  )}
                  {!isUser && (
                    <>
                      <span>/</span>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="hover:text-rose-400 transition-colors flex items-center gap-1 font-mono cursor-pointer"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>COPY</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-xl">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-zinc-900 text-rose-400 border border-zinc-800 font-mono text-[10px]">
              AI
            </div>
            <div className="rounded-sm bg-zinc-950 border border-zinc-800 px-4 py-3 text-xs text-zinc-400 flex items-center gap-2 font-mono">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" />
              <span>Computing clinical response with {model}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts Grid */}
      <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-950 overflow-x-auto flex gap-2">
        {quickPrompts.map(p => (
          <button
            key={p.id}
            onClick={() => setInput(p.label)}
            className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-sm px-2.5 py-1 whitespace-nowrap transition-colors font-mono cursor-pointer"
          >
            <span className="text-rose-500 font-bold">{p.id}</span>
            <span className="font-sans text-[11px]">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950 space-y-2">
        <div className="flex items-center justify-between">
          <AudioTranscriber
            onTranscriptionComplete={text => setInput(prev => (prev ? `${prev} ${text}` : text))}
            buttonLabel="Voice Dictate"
          />
          <span className="text-[10px] text-zinc-500 font-mono">
            ENGINE: <strong className="text-zinc-300">{model}</strong>
          </span>
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask regarding differential diagnoses, quarantine protocol, or Merkle tree consensus..."
            className="text-xs"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            variant="swiss"
            size="default"
            className="gap-1.5 font-mono text-xs shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
            <span>SEND</span>
          </Button>
        </form>
      </div>

    </Card>
  );
};
