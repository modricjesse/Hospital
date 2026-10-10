import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { SymptomIntake, TriageSeverity } from '../types/hospital';
import { 
  Stethoscope, 
  Video, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Thermometer, 
  Pill, 
  Lock, 
  ExternalLink,
  Filter,
  UserCheck
} from 'lucide-react';
import { formatAddress, formatTxHash } from '../utils/crypto';
import { AudioTranscriber } from './AudioTranscriber';

interface DoctorPortalProps {
  onLaunchCall: (consultId: string) => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({ onLaunchCall }) => {
  const { 
    currentUser, 
    intakes, 
    acceptTriageCase, 
    activeSession, 
    commitDiagnosisOnChain, 
    isMining,
    onChainRecords 
  } = useHospital();

  const [severityFilter, setSeverityFilter] = useState<'All' | TriageSeverity>('All');
  const [selectedIntake, setSelectedIntake] = useState<SymptomIntake | null>(null);

  // Diagnostic Commit Form State
  const [pathogenRef, setPathogenRef] = useState<string>('Viral Hemorrhagic (Lassa Stage 1)');
  const [icd11Code, setIcd11Code] = useState<string>('1D42.0');
  const [isCommunicable, setIsCommunicable] = useState<boolean>(true);
  const [quarantineEnforced, setQuarantineEnforced] = useState<boolean>(true);
  const [durationDays, setDurationDays] = useState<number>(14);
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    'Patient evaluated via WebRTC video stream. Physical inspection demonstrates facial edema and macular exanthem. Immediate barrier isolation protocol instituted.'
  );
  const [medicationName, setMedicationName] = useState<string>('Ribavirin 400mg + IV Fluid Hydration Pack');
  const [dosageSchedule, setDosageSchedule] = useState<string>('2 tablets orally every 8 hours with meals for 10 days');
  const [commitSuccess, setCommitSuccess] = useState<{ txHash: string; blockNumber: number } | null>(null);

  const filteredIntakes = intakes.filter(intake => {
    if (severityFilter === 'All') return true;
    return intake.severity === severityFilter;
  });

  const handleAcceptCase = (intake: SymptomIntake) => {
    setSelectedIntake(intake);
    const session = acceptTriageCase(intake.id);
    onLaunchCall(session.id);
  };

