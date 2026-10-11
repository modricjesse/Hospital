import React, { useState, useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';
import { getCachedAccessToken, auth } from '../firebase';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Mail, Send, Inbox, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';

interface GmailMessage {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export const GmailAssistantModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentUser, signInWithGoogle, addToast } = useHospital();
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>('inbox');
  
  // Compose state
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('Hospi-Chain Clinical Update / Prescription');
  const [body, setBody] = useState('Dear Patient,\n\nYour consultation and prescription records have been verified on the Hospi-Chain tamper-proof ledger.\n\nStay safe and follow quarantine protocols.\n\nBest regards,\nHospi-Chain Medical Board');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const accessToken = getCachedAccessToken();
  const isGoogleAuthed = !!auth.currentUser && !!accessToken;

  const fetchInbox = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Gmail API error: ${res.statusText}`);
      }
      const data = await res.json();
      const list = data.messages || [];
      
      // Fetch details for each message
      const detailedMessages: GmailMessage[] = await Promise.all(
        list.map(async (msg: { id: string; threadId: string }) => {
          try {
            const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const detail = await detailRes.json();
            const headers = detail.payload?.headers || [];
            const subjectHeader = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
            const fromHeader = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
            const dateHeader = headers.find((h: any) => h.name === 'Date')?.value || '';
            return {
              id: msg.id,
              threadId: msg.threadId,
              snippet: detail.snippet,
              subject: subjectHeader,
              from: fromHeader,
              date: dateHeader,
            };
          } catch {
            return { id: msg.id, threadId: msg.threadId, snippet: '(Unable to load details)' };
          }
        })
      );

      setMessages(detailedMessages);
    } catch (err: any) {
      console.error('Failed to fetch Gmail inbox:', err);
      setErrorMsg(err.message || 'Failed to fetch Gmail messages.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isGoogleAuthed) {
      fetchInbox();
    }
  }, [isOpen, isGoogleAuthed]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !subject || !body) {
      addToast({ type: 'error', title: 'Missing fields', message: 'Please fill out recipient, subject, and body.' });
      return;
    }

    // MANDATORY User Confirmation for sending email
    const confirmed = window.confirm(`Are you sure you want to send this email via Gmail to ${recipient}?`);
    if (!confirmed) return;

    if (!accessToken) {
      addToast({ type: 'error', title: 'Authentication Required', message: 'Please sign in with Google to use Gmail.' });
      return;
    }

    setIsSending(true);
    try {
      const emailContent = [
        `To: ${recipient}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        '',
        body,
      ].join('\r\n');

      const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedEmail }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to send email');
      }

      addToast({ type: 'success', title: 'Email Sent Successfully', message: `Message dispatched to ${recipient}` });
      setActiveTab('inbox');
      setRecipient('');
      fetchInbox();
    } catch (err: any) {
      console.error('Gmail send error:', err);
      addToast({ type: 'error', title: 'Failed to Send Email', message: err.message });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-3xl bg-card text-card-foreground border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500 font-bold">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Hospi-Chain Gmail Integration</h2>
              <p className="text-xs text-muted-foreground">Secure patient communications & outbreak dispatch via Gmail API</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isGoogleAuthed ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <Mail className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Connect Your Google Account</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  To view inbox messages and dispatch clinical updates or prescriptions via Gmail, please authenticate with Google.
                </p>
              </div>
              <Button 
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                    addToast({ type: 'success', title: 'Connected', message: 'Google account linked successfully.' });
                    fetchInbox();
                  } catch (e: any) {
                    addToast({ type: 'error', title: 'Auth Failed', message: e.message });
                  }
                }}
                className="gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2.5 rounded-lg shadow"
              >
                <ShieldCheck className="h-4 w-4" /> Sign in with Google (Gmail Access)
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Nav Tabs & Actions */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('inbox')}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                      activeTab === 'inbox' 
                        ? 'bg-primary text-primary-foreground shadow' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <Inbox className="h-3.5 w-3.5" /> Gmail Inbox ({messages.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('compose')}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                      activeTab === 'compose' 
                        ? 'bg-primary text-primary-foreground shadow' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" /> Compose & Send
                  </button>
                </div>

                {activeTab === 'inbox' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchInbox} 
                    disabled={isLoading}
                    className="gap-1.5 text-xs h-8"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                  </Button>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {activeTab === 'inbox' ? (
                <div className="space-y-3">
                  {isLoading && messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-xs animate-pulse">
                      Loading Gmail inbox messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-xs">
                      No messages found in inbox.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {messages.map(msg => (
                        <div key={msg.id} className="p-3.5 rounded-lg border border-border bg-card/50 hover:bg-muted/30 transition-all space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground truncate max-w-[65%]">{msg.subject || '(No Subject)'}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{msg.date ? new Date(msg.date).toLocaleDateString() : ''}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{msg.from}</p>
                          <p className="text-xs text-card-foreground/80 line-clamp-2 mt-1">{msg.snippet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Recipient Email</label>
                    <input 
                      type="email" 
                      value={recipient} 
                      onChange={e => setRecipient(e.target.value)} 
                      placeholder="patient@example.com" 
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                    <input 
                      type="text" 
                      value={subject} 
                      onChange={e => setSubject(e.target.value)} 
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Message Body</label>
                    <textarea 
                      rows={6}
                      value={body} 
                      onChange={e => setBody(e.target.value)} 
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setActiveTab('inbox')}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSending}
                      className="gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs"
                    >
                      {isSending ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Dispatch via Gmail
                    </Button>
                  </div>
                </form>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/40 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Secure Gmail API Connected
          </span>
          <span>Hospi-Chain Encrypted Telemedicine</span>
        </div>

      </div>
    </div>
  );
};
