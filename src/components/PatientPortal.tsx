import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { SymptomIntake } from '../types/hospital';
import { 
  Thermometer, 
  Clock, 
  FileCheck2, 
  ShieldAlert, 
  Video, 
  Pill, 
  CheckCircle2, 
  AlertTriangle, 
  QrCode, 
  ExternalLink,
  ChevronRight,
  Upload,
  Lock
} from 'lucide-react';
import { formatAddress, formatTxHash, generateSvgQrMatrix } from '../utils/crypto';

export const PatientPortal: React.FC<{ onLaunchCall: (consultId: string) => void }> = ({ onLaunchCall }) => {
  const { 
    currentUser, 
    intakes, 
    onChainRecords, 
    prescriptions, 
    submitSymptomIntake, 
    activeSession 
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
    <div className="space-y-8">
      {/* Top Banner / Welcome with unboxed metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Patient Telemedicine & Communicable Triage
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Identity: {currentUser.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{formatAddress(currentUser.walletAddress)}</span>
            <span aria-hidden="true">·</span>
            <span>Jurisdiction: {currentUser.jurisdiction || 'Enugu Health District'}</span>
            <span aria-hidden="true">·</span>
            <span>Cryptographic Session: Active</span>
          </div>
        </div>

        {/* Tab Controls (Buttons for interactive state) */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs self-start">
          <button
            onClick={() => setActiveTab('intake')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'intake'
                ? 'bg-teal-500/20 text-teal-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Clinical Intake
          </button>
          <button
            onClick={() => setActiveTab('quarantine')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'quarantine'
                ? 'bg-teal-500/20 text-teal-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Quarantine Pass
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'prescriptions'
                ? 'bg-teal-500/20 text-teal-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Prescriptions ({myPrescriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'records'
                ? 'bg-teal-500/20 text-teal-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ledger History
          </button>
        </div>
      </div>

      {/* Active Consultation Alert Banner if a doctor has accepted the case */}
      {activeSession && activeSession.patientAddress.toLowerCase() === currentUser.walletAddress.toLowerCase() && (
        <div className="rounded-xl border border-teal-500/40 bg-teal-950/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">
                Doctor {activeSession.doctorName} is Waiting in Consultation Room
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Encrypted WebRTC P2P Channel Ready · Room ID: <span className="font-mono text-teal-300">{activeSession.roomToken}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onLaunchCall(activeSession.id)}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5"
          >
            <Video className="h-4 w-4" />
            Join Consultation Call
          </button>
        </div>
      )}

      {/* TAB 1: Symptom Intake Form */}
      {activeTab === 'intake' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 border border-slate-800 bg-slate-900/60 rounded-xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white">Patient Clinical Intake Form</h2>
              <p className="text-xs text-slate-400 mt-1">
                Standardized triage intake modeled according to Section 3.3.7. Submissions are encrypted off-chain and referenced by an immutable SHA-256 IPFS hash on-chain.
              </p>
            </div>

            {submissionSuccess && (
              <div className="mb-6 rounded-lg bg-teal-950/60 border border-teal-700/60 p-4 text-xs text-teal-200 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Intake Transaction Successfully Signed & Transmitted</div>
                  <div className="mt-1 text-slate-300">
                    Your encrypted clinical intake has been submitted to the Infectious Disease triage queue. Attending specialists have been alerted in real time.
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  1. Primary Symptom Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
                >
                  <option value="Respiratory">Communicable / Respiratory (e.g., SARS-CoV, Influenza, TB)</option>
                  <option value="Viral Hemorrhagic">Viral Hemorrhagic (e.g., Lassa Fever, Ebola, Marburg)</option>
                  <option value="Dermatological / Pox">Dermatological / Pox (e.g., Mpox Clade II, Measles)</option>
                  <option value="Gastrointestinal">Gastrointestinal / Enteric (e.g., Acute Cholera)</option>
                  <option value="General Communicable">General Infectious Manifestation</option>
                </select>
              </div>

              {/* Temperature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-2">
                    <span className="font-medium">2. Body Temperature (°C)</span>
                    <span className="font-mono font-bold text-amber-400 tabular-nums">{temperature.toFixed(1)} °C</span>
                  </div>
                  <input
                    type="range"
                    min="36.0"
                    max="41.5"
                    step="0.1"
                    value={temperature}
                    onChange={e => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-teal-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>36.0 (Normal)</span>
                    <span>38.0 (Fever)</span>
                    <span>40.0+ (Hyperpyrexia)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    3. Symptom Onset Date
                  </label>
                  <input
                    type="date"
                    value={onsetDate}
                    onChange={e => setOnsetDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Visible Signs Checklist */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  4. Visible Signs Checklist
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {visibleSignsOptions.map(sign => {
                    const isChecked = selectedSigns.includes(sign);
                    return (
                      <button
                        type="button"
                        key={sign}
                        onClick={() => handleSignToggle(sign)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-colors ${
                          isChecked
                            ? 'bg-teal-950/60 border-teal-500/60 text-teal-200'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-teal-400 border-teal-400 text-slate-950' : 'border-slate-600'
                        }`}>
                          {isChecked && <span className="text-[10px] font-bold">✓</span>}
                        </div>
                        <span className="truncate">{sign}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exposure History */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    5. Known Exposure History (Days Ago)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={exposureDays}
                    onChange={e => setExposureDays(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    6. Attached Rapid Test / Laboratory Result
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={testAttachment}
                      onChange={e => setTestAttachment(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
                    />
                    <label className="cursor-pointer px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 shrink-0">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Browse...</span>
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

              {/* Clinical Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  7. Description of Current Symptoms & Location
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-200 focus:border-teal-500 focus:outline-none resize-none"
                  placeholder="Detail symptoms, travel history, or high-risk contacts..."
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  <span>{submitting ? 'Signing via Web3 Wallet...' : 'Submit & Sign Transaction via Wallet'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Triage Status & Protocol Info */}
          <div className="space-y-6">
            <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Triage Protocol Guidelines</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Under the Nigerian CDC & WHO communicable outbreak guidelines, cases presenting with temperatures ≥ 38.5°C and hemorrhagic or acute vesicular signs are prioritized as High/Critical.
              </p>
              
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Target Response Time</span>
                  <span className="font-mono text-teal-400 font-medium">&lt; 15 mins</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Data Cryptography</span>
                  <span className="font-mono text-slate-300">AES-256 GCM</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Proof Verification</span>
                  <span className="font-mono text-slate-300">SHA-256 On-Chain</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2">My Recent Submissions</h3>
              <div className="space-y-3 mt-3">
                {myIntakes.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No submissions recorded yet.</p>
                ) : (
                  myIntakes.slice(0, 3).map(intake => (
                    <div key={intake.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/50 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{intake.category}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          intake.severity === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800/60' :
                          intake.severity === 'High' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {intake.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{intake.clinicalNotes}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                        <span>CID: {formatTxHash(intake.ipfsHash)}</span>
                        <span>{new Date(intake.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Quarantine Pass & Countdown Registry */}
      {activeTab === 'quarantine' && (
        <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-6">
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold text-white mb-1">
              Smart-Contract-Enforced Quarantine Status
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Deterministic quarantine verification governed by <code className="text-teal-400 font-mono">HospitalCommunicableDiseaseLedger.sol</code>. State updates are signed by licensed epidemiologists and verifiable across jurisdictions without central database access.
            </p>

            {myQuarantineRecord ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Quarantine Pass Card */}
                <div className="md:col-span-2 border border-teal-500/30 bg-slate-950 rounded-xl p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                    <div>
                      <div className="text-xs font-mono uppercase text-teal-400 tracking-wider font-semibold">
                        Official Health Authority Pass
                      </div>
                      <div className="text-base font-bold text-white mt-0.5">
                        Statutory Quarantine Order #{myQuarantineRecord.consultationId.slice(-6).toUpperCase()}
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-amber-950/80 border border-amber-700/60 text-amber-300 font-mono text-[11px] rounded uppercase font-semibold">
                      {isQuarantineActive ? 'Active Isolation' : 'Isolation Cleared'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Patient Subject</span>
                      <span className="text-white font-medium">{currentUser.name}</span>
                      <span className="text-slate-400 font-mono text-[10px] block mt-0.5">{formatAddress(currentUser.walletAddress)}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Identified Pathogen</span>
                      <span className="text-rose-400 font-medium">{myQuarantineRecord.pathogenRef}</span>
                      <span className="text-slate-400 font-mono text-[10px] block mt-0.5">ICD-11: {myQuarantineRecord.icd11Code}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Certifying Physician</span>
                      <span className="text-slate-300 font-medium">{formatAddress(myQuarantineRecord.doctor)}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Enforced Jurisdictional Zone</span>
                      <span className="text-slate-300 font-medium">{currentUser.jurisdiction || 'Enugu North District'}</span>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-teal-400" />
                        <span>Mandatory Isolation Countdown</span>
                      </span>
                      <span className="font-mono text-teal-400 font-semibold">{hoursRemaining} Hours Remaining</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                      <div 
                        className="bg-teal-400 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(10, (1 - hoursRemaining / (14 * 24)) * 100))}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between mt-1.5 font-mono">
                      <span>Certified Inception: {new Date(myQuarantineRecord.timestamp * 1000).toLocaleDateString()}</span>
                      <span>Release: {new Date(myQuarantineRecord.quarantineExpiration * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-3 border-t border-slate-800">
                    <span>Block #{myQuarantineRecord.blockNumber}</span>
                    <span className="text-slate-500">Tx: {formatTxHash(myQuarantineRecord.txHash)}</span>
                  </div>
                </div>

                {/* QR Code Verification Card */}
                <div className="border border-slate-800 bg-slate-950 rounded-xl p-5 flex flex-col items-center text-center">
                  <div className="text-xs font-semibold text-slate-200 mb-1">Cryptographic Verifier</div>
                  <div className="text-[10px] text-slate-400 mb-3">Scannable by Border Control & State Epidemiologists</div>
                  
                  <div 
                    className="p-2 bg-white rounded-lg shadow-inner"
                    dangerouslySetInnerHTML={{
                      __html: generateSvgQrMatrix(`DEHOSP_QUARANTINE:${myQuarantineRecord.consultationId}:${myQuarantineRecord.txHash}`, 140)
                    }}
                  />

                  <div className="text-[10px] font-mono text-slate-500 mt-3 break-all">
                    SIG: {myQuarantineRecord.ipfsClinicalHash.slice(0, 18)}...
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 w-full text-center">
                    <span className="text-[11px] text-teal-400 font-medium">Status: Tamper-Proof</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                <CheckCircle2 className="h-8 w-8 text-teal-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-white">No Active Quarantine Enforced</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  You are currently not flagged under an active communicable quarantine order. If diagnosed by an attending clinician, your cryptographic pass will automatically appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: E-Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-6">
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Cryptographically Signed Prescriptions</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Electronic prescriptions recorded to the ledger to prevent prescription forgery and track therapeutic protocols.
                </p>
              </div>
            </div>

            {myPrescriptions.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                <Pill className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-white">No Prescriptions Issued</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Once your consultation is finalized by a certified physician, signed prescriptions will be issued here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myPrescriptions.map(rx => (
                  <div key={rx.id} className="border border-slate-800 bg-slate-950 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{rx.medicationName}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                          rx.dispensed ? 'bg-teal-950 text-teal-300 border border-teal-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {rx.dispensed ? 'Dispensed by Pharmacy' : 'Authorized · Ready for Dispensing'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-300">
                        {rx.dosageSchedule}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1 font-mono">
                        <span>Physician: {rx.doctorName}</span>
                        <span aria-hidden="true">·</span>
                        <span>Issued: {new Date(rx.issuanceTimestamp).toLocaleDateString()}</span>
                        <span aria-hidden="true">·</span>
                        <span>Token: {formatTxHash(rx.verificationHash)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3 self-end md:self-auto">
                      <div 
                        dangerouslySetInnerHTML={{
                          __html: generateSvgQrMatrix(`RX_TOKEN:${rx.id}:${rx.verificationHash}`, 64)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Ledger History */}
      {activeTab === 'records' && (
        <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">On-Chain Consultation Records</h2>
          <p className="text-xs text-slate-400 mb-6">
            Permanent, verifiable state records stored on the Ethereum-compatible consensus layer.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Consultation ID</th>
                  <th className="py-2.5 px-3">Pathogen Ref</th>
                  <th className="py-2.5 px-3">ICD-11</th>
                  <th className="py-2.5 px-3">Physician</th>
                  <th className="py-2.5 px-3">IPFS CID</th>
                  <th className="py-2.5 px-3">Block #</th>
                  <th className="py-2.5 px-3 text-right">Tx Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {onChainRecords
                  .filter(r => r.patient.toLowerCase() === currentUser.walletAddress.toLowerCase())
                  .map(record => (
                    <tr key={record.consultationId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-slate-200">{formatTxHash(record.consultationId)}</td>
                      <td className="py-3 px-3 text-white font-sans font-medium">{record.pathogenRef}</td>
                      <td className="py-3 px-3 text-slate-300">{record.icd11Code}</td>
                      <td className="py-3 px-3 text-slate-400">{formatAddress(record.doctor)}</td>
                      <td className="py-3 px-3 text-teal-400">{formatTxHash(record.ipfsClinicalHash)}</td>
                      <td className="py-3 px-3 text-slate-300">#{record.blockNumber}</td>
                      <td className="py-3 px-3 text-right text-slate-400">{formatTxHash(record.txHash)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
