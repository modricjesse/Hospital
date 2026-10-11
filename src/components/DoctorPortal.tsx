import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { SymptomIntake, TriageSeverity } from '../types/hospital';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { 
  Stethoscope, 
  Video, 
  CheckCircle2, 
  Clock, 
  Thermometer, 
  Pill, 
  Lock, 
  Filter,
  Search,
  Zap,
  ShieldAlert,
  ArrowRight
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
  } = useHospital();

  const [severityFilter, setSeverityFilter] = useState<'All' | TriageSeverity>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  const applyProtocol = (preset: 'lassa' | 'mpox' | 'sars' | 'cholera') => {
    if (preset === 'lassa') {
      setPathogenRef('Viral Hemorrhagic (Lassa Stage 1)');
      setIcd11Code('1D42.0');
      setQuarantineEnforced(true);
      setDurationDays(14);
      setMedicationName('Ribavirin 400mg + Paracetamol 500mg IV/Oral');
      setDosageSchedule('2 tablets orally every 8 hours for 10 days with strict isolation fluids');
      setClinicalNotes('Confirmed arenavirus hemorrhagic criteria. Barrier nursing and contact tracing alert dispatched.');
    } else if (preset === 'mpox') {
      setPathogenRef('Mpox (Monkeypox Clade II)');
      setIcd11Code('1E71');
      setQuarantineEnforced(true);
      setDurationDays(21);
      setMedicationName('Tecovirimat 600mg (TPOXX) + Zinc Calamine Topical');
      setDosageSchedule('1 capsule twice daily with fatty meal for 14 days');
      setClinicalNotes('Vesiculopustular skin lesions on hands and face. Mandatory 21-day quarantine until full crust desquamation.');
    } else if (preset === 'sars') {
      setPathogenRef('Respiratory SARS-CoV Variant');
      setIcd11Code('RA01');
      setQuarantineEnforced(true);
      setDurationDays(7);
      setMedicationName('Nirmatrelvir 300mg + Ritonavir 100mg (Paxlovid)');
      setDosageSchedule('1 dose pack orally every 12 hours for 5 days');
      setClinicalNotes('Acute respiratory viral manifestation with SpO2 95%. Home isolation and pulse oximetry monitoring enforced.');
    } else if (preset === 'cholera') {
      setPathogenRef('Acute Cholera (Vibrio cholerae)');
      setIcd11Code('1A40');
      setQuarantineEnforced(true);
      setDurationDays(5);
      setMedicationName('Azithromycin 1g Oral Single Dose + WHO ORS Packs');
      setDosageSchedule('Single stat oral antibiotic dose; continuous fluid replacement with 1L ORS per loose stool');
      setClinicalNotes('Severe dehydrating diarrhea with enteric pathogen confirmation. Enteric barrier quarantine instituted.');
    }
  };

  const filteredIntakes = intakes.filter(intake => {
    const matchesSev = severityFilter === 'All' || intake.severity === severityFilter;
    const matchesQuery = 
      !searchQuery || 
      intake.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intake.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intake.clinicalNotes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesQuery;
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
    <div className="space-y-4">
      
      {/* Streamlined Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
            Clinician Triage & Diagnostic Authority
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-mono">
            <span>SPECIALIST: <strong className="text-zinc-200">{currentUser.name}</strong></span>
            <span className="text-zinc-600">/</span>
            <span>LICENSE: <strong className="text-zinc-300">{currentUser.licenseNumber || 'MDCN-COMM-8821'}</strong></span>
            <span className="text-zinc-600">/</span>
            <span>ADDR: <strong className="text-zinc-300">{formatAddress(currentUser.walletAddress)}</strong></span>
            <span className="text-zinc-600">/</span>
            <span className="text-emerald-400 font-semibold">EVM AUTH</span>
          </div>
        </div>

        {activeSession && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onLaunchCall(activeSession.id)}
            className="gap-2 font-mono h-7.5 px-3 cursor-pointer"
          >
            <Video className="h-3.5 w-3.5" />
            <span>Active Call: {activeSession.patientName}</span>
          </Button>
        )}
      </div>

      {commitSuccess && (
        <Alert variant="success">
          <CheckCircle2 className="h-5 w-5" />
          <div className="space-y-1">
            <AlertTitle className="text-sm font-semibold text-white">
              Diagnosis and Quarantine Order Successfully Mined On-Chain
            </AlertTitle>
            <AlertDescription className="font-mono text-xs">
              Block #{commitSuccess.blockNumber} · Tx Hash: {commitSuccess.txHash}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Main Grid: 7 cols queue, 5 cols comitter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Triage Intake Queue */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <span>Patient Intake Queue</span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {filteredIntakes.length} PENDING
                </Badge>
              </h3>
              <p className="text-xs text-zinc-400">Cases prioritized by algorithmic severity thresholds</p>
            </div>

            {/* Severity filter tabs */}
            <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-md self-start sm:self-auto">
              {(['All', 'Critical', 'High', 'Moderate'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-sm text-xs font-mono transition-colors ${
                    severityFilter === sev
                      ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <Input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, pathogen or symptoms..."
              className="pl-9 text-xs"
            />
          </div>

          {/* Cases List */}
          <div className="space-y-3">
            {filteredIntakes.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-sm">
                <p className="text-xs text-zinc-400 font-mono">No triage cases matching query criteria.</p>
              </div>
            ) : (
              filteredIntakes.map(intake => {
                const isSelected = selectedIntake?.id === intake.id;
                const isPending = intake.status === 'Pending_Triage';
                const isInConsult = intake.status === 'In_Consultation';

                return (
                  <Card
                    key={intake.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'border-rose-500/80 bg-zinc-950/90'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm font-sans">{intake.patientName}</span>
                          <span className="font-mono text-zinc-500 text-[10px]">
                            {formatAddress(intake.patientAddress)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={intake.severity === 'Critical' ? 'swiss' : intake.severity === 'High' ? 'warning' : 'secondary'}
                            className="text-[10px] font-mono"
                          >
                            ▪ {intake.severity.toUpperCase()}
                          </Badge>
                          <span className="text-xs font-mono font-bold text-rose-400 tabular-nums">
                            {intake.temperature.toFixed(1)}°C
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-sm space-y-1">
                        <div className="font-semibold text-rose-400 text-xs font-mono">{intake.category}</div>
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">{intake.clinicalNotes}</p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {intake.visibleSigns.map(sign => (
                          <span
                            key={sign}
                            className="text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-sm"
                          >
                            {sign}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 text-xs">
                        <div className="flex items-center gap-3 text-zinc-500 font-mono text-[10px]">
                          <span>EXP: {intake.exposureDays}d</span>
                          <span>/</span>
                          <span>CID: {formatTxHash(intake.ipfsHash)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isPending && (
                            <Button
                              variant="swiss"
                              size="sm"
                              onClick={() => handleAcceptCase(intake)}
                              className="font-mono text-[11px]"
                            >
                              <Video className="h-3.5 w-3.5" />
                              <span>Accept & Video Call</span>
                            </Button>
                          )}

                          {isInConsult && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedIntake(intake);
                                if (activeSession) onLaunchCall(activeSession.id);
                              }}
                              className="font-mono text-[11px] text-teal-400 border-teal-500/40"
                            >
                              <Stethoscope className="h-3.5 w-3.5" />
                              <span>In Consultation</span>
                            </Button>
                          )}

                          <Button
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedIntake(intake)}
                            className="font-mono text-[11px]"
                          >
                            {isSelected ? '✓ Selected' : 'Select'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Diagnostic Committer */}
        <div className="lg:col-span-5">
          <Card className="sticky top-20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                  SOLIDITY FUNCTION // RECORD_CONSULTATION
                </span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  GAS OPTIMIZED
                </Badge>
              </div>
              <CardTitle className="text-base">Commit Diagnosis On-Chain</CardTitle>
              <CardDescription>
                Seals permanent clinical diagnostic records and emits tamper-evident quarantine smart alerts.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {selectedIntake ? (
                <div className="p-2.5 rounded-sm bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[9px]">TARGET PATIENT:</span>
                    <span className="font-bold text-white font-sans">{selectedIntake.patientName}</span>
                  </div>
                  <span className="text-rose-400 text-[11px]">{formatAddress(selectedIntake.patientAddress)}</span>
                </div>
              ) : (
                <div className="p-3 rounded-sm bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between">
                  <span className="text-zinc-400 font-mono text-[11px]">Select a patient from the queue</span>
                  {intakes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedIntake(intakes[0])}
                      className="text-rose-400 hover:underline font-mono text-xs"
                    >
                      Pick {intakes[0].patientName} →
                    </button>
                  )}
                </div>
              )}

              {/* 1-Click Protocol Presets */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-sm space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-zinc-300 font-mono uppercase text-[10px]">
                    1-CLICK PROTOCOL PRESETS
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">WHO / NCDC</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => applyProtocol('lassa')}
                    className="justify-start text-rose-300 h-8"
                  >
                    ⚡ Lassa Fever
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => applyProtocol('mpox')}
                    className="justify-start text-amber-300 h-8"
                  >
                    ⚡ Mpox Clade II
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => applyProtocol('sars')}
                    className="justify-start text-blue-300 h-8"
                  >
                    ⚡ SARS Variant
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => applyProtocol('cholera')}
                    className="justify-start text-teal-300 h-8"
                  >
                    ⚡ Acute Cholera
                  </Button>
                </div>
              </div>

              <form onSubmit={handleCommitDiagnosis} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-zinc-300 font-semibold font-mono text-[10px] uppercase">
                    PATHOGEN REFERENCE
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
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 focus:border-rose-500 focus:outline-none font-sans"
                  >
                    <option value="Viral Hemorrhagic (Lassa Stage 1)">Viral Hemorrhagic (Lassa Stage 1)</option>
                    <option value="Mpox (Monkeypox Clade II)">Mpox (Monkeypox Clade II)</option>
                    <option value="Respiratory SARS-CoV Variant">Respiratory SARS-CoV Variant</option>
                    <option value="Acute Cholera (Vibrio cholerae)">Acute Cholera (Vibrio cholerae)</option>
                    <option value="Measles (Morbillivirus)">Measles (Morbillivirus)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-zinc-300 font-semibold font-mono text-[10px] uppercase">
                    ICD-11 CLASSIFICATION CODE
                  </label>
                  <Input
                    type="text"
                    value={icd11Code}
                    onChange={e => setIcd11Code(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                {/* Legal Quarantine Enforcement */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-200 font-sans">Enforce Legal Quarantine</div>
                      <div className="text-[10px] text-zinc-500 font-mono">Emits QuarantineEnforced event</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={quarantineEnforced}
                      onChange={e => setQuarantineEnforced(e.target.checked)}
                      className="h-4 w-4 accent-rose-500 cursor-pointer"
                    />
                  </div>

                  {quarantineEnforced && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-zinc-400 text-[10px] font-mono">
                        <span>ISOLATION DURATION:</span>
                        <span className="text-rose-400 font-bold">{durationDays} DAYS</span>
                      </div>
                      <input
                        type="range"
                        min="7"
                        max="30"
                        value={durationDays}
                        onChange={e => setDurationDays(parseInt(e.target.value))}
                        className="w-full accent-rose-500 h-1 bg-zinc-800 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Prescription */}
                <div className="space-y-1.5">
                  <label className="block text-zinc-300 font-semibold font-mono text-[10px] uppercase">
                    ELECTRONIC PRESCRIPTION (RX)
                  </label>
                  <Input
                    type="text"
                    value={medicationName}
                    onChange={e => setMedicationName(e.target.value)}
                    placeholder="Medication name..."
                    className="mb-2 text-xs"
                  />
                  <Input
                    type="text"
                    value={dosageSchedule}
                    onChange={e => setDosageSchedule(e.target.value)}
                    placeholder="Dosage instruction schedule..."
                    className="text-xs"
                  />
                </div>

                {/* Clinical Notes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-zinc-300 font-semibold font-mono text-[10px] uppercase">
                      EXAMINATION FINDINGS (ENCRYPTED)
                    </label>
                    <AudioTranscriber
                      onTranscriptionComplete={text =>
                        setClinicalNotes(prev => (prev ? `${prev} ${text}` : text))
                      }
                      buttonLabel="Voice Dictate"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={clinicalNotes}
                    onChange={e => setClinicalNotes(e.target.value)}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-200 focus:border-rose-500 focus:outline-none resize-none font-sans"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!selectedIntake || isMining}
                  variant="swiss"
                  size="default"
                  className="w-full gap-2 font-mono"
                >
                  <Lock className="h-4 w-4" />
                  <span>{isMining ? 'MINING BLOCK ON-CHAIN...' : 'SIGN & RECORD CONSULTATION (SOLIDITY)'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