  const handleCommitDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntake && !activeSession) return;

    const consultId = activeSession ? activeSession.id : `consult-${Date.now()}`;
    const result = await commitDiagnosisOnChain({
      consultationId: consultId,
      pathogenRef,
      icd11Code,
      isCommunicable,
      quarantineEnforced,
      durationDays,
      clinicalNotes,
      prescriptionData: medicationName ? {
        medicationName,
        dosageSchedule,
        durationDays,
      } : undefined,
    });

    setCommitSuccess(result);
    setTimeout(() => setCommitSuccess(null), 8000);
  };

  return (
    <div className="space-y-8">
      {/* Header and Doctor credentials */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Clinician Triage & Diagnostic Authority
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Specialist: {currentUser.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{formatAddress(currentUser.walletAddress)}</span>
            <span aria-hidden="true">·</span>
            <span>License: {currentUser.licenseNumber || 'MDCN-COMM-8821'}</span>
            <span aria-hidden="true">·</span>
            <span>Smart Contract Role: Certified Doctor (EVM Verified)</span>
          </div>
        </div>

        {activeSession && (
          <button
            onClick={() => onLaunchCall(activeSession.id)}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors flex items-center gap-2 self-start"
          >
            <Video className="h-4 w-4" />
            <span>Return to Active Call with {activeSession.patientName}</span>
          </button>
        )}
      </div>

      {commitSuccess && (
        <div className="rounded-xl border border-teal-500/50 bg-teal-950/50 p-4 text-xs text-teal-200 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-white">
              Diagnosis and Quarantine Order Successfully Mined On-Chain!
            </div>
            <div className="font-mono text-slate-300">
              Block #{commitSuccess.blockNumber} · Tx Hash: {commitSuccess.txHash}
            </div>
            <div className="text-slate-400">
              Events emitted: <code className="text-teal-300">ConsultationLogged</code>,{' '}
              <code className="text-teal-300">QuarantineEnforced</code>, and{' '}
              <code className="text-teal-300">PublicHealthAlert</code> dispatched to State CDC.
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Triage Queue on Left, Diagnosis Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Triage Case Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Patient Intake Queue</h2>
              <p className="text-xs text-slate-400">Real-time communicable cases pending clinical review</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
              {(['All', 'Critical', 'High', 'Moderate'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    severityFilter === sev
                      ? 'bg-teal-500/20 text-teal-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredIntakes.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">No triage cases matching current criteria.</p>
              </div>
            ) : (
              filteredIntakes.map(intake => {
                const isSelected = selectedIntake?.id === intake.id;
                const isPending = intake.status === 'Pending_Triage';
                const isInConsult = intake.status === 'In_Consultation';

                return (
                  <div
                    key={intake.id}
                    className={`border rounded-xl p-5 transition-colors ${
                      isSelected
                        ? 'border-teal-500/60 bg-slate-900/90'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{intake.patientName}</span>
                        <span className="font-mono text-slate-400 text-xs">
                          {formatAddress(intake.patientAddress)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          intake.severity === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800/60' :
                          intake.severity === 'High' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {intake.severity} Priority
                        </span>

                        <span className="text-[11px] font-mono text-slate-400">
                          {intake.temperature.toFixed(1)}°C
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 mb-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                      <div className="font-medium text-teal-400 mb-1">{intake.category}</div>
                      <p className="text-slate-300 leading-relaxed">{intake.clinicalNotes}</p>
                    </div>

                    {/* Tags / Signs checklist */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {intake.visibleSigns.map(sign => (
                        <span
                          key={sign}
                          className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded"
                        >
                          {sign}
                        </span>
                      ))}
                    </div>

                    {/* Footer info & CTA */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                        <span>Exposure: {intake.exposureDays}d</span>
                        <span aria-hidden="true">·</span>
                        <span>IPFS: {formatTxHash(intake.ipfsHash)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={() => handleAcceptCase(intake)}
                            className="px-3.5 py-1.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-1.5"
                          >
                            <Video className="h-3.5 w-3.5" />
                            <span>Accept & Video Call</span>
                          </button>
                        )}

                        {isInConsult && (
                          <button
                            onClick={() => {
                              setSelectedIntake(intake);
                              if (activeSession) onLaunchCall(activeSession.id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 font-semibold text-xs border border-teal-500/30 flex items-center gap-1.5"
                          >
                            <Stethoscope className="h-3.5 w-3.5" />
                            <span>In Consultation</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedIntake(intake)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            isSelected
                              ? 'bg-slate-800 text-white border-slate-600'
                              : 'text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          Select for Diagnosis
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: On-Chain Diagnostic Committer (5 cols) */}
        <div className="lg:col-span-5">
          <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-6 sticky top-20">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-white">Commit Diagnosis On-Chain</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Executes Solidity function <code className="text-teal-400 font-mono">recordConsultation(...)</code> to log permanent diagnosis and enforce statutory quarantine.
              </p>
            </div>

            {selectedIntake ? (
              <div className="mb-4 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px]">Patient Selected</span>
                  <span className="font-semibold text-white">{selectedIntake.patientName}</span>
                </div>
                <span className="font-mono text-slate-400 text-[11px]">{formatAddress(selectedIntake.patientAddress)}</span>
              </div>
            ) : (
              <div className="mb-4 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300">
                Please select a patient from the intake queue to commit diagnosis.
              </div>
            )}

            <form onSubmit={handleCommitDiagnosis} className="space-y-4 text-xs">
              {/* Pathogen */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Confirmed Pathogen Reference
                </label>
                <select
                  value={pathogenRef}
                  onChange={e => {
                    setPathogenRef(e.target.value);
                    if (e.target.value.includes('Lassa')) setIcd11Code('1D42.0');
                    else if (e.target.value.includes('Mpox')) setIcd11Code('1E71');
                    else if (e.target.value.includes('SARS')) setIcd11Code('RA01');
                    else if (e.target.value.includes('Cholera')) setIcd11Code('1A40');
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                >
                  <option value="Viral Hemorrhagic (Lassa Stage 1)">Viral Hemorrhagic (Lassa Stage 1)</option>
                  <option value="Mpox (Monkeypox Clade II)">Mpox (Monkeypox Clade II)</option>
                  <option value="Respiratory SARS-CoV Variant">Respiratory SARS-CoV Variant</option>
                  <option value="Acute Cholera (Vibrio cholerae)">Acute Cholera (Vibrio cholerae)</option>
                  <option value="Measles (Morbillivirus)">Measles (Morbillivirus)</option>
                </select>
              </div>

              {/* ICD-11 Code */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  ICD-11 Diagnostic Classification
                </label>
                <input
                  type="text"
                  value={icd11Code}
                  onChange={e => setIcd11Code(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 font-mono focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Quarantine enforcement toggle & duration */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">Enforce Legal Quarantine</div>
                    <div className="text-[10px] text-slate-400">Emits QuarantineEnforced event to ledger</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={quarantineEnforced}
                    onChange={e => setQuarantineEnforced(e.target.checked)}
                    className="h-4 w-4 accent-teal-400 rounded cursor-pointer"
                  />
                </div>

                {quarantineEnforced && (
                  <div>
                    <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                      <span>Mandatory Duration</span>
                      <span className="font-mono text-teal-400 font-bold">{durationDays} Days</span>
                    </div>
                    <input
                      type="range"
                      min="7"
                      max="30"
                      value={durationDays}
                      onChange={e => setDurationDays(parseInt(e.target.value))}
                      className="w-full accent-teal-400 h-1.5 bg-slate-800 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Electronic Prescription */}
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Electronic Prescription (Rx)
                </label>
                <input
                  type="text"
                  value={medicationName}
                  onChange={e => setMedicationName(e.target.value)}
                  placeholder="Medication name and dosage form..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 mb-2 focus:border-teal-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={dosageSchedule}
                  onChange={e => setDosageSchedule(e.target.value)}
                  placeholder="Dosage instruction schedule..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Clinical Notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-300 font-medium">
                    Off-Chain Examination Findings (Encrypted)
                  </label>
                  <AudioTranscriber
                    onTranscriptionComplete={text =>
                      setClinicalNotes(prev => (prev ? `${prev} ${text}` : text))
                    }
                    buttonLabel="Dictate Findings (gemini-3.5-transcribe)"
                  />
                </div>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-200 focus:border-teal-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedIntake || isMining}
                className="w-full py-2.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock className="h-4 w-4" />
                <span>{isMining ? 'Mining Block & Emitting Events...' : 'Sign & Record Consultation (Solidity)'}</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
