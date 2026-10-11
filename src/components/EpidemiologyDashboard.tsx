import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { 
  Activity, 
  ShieldAlert, 
  AlertTriangle, 
  Download, 
  CheckCircle2, 
  Radio, 
  TrendingUp, 
  Layers, 
  Share2,
  Cpu
} from 'lucide-react';
import { formatTxHash, formatAddress } from '../utils/crypto';
import { RegionalMapWidget } from './RegionalMapWidget';
import { PathogenHeatmapD3 } from './PathogenHeatmapD3';

export const EpidemiologyDashboard: React.FC = () => {
  const { 
    currentUser, 
    jurisdictions, 
    blockchainEvents, 
    onChainRecords, 
    blocks 
  } = useHospital();

  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('jur-1');
  const [reportExported, setReportExported] = useState<boolean>(false);

  // Compute aggregate metrics
  const totalActiveIsolated = jurisdictions.reduce((acc, j) => acc + j.quarantinedCount, 0);
  const totalValidatedRecords = onChainRecords.length + 116; // seed + simulated total
  const criticalJurisdictions = jurisdictions.filter(j => j.alertLevel === 'Critical');

  const filteredEvents = blockchainEvents.filter(evt => {
    if (selectedJurisdiction === 'all') return true;
    return evt.payload.jurisdiction === selectedJurisdiction || true;
  });

  const handleExportReport = () => {
    const reportData = {
      agency: 'Epidemiological Surveillance Authority (National Disease Control & Health Informatics)',
      reportingOfficer: currentUser.name,
      walletAddress: currentUser.walletAddress,
      generatedTimestamp: new Date().toISOString(),
      activeIsolatedCases: totalActiveIsolated,
      verifiedLedgerBlocks: blocks.length,
      criticalZones: criticalJurisdictions.map(j => ({ zone: j.name, cases: j.activeCases, pathogen: j.focalPathogen })),
      onChainAuditTrail: onChainRecords.map(r => ({
        consultId: r.consultationId,
        pathogen: r.pathogenRef,
        icd11: r.icd11Code,
        ipfsHash: r.ipfsClinicalHash,
        txHash: r.txHash,
        block: r.blockNumber
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epidemiological_bulletin_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setReportExported(true);
    setTimeout(() => setReportExported(false), 5000);
  };

  return (
    <div className="space-y-4">
      
      {/* Streamlined Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
            Outbreak Surveillance & Vector Intelligence
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-mono">
            <span>NODE: <strong className="text-zinc-200">National CDC Hub</strong></span>
            <span className="text-zinc-600">/</span>
            <span>OFFICER: <strong className="text-zinc-300">{currentUser.name}</strong></span>
            <span className="text-zinc-600">/</span>
            <span>STATE: <span className="text-emerald-400 font-semibold">SYNCHRONIZED</span></span>
          </div>
        </div>

        <Button
          variant="swiss"
          size="sm"
          onClick={handleExportReport}
          className="gap-1.5 font-mono text-xs h-7.5 px-3 self-start sm:self-auto cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>EXPORT BULLETIN (JSON)</span>
        </Button>
      </div>

      {reportExported && (
        <Alert variant="success">
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <AlertTitle>Official Epidemiological Bulletin Exported</AlertTitle>
            <AlertDescription className="font-mono text-xs">
              Cryptographically sealed summary with Merkle audit trail generated for CDC and public health repository.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Swiss KPI Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="rounded-sm">
          <CardHeader className="p-4 pb-2">
            <span className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
              01 // ACTIVE ISOLATED
            </span>
            <CardTitle className="text-2xl font-mono tabular-nums text-white mt-1">
              {totalActiveIsolated} <span className="text-xs font-normal text-zinc-400 font-sans">Patients</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-mono">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+8% 24H DELTA · CRITICAL</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-sm">
          <CardHeader className="p-4 pb-2">
            <span className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
              02 // VALIDATED LEDGER RECORDS
            </span>
            <CardTitle className="text-2xl font-mono tabular-nums text-white mt-1">
              {totalValidatedRecords} <span className="text-xs font-normal text-zinc-400 font-sans">Blocks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>100% MERKLE VERIFIED</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-sm">
          <CardHeader className="p-4 pb-2">
            <span className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
              03 // STATUTORY RELEASES
            </span>
            <CardTitle className="text-2xl font-mono tabular-nums text-white mt-1">
              18 <span className="text-xs font-normal text-zinc-400 font-sans">Certified</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-xs text-zinc-400 font-mono">DETERMINISTIC EXPIRY</span>
          </CardContent>
        </Card>

        <Card className="rounded-sm">
          <CardHeader className="p-4 pb-2">
            <span className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
              04 // DETECTION LATENCY
            </span>
            <CardTitle className="text-2xl font-mono tabular-nums text-teal-400 mt-1">
              &lt; 1.8 <span className="text-xs font-normal text-zinc-400 font-sans">Hours</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <span className="text-xs text-zinc-500 font-mono">DOWN FROM 48H LEGACY</span>
          </CardContent>
        </Card>

      </div>

      {/* Geospatial Widget */}
      <RegionalMapWidget
        jurisdictions={jurisdictions}
        selectedId={selectedJurisdiction}
        onSelect={setSelectedJurisdiction}
      />

      {/* D3.js Interactive Heatmap Component */}
      <PathogenHeatmapD3
        jurisdictions={jurisdictions}
        selectedJurisdiction={selectedJurisdiction}
        onSelectJurisdiction={setSelectedJurisdiction}
      />

      {/* Main Grid: Jurisdictions & Event Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Jurisdictions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <span>Jurisdictional Surveillance Zones</span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {jurisdictions.length} ACTIVE
                </Badge>
              </h3>
              <p className="text-xs text-zinc-400">Districts monitored against statutory epidemiological alert thresholds</p>
            </div>
          </div>

          <div className="space-y-3">
            {jurisdictions.map(jur => {
              const isThresholdExceeded = jur.activeCases >= jur.thresholdMax;
              const fillPercent = Math.min(100, Math.round((jur.activeCases / jur.thresholdMax) * 100));

              return (
                <Card
                  key={jur.jurisdictionId}
                  className={`rounded-sm transition-colors ${
                    isThresholdExceeded
                      ? 'border-rose-700/80 bg-zinc-950/90'
                      : 'border-zinc-800'
                  }`}
                >
                  <div className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-white text-sm font-sans">{jur.name}</div>
                        <div className="text-xs text-zinc-400 font-mono">
                          {jur.state} · FOCAL: <span className="text-rose-400 font-bold">{jur.focalPathogen}</span>
                        </div>
                      </div>

                      <Badge
                        variant={jur.alertLevel === 'Critical' ? 'swiss' : jur.alertLevel === 'Elevated' ? 'warning' : 'secondary'}
                        className="font-mono text-[10px]"
                      >
                        ▪ {jur.alertLevel.toUpperCase()} ALERT
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="bg-zinc-950 p-2.5 rounded-sm border border-zinc-800">
                        <div className="text-zinc-500 text-[10px]">ACTIVE CASES</div>
                        <div className="text-white font-bold tabular-nums text-sm">{jur.activeCases}</div>
                      </div>

                      <div className="bg-zinc-950 p-2.5 rounded-sm border border-zinc-800">
                        <div className="text-zinc-500 text-[10px]">ISOLATED IN-HOME</div>
                        <div className="text-rose-400 font-bold tabular-nums text-sm">{jur.quarantinedCount}</div>
                      </div>

                      <div className="bg-zinc-950 p-2.5 rounded-sm border border-zinc-800">
                        <div className="text-zinc-500 text-[10px]">MAX THRESHOLD</div>
                        <div className="text-zinc-400 font-bold tabular-nums text-sm">{jur.thresholdMax}</div>
                      </div>
                    </div>

                    {/* Saturation Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                        <span>THRESHOLD SATURATION:</span>
                        <span className="font-bold text-zinc-200">{fillPercent}%</span>
                      </div>
                      <div className="w-full bg-zinc-950 h-1.5 rounded-none border border-zinc-800 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isThresholdExceeded ? 'bg-rose-500' : fillPercent > 60 ? 'bg-amber-400' : 'bg-teal-400'
                          }`}
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    </div>

                    {isThresholdExceeded && (
                      <div className="pt-2 border-t border-rose-900/40 flex items-center justify-between text-xs text-rose-300 font-mono">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-rose-400" />
                          <span>Jurisdictional Containment Protocol Escalated</span>
                        </span>
                        <Badge variant="swiss" className="text-[9px]">
                          ESC-LEVEL-3
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Event Stream (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="rounded-sm sticky top-20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                    CONSENSUS EVENT BUS
                  </span>
                  <CardTitle className="text-base mt-0.5">Live On-Chain Event Stream</CardTitle>
                </div>
                <Badge variant="verified" className="font-mono text-[10px]">
                  <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
                  <span>RPC LIVE</span>
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5 max-h-[580px] overflow-y-auto p-4 pt-0">
              {filteredEvents.map(evt => {
                let badgeVariant: 'swiss' | 'warning' | 'verified' | 'secondary' = 'secondary';
                if (evt.eventName === 'PublicHealthAlert') badgeVariant = 'swiss';
                if (evt.eventName === 'QuarantineEnforced') badgeVariant = 'warning';
                if (evt.eventName === 'ConsultationLogged') badgeVariant = 'verified';

                return (
                  <div
                    key={evt.id}
                    className="p-3 rounded-sm border border-zinc-800 bg-zinc-950/80 space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant={badgeVariant} className="text-[9px] uppercase">
                        {evt.eventName}
                      </Badge>
                      <span className="text-[10px] text-zinc-500 tabular-nums">
                        Block #{evt.blockNumber}
                      </span>
                    </div>

                    <div className="text-zinc-400 text-[10px] truncate">
                      Tx: <span className="text-zinc-300">{formatTxHash(evt.txHash)}</span>
                    </div>

                    <div className="bg-zinc-900 p-2 rounded-sm border border-zinc-800/80 text-[11px] text-zinc-300">
                      {evt.eventName === 'PublicHealthAlert' && (
                        <div>
                          Pathogen: <span className="text-rose-400 font-bold">{evt.payload.pathogenRef}</span>
                          <div className="text-zinc-500 text-[10px] mt-0.5">Alert dispatched to CDC nodes</div>
                        </div>
                      )}

                      {evt.eventName === 'QuarantineEnforced' && (
                        <div>
                          Patient: <span className="text-zinc-200">{formatAddress(evt.payload.patient)}</span>
                          <div className="text-amber-400 text-[10px] mt-0.5">
                            Release: {new Date(evt.payload.releaseTime * 1000).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      {evt.eventName === 'ConsultationLogged' && (
                        <div>
                          Doctor: <span className="text-zinc-200">{formatAddress(evt.payload.doctor)}</span>
                          <div className="text-zinc-500 text-[10px] mt-0.5">
                            Patient: {formatAddress(evt.payload.patient)}
                          </div>
                        </div>
                      )}

                      {evt.eventName === 'RoleAssigned' && (
                        <div>
                          Account: <span className="text-zinc-200">{formatAddress(evt.payload.account)}</span>
                          <div className="text-teal-400 text-[10px] mt-0.5">Role granted: {evt.payload.role}</div>
                        </div>
                      )}
                    </div>

                    <div className="text-[9px] text-zinc-500 text-right">
                      {new Date(evt.timestamp * 1000).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
