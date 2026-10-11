import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { SymptomIntake } from '../types/hospital';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { 
  Thermometer, 
  Clock, 
  Video, 
  Pill, 
  CheckCircle2, 
  Upload, 
  Lock, 
  Activity,
  FileCheck2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatAddress, formatTxHash, generateSvgQrMatrix } from '../utils/crypto';
import { AudioTranscriber } from './AudioTranscriber';

export const PatientPortal: React.FC<{ onLaunchCall: (consultId: string) => void }> = ({ onLaunchCall }) => {
  const { 
    currentUser, 
    intakes, 
    onChainRecords, 
    prescriptions, 
    submitSymptomIntake, 
    activeSession,
    dispensePrescription
  } = useHospital();

  // Intake Form State (Section 3.3.7 Input Design)
  const [category, setCategory] = useState<SymptomIntake['category']>('Respiratory');
  const [temperature, setTemperature] = useState<number>(38.8);
  const [onsetDate, setOnsetDate] = useState<string>('2026-09-01');
  const [exposureDays, setExposureDays] = useState<number>(5);
  const [selectedSigns, setSelectedSigns] = useState<string[]>(['Persistent Cough', 'Acute Rash', 'High Fever']);
  const [testAttachment, setTestAttachment] = useState<string>('test_result_scan.pdf');
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    'Persistent dry cough with high fever and rash spreading over trunk after exposure at community clinic.'
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'intake' | 'quarantine' | 'prescriptions' | 'records'>('intake');

  // Live Triage Pre-Assessment Calculation
  const isCriticalTemp = temperature >= 39.0;
  const isHighTemp = temperature >= 38.5;
  let liveSeverity: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
  if (isCriticalTemp || (isHighTemp && (category === 'Viral Hemorrhagic' || selectedSigns.includes('Dyspnea') || selectedSigns.includes('Hemoptysis')))) {
    liveSeverity = 'Critical';
  } else if (isHighTemp || selectedSigns.length >= 3 || exposureDays >= 5) {
    liveSeverity = 'High';
  } else if (temperature >= 37.8 || selectedSigns.length >= 2) {
    liveSeverity = 'Moderate';
  }

  const visibleSignsOptions = [
    'Persistent Cough',
    'Acute Rash',
    'High Fever',
    'Loss of Taste',
    'Dyspnea',
    'Hemoptysis',
    'Lymphadenopathy',
    'Facial Edema',
  ];

  const handleSignToggle = (sign: string) => {
    if (selectedSigns.includes(sign)) {
      setSelectedSigns(selectedSigns.filter(s => s !== sign));
    } else {
      setSelectedSigns([...selectedSigns, sign]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitSymptomIntake({
        category,
        temperature,
        onsetDate,
        visibleSigns: selectedSigns,
        exposureDays,
        testAttachmentName: testAttachment,
        clinicalNotes,
      });
      setSubmissionSuccess(true);
      setTimeout(() => setSubmissionSuccess(false), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Find active quarantine for current patient
  const myQuarantineRecord = onChainRecords.find(
    r => r.patient.toLowerCase() === currentUser.walletAddress.toLowerCase() && r.quarantineEnforced
  );

  const myPrescriptions = prescriptions.filter(
    p => p.patientAddress.toLowerCase() === currentUser.walletAddress.toLowerCase()
  );

  const myIntakes = intakes.filter(
    i => i.patientAddress.toLowerCase() === currentUser.walletAddress.toLowerCase()
  );

  // Time remaining calculation
  let hoursRemaining = 0;
  let isQuarantineActive = false;
  if (myQuarantineRecord) {
    const nowSec = Math.floor(Date.now() / 1000);
    if (myQuarantineRecord.quarantineExpiration > nowSec) {
      isQuarantineActive = true;
      hoursRemaining = Math.max(0, Math.floor((myQuarantineRecord.quarantineExpiration - nowSec) / 3600));
    }
  }

  return (
    <div className="space-y-4">
      
      {/* Streamlined Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
            Patient Portal & Quarantine Pass
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-mono">
            <span>PATIENT: <strong className="text-zinc-200">{currentUser.name}</strong></span>
            <span className="text-zinc-600">/</span>
            <span>ADDR: <strong className="text-zinc-300">{formatAddress(currentUser.walletAddress)}</strong></span>
            <span className="text-zinc-600">/</span>
            <span>DISTRICT: <strong className="text-zinc-300">{currentUser.jurisdiction || 'Health District'}</strong></span>
          </div>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex items-center gap-1 p-0.5 bg-zinc-950 border border-zinc-800 rounded-md self-start sm:self-center">
          <Button
            variant={activeTab === 'intake' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('intake')}
            className="text-xs h-7 px-2.5 cursor-pointer"
          >
            Clinical Intake
          </Button>
          <Button
            variant={activeTab === 'quarantine' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('quarantine')}
            className="text-xs h-7 px-2.5 cursor-pointer"
          >
            Quarantine Pass
          </Button>
          <Button
            variant={activeTab === 'prescriptions' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('prescriptions')}
            className="text-xs h-7 px-2.5 cursor-pointer"
          >
            Prescriptions ({myPrescriptions.length})
          </Button>
          <Button
            variant={activeTab === 'records' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('records')}
            className="text-xs h-7 px-2.5 cursor-pointer"
          >
            History
          </Button>
        </div>
      </div>

      {/* Active WebRTC Consultation Notification Callout */}
      {activeSession && activeSession.patientAddress.toLowerCase() === currentUser.walletAddress.toLowerCase() && (
        <Alert variant="default" className="border-teal-500/50 bg-teal-950/30">
          <Video className="h-5 w-5 text-teal-400" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full pl-2">
            <div>
              <AlertTitle className="text-sm font-semibold text-white">
                Telemedicine Consultation Live: Dr. {activeSession.doctorName}
              </AlertTitle>
              <AlertDescription className="text-xs text-zinc-300 font-mono mt-0.5">
                Room Token: <span className="text-teal-400">{activeSession.roomToken}</span> · End-to-End Encrypted WebRTC P2P
              </AlertDescription>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onLaunchCall(activeSession.id)}
              className="gap-2 shrink-0 font-sans"
            >
              <Video className="h-4 w-4" />
              <span>Join Consultation Room</span>
            </Button>
          </div>
        </Alert>
      )}

      {/* TAB 1: Clinical Symptom Intake */}
      {activeTab === 'intake' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                    INPUT SPECIFICATION // SECTION 3.3.7
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    SHA-256 HASHED
                  </Badge>
                </div>
                <CardTitle className="text-lg">Standardized Triage Intake Form</CardTitle>
                <CardDescription>
                  Submissions are signed via private key and anchored on the Ethereum-compatible ledger for immutable verification.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {submissionSuccess && (
                  <Alert variant="success" className="mb-6">
                    <CheckCircle2 className="h-5 w-5" />
                    <div>
                      <AlertTitle>Intake Successfully Committed to Mempool</AlertTitle>
                      <AlertDescription>
                        Your encrypted triage record has been broadcast to attending infectious disease clinicians.
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-200">
                      01 / PRIMARY PATHOGEN PROFILE CATEGORY
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as any)}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-rose-500 focus:outline-none font-sans"
                    >
                      <option value="Respiratory">Communicable / Respiratory (SARS-CoV-2, Avian Flu, TB)</option>
                      <option value="Viral Hemorrhagic">Viral Hemorrhagic Fever (Lassa Virus, Ebola, Marburg)</option>
                      <option value="Dermatological / Pox">Dermatological / Pox (Mpox Clade I/II, Measles)</option>
                      <option value="Gastrointestinal">Gastrointestinal / Enteric (Vibrio cholerae)</option>
                      <option value="General Communicable">General Infectious Manifestation</option>
                    </select>
                  </div>

                  {/* Temperature & Onset */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-zinc-300">
                        <span className="font-semibold">02 / CORE TEMPERATURE</span>
                        <span className="font-mono font-bold text-rose-400 tabular-nums">{temperature.toFixed(1)} °C</span>
                      </div>
                      <input
                        type="range"
                        min="36.0"
                        max="41.5"
                        step="0.1"
                        value={temperature}
                        onChange={e => setTemperature(parseFloat(e.target.value))}
                        className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5 pt-1">
                        {[
                          { val: 36.8, label: '36.8° Normal' },
                          { val: 38.2, label: '38.2° Fever' },
                          { val: 38.9, label: '38.9° High' },
                          { val: 40.1, label: '40.1° Critical' },
                        ].map(t => (
                          <button
                            key={t.val}
                            type="button"
                            onClick={() => setTemperature(t.val)}
                            className={`px-2 py-0.5 rounded-sm text-[10px] font-mono border transition-colors ${
                              temperature === t.val
                                ? 'bg-zinc-800 text-white border-zinc-600 font-bold'
                                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-zinc-200">
                        03 / SYMPTOM ONSET DATE
                      </label>
                      <Input
                        type="date"
                        value={onsetDate}
                        onChange={e => setOnsetDate(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Signs Checklist */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-200">
                      04 / CLINICAL SIGNS MATRIX
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {visibleSignsOptions.map(sign => {
                        const isChecked = selectedSigns.includes(sign);
                        return (
                          <button
                            type="button"
                            key={sign}
                            onClick={() => handleSignToggle(sign)}
                            className={`flex items-center gap-2 p-2 rounded-sm border text-xs text-left transition-colors font-mono ${
                              isChecked
                                ? 'bg-rose-950/30 border-rose-500/60 text-rose-200'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                            }`}
                          >
                            <div className={`h-3 w-3 rounded-none border flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-rose-600 border-rose-600 text-white' : 'border-zinc-700'
                            }`}>
                              {isChecked && <span className="text-[9px] font-bold">✓</span>}
                            </div>
                            <span className="truncate text-[11px] font-sans">{sign}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Pre-Assessment Meter */}
                  <div className="p-3.5 rounded-sm border border-zinc-800 bg-zinc-950/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5 font-sans">
                        <Activity className="h-3.5 w-3.5 text-rose-500" />
                        <span>Algorithmic Triage Score</span>
                      </span>
                      <Badge 
                        variant={liveSeverity === 'Critical' ? 'swiss' : liveSeverity === 'High' ? 'warning' : 'secondary'}
                        className="font-mono text-[10px]"
                      >
                        ▪ {liveSeverity.toUpperCase()} PRIORITY
                      </Badge>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-normal leading-relaxed">
                      {liveSeverity === 'Critical' && 'High-grade hyperpyrexia with severe signs detected. Instant prioritization to Isolation ICU queue.'}
                      {liveSeverity === 'High' && 'Communicable profile exceeds normal thresholds. Video consultation is recommended.'}
                      {liveSeverity === 'Moderate' && 'Elevated clinical markers. Scheduled telehealth consult advised.'}
                      {liveSeverity === 'Low' && 'Mild symptoms. Standard home isolation guidance active.'}
                    </p>
                  </div>

                  {/* Exposure Days & Attachment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-zinc-200">
                        05 / EXPOSURE HISTORY (DAYS AGO)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={exposureDays}
                        onChange={e => setExposureDays(parseInt(e.target.value) || 0)}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-zinc-200">
                        06 / LAB RESULT / DIAGNOSTIC SCAN
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={testAttachment}
                          onChange={e => setTestAttachment(e.target.value)}
                          className="font-mono text-xs flex-1"
                        />
                        <label className="cursor-pointer px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs rounded-md border border-zinc-700 flex items-center gap-1.5 shrink-0 font-mono">
                          <Upload className="h-3.5 w-3.5" />
                          <span>Attach</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                setTestAttachment(e.target.files[0].name);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Description & Gemini Dictation */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-zinc-200">
                        07 / CLINICAL NARRATIVE & CONTACTS
                      </label>
                      <AudioTranscriber
                        onTranscriptionComplete={text =>
                          setClinicalNotes(prev => (prev ? `${prev} ${text}` : text))
                        }
                        buttonLabel="Voice Dictation"
                      />
                    </div>
                    <textarea
                      rows={3}
                      value={clinicalNotes}
                      onChange={e => setClinicalNotes(e.target.value)}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200 focus:border-rose-500 focus:outline-none resize-none font-sans"
                      placeholder="Detail symptoms, travel history, high-density gatherings..."
                    />
                  </div>

                  {/* Submission CTA */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      variant="swiss"
                      size="lg"
                      className="w-full sm:w-auto gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      <span>{submitting ? 'SIGNING TRANSACTION...' : 'SIGN & BROADCAST TO TRIAGE LEDGER'}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Protocols & Recent History */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                  PROTOCOL SPECS
                </span>
                <CardTitle className="text-sm">Infectious Disease Triage Norms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Compliant with NCDC Communicable Disease Outbreak Response protocol. Fever ≥ 38.5°C triggers immediate isolation priority.
                </p>
                <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-sm font-mono text-xs">
                  <div className="flex justify-between p-2.5">
                    <span className="text-zinc-500">TRIAGE SLA:</span>
                    <span className="text-emerald-400 font-bold">&lt; 15 MINS</span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-zinc-500">ENCRYPTION:</span>
                    <span className="text-zinc-300">AES-256-GCM</span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-zinc-500">PROOF STANDARD:</span>
                    <span className="text-zinc-300">MERKLE ROOT / SHA-256</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                    RECORDS AUDIT
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {myIntakes.length} COMMITS
                  </Badge>
                </div>
                <CardTitle className="text-sm">My Intake History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {myIntakes.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic font-mono">No prior submissions recorded.</p>
                ) : (
                  myIntakes.slice(0, 3).map(intake => (
                    <div key={intake.id} className="p-3 rounded-sm border border-zinc-800 bg-zinc-950/60 space-y-1.5 font-sans">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-200">{intake.category}</span>
                        <Badge 
                          variant={intake.severity === 'Critical' ? 'swiss' : intake.severity === 'High' ? 'warning' : 'secondary'}
                          className="text-[9px] uppercase font-mono"
                        >
                          {intake.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1">{intake.clinicalNotes}</p>
                      <div className="flex justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-800/80">
                        <span>CID: {formatTxHash(intake.ipfsHash)}</span>
                        <span>{new Date(intake.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Quarantine Digital Pass */}
      {activeTab === 'quarantine' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                SMART CONTRACT STATE // QUARANTINE REGISTRY
              </span>
              <Badge variant={isQuarantineActive ? "warning" : "verified"} className="font-mono text-[10px]">
                {isQuarantineActive ? '▪ ACTIVE ISOLATION ORDER' : '▪ ZERO ACTIVE RESTRICTIONS'}
              </Badge>
            </div>
            <CardTitle className="text-lg">Cryptographic Quarantine Verification</CardTitle>
            <CardDescription>
              State updates are signed on-chain by licensed physicians and verifiable by border control authorities without central database exposure.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {myQuarantineRecord ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 border border-zinc-800 bg-zinc-950 rounded-sm p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-rose-500 tracking-wider font-bold">
                        MINISTRY OF HEALTH & CDC ENFORCEMENT
                      </div>
                      <div className="text-base font-bold text-white mt-0.5 font-sans">
                        Statutory Quarantine Order #{myQuarantineRecord.consultationId.slice(-6).toUpperCase()}
                      </div>
                    </div>
                    <Badge variant={isQuarantineActive ? "swiss" : "verified"}>
                      {isQuarantineActive ? 'Active Isolation' : 'Isolation Cleared'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">PATIENT SUBJECT:</span>
                      <span className="text-white font-bold font-sans">{currentUser.name}</span>
                      <span className="text-zinc-500 text-[10px] block">{formatAddress(currentUser.walletAddress)}</span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block text-[10px]">IDENTIFIED PATHOGEN:</span>
                      <span className="text-rose-400 font-bold font-sans">{myQuarantineRecord.pathogenRef}</span>
                      <span className="text-zinc-500 text-[10px] block">ICD-11: {myQuarantineRecord.icd11Code}</span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block text-[10px]">CERTIFYING PHYSICIAN:</span>
                      <span className="text-zinc-300">{formatAddress(myQuarantineRecord.doctor)}</span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block text-[10px]">ENFORCEMENT ZONE:</span>
                      <span className="text-zinc-300 font-sans">{currentUser.jurisdiction || 'Enugu Health District'}</span>
                    </div>
                  </div>

                  {/* Isolation Countdown */}
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5 text-rose-500" />
                        <span>Mandatory Isolation Countdown</span>
                      </span>
                      <span className="font-mono text-rose-400 font-bold tabular-nums">
                        {hoursRemaining} Hours Remaining
                      </span>
                    </div>
                    <div className="w-full bg-zinc-950 h-2 rounded-none border border-zinc-800 overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(10, (1 - hoursRemaining / (14 * 24)) * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 pt-1">
                      <span>Inception: {new Date(myQuarantineRecord.timestamp * 1000).toLocaleDateString()}</span>
                      <span>Release: {new Date(myQuarantineRecord.quarantineExpiration * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
                    <span>Block: #{myQuarantineRecord.blockNumber}</span>
                    <span>Tx: {formatTxHash(myQuarantineRecord.txHash)}</span>
                  </div>
                </div>

                {/* QR Code Verification Card */}
                <div className="border border-zinc-800 bg-zinc-950 rounded-sm p-6 flex flex-col items-center text-center space-y-4">
                  <div>
                    <div className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      VERIFIER QR CODE
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Border Checkpoint Scannable
                    </div>
                  </div>

                  <div 
                    className="p-3 bg-white rounded-none shadow-sm"
                    dangerouslySetInnerHTML={{
                      __html: generateSvgQrMatrix(`HOSPI_QUARANTINE:${myQuarantineRecord.consultationId}:${myQuarantineRecord.txHash}`, 140)
                    }}
                  />

                  <div className="font-mono text-[10px] text-zinc-500 break-all">
                    SIG: {myQuarantineRecord.ipfsClinicalHash.slice(0, 18)}...
                  </div>

                  <Badge variant="verified" className="font-mono text-[10px]">
                    ▪ VERIFIED ON-CHAIN
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center border border-dashed border-zinc-800 rounded-sm space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No Active Quarantine Enforced</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  You are currently clear of mandatory isolation protocols.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Verifiable Prescriptions */}
      {activeTab === 'prescriptions' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                SMART PRESCRIPTIONS // DISPENSING LEDGER
              </span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {myPrescriptions.length} AUTHORIZED
              </Badge>
            </div>
            <CardTitle className="text-lg">Cryptographically Signed E-Prescriptions</CardTitle>
            <CardDescription>
              Smart contract recorded pharmaceuticals to prevent duplication and black-market prescription tampering.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {myPrescriptions.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-zinc-800 rounded-sm space-y-2">
                <Pill className="h-8 w-8 text-zinc-600 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No Active Prescriptions</h3>
                <p className="text-xs text-zinc-400">
                  Signed prescriptions will appear here following doctor diagnosis.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myPrescriptions.map(rx => (
                  <div key={rx.id} className="border border-zinc-800 bg-zinc-950 rounded-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm font-sans">{rx.medicationName}</span>
                        <Badge variant={rx.dispensed ? "verified" : "warning"} className="font-mono text-[10px]">
                          {rx.dispensed ? '▪ DISPENSED' : '▪ AUTHORIZED'}
                        </Badge>
                      </div>

                      <div className="text-xs text-zinc-300 font-sans">
                        {rx.dosageSchedule}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500 font-mono pt-1">
                        <span>PHYSICIAN: {rx.doctorName}</span>
                        <span className="text-zinc-700">/</span>
                        <span>ISSUED: {new Date(rx.issuanceTimestamp).toLocaleDateString()}</span>
                        <span className="text-zinc-700">/</span>
                        <span>TOKEN: {formatTxHash(rx.verificationHash)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-4 self-end md:self-auto">
                      {!rx.dispensed ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => dispensePrescription(rx.id)}
                          className="font-mono text-xs gap-1.5"
                        >
                          <Pill className="h-3.5 w-3.5" />
                          <span>Dispense (Pharmacy)</span>
                        </Button>
                      ) : (
                        <Badge variant="verified" className="font-mono text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Dispensed {rx.dispensedAt ? new Date(rx.dispensedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}</span>
                        </Badge>
                      )}

                      <div 
                        dangerouslySetInnerHTML={{
                          __html: generateSvgQrMatrix(`RX_TOKEN:${rx.id}:${rx.verificationHash}`, 60)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: Ledger History */}
      {activeTab === 'records' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                ON-CHAIN PROOFS // ETH-EVM COMPATIBLE
              </span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                AUDIT TRAIL
              </Badge>
            </div>
            <CardTitle className="text-lg">Immutable Consultation History</CardTitle>
            <CardDescription>
              Every finalized consultation is sealed in a mined block with Merkle proof integrity.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] border-b border-zinc-800 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Consultation ID</th>
                    <th className="py-3 px-4">Pathogen Ref</th>
                    <th className="py-3 px-4">ICD-11</th>
                    <th className="py-3 px-4">Physician</th>
                    <th className="py-3 px-4">IPFS CID</th>
                    <th className="py-3 px-4">Block #</th>
                    <th className="py-3 px-4 text-right">Tx Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/40">
                  {onChainRecords
                    .filter(r => r.patient.toLowerCase() === currentUser.walletAddress.toLowerCase())
                    .map(record => (
                      <tr key={record.consultationId} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="py-3 px-4 text-zinc-300">{formatTxHash(record.consultationId)}</td>
                        <td className="py-3 px-4 text-white font-sans font-semibold">{record.pathogenRef}</td>
                        <td className="py-3 px-4 text-zinc-400">{record.icd11Code}</td>
                        <td className="py-3 px-4 text-zinc-400">{formatAddress(record.doctor)}</td>
                        <td className="py-3 px-4 text-teal-400">{formatTxHash(record.ipfsClinicalHash)}</td>
                        <td className="py-3 px-4 text-zinc-300 tabular-nums">#{record.blockNumber}</td>
                        <td className="py-3 px-4 text-right text-zinc-500">{formatTxHash(record.txHash)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};
