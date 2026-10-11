import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { 
  Layers, 
  ShieldCheck, 
  AlertOctagon, 
  Code, 
  FileCheck2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Copy,
  ChevronRight,
  Database
} from 'lucide-react';
import { formatTxHash, formatAddress } from '../utils/crypto';

export const LedgerExplorer: React.FC = () => {
  const { 
    blocks, 
    intakes, 
    simulateTampering, 
    verifyIntegrity, 
    restoreOriginalNotes,
    tamperedIntakeIds 
  } = useHospital();

  const [activeTab, setActiveTab] = useState<'blocks' | 'integrity' | 'contract'>('blocks');
  const [selectedBlockNumber, setSelectedBlockNumber] = useState<number>(blocks.length - 1);
  
  // Integrity Testing State
  const [selectedIntakeId, setSelectedIntakeId] = useState<string>(intakes[0]?.id || '');
  const [tamperInput, setTamperInput] = useState<string>('');
  const [auditResult, setAuditResult] = useState<{
    tested: boolean;
    isValid: boolean;
    onChainHash: string;
    calculatedHash: string;
    tampered: boolean;
  } | null>(null);

  const selectedIntake = intakes.find(i => i.id === selectedIntakeId);
  const selectedBlock = blocks.find(b => b.blockNumber === selectedBlockNumber) || blocks[blocks.length - 1];

  const handleRunAudit = async () => {
    if (!selectedIntakeId) return;
    const res = await verifyIntegrity(selectedIntakeId);
    setAuditResult({
      tested: true,
      ...res,
    });
  };

  const handleApplyTamper = () => {
    if (!selectedIntakeId || !tamperInput) return;
    simulateTampering(selectedIntakeId, tamperInput);
    setAuditResult(null);
  };

  const handleRestore = () => {
    if (!selectedIntakeId) return;
    restoreOriginalNotes(selectedIntakeId);
    setTamperInput('');
    setAuditResult(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Swiss Architectural Header */}
      {/* Streamlined Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
            Consensus Ledger & Tamper Verification
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-mono">
            <span>NETWORK: <strong className="text-zinc-200">Proof-of-Authority (PoA)</strong></span>
            <span className="text-zinc-600">/</span>
            <span>HEIGHT: <strong className="text-rose-400 tabular-nums">#{blocks.length - 1}</strong></span>
            <span className="text-zinc-600">/</span>
            <span>CONTRACT: <strong className="text-zinc-300">HospitalCommunicableDiseaseLedger.sol</strong></span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-0.5 bg-zinc-950 border border-zinc-800 rounded-md self-start sm:self-center">
          <Button
            variant={activeTab === 'blocks' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('blocks')}
            className="text-xs font-mono h-7 px-2.5 cursor-pointer"
          >
            Blocks ({blocks.length})
          </Button>
          <Button
            variant={activeTab === 'integrity' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('integrity')}
            className="text-xs font-mono h-7 px-2.5 cursor-pointer"
          >
            Tamper Lab
          </Button>
          <Button
            variant={activeTab === 'contract' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('contract')}
            className="text-xs font-mono h-7 px-2.5 cursor-pointer"
          >
            Solidity Contract
          </Button>
        </div>
      </div>

      {/* TAB 1: Blocks & Transactions Inspector */}
      {activeTab === 'blocks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Mined Blocks Feed (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                MINED BLOCKS ({blocks.length})
              </h3>
              <Badge variant="outline" className="font-mono text-[10px]">
                EVM MERKLE ROOTS
              </Badge>
            </div>

            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {[...blocks].reverse().map(block => (
                <button
                  key={block.blockNumber}
                  onClick={() => setSelectedBlockNumber(block.blockNumber)}
                  className={`w-full text-left p-4 rounded-sm border transition-colors font-mono text-xs ${
                    selectedBlockNumber === block.blockNumber
                      ? 'border-rose-500/80 bg-zinc-900 text-white font-semibold'
                      : 'border-zinc-800 bg-zinc-950/80 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">
                      Block #{block.blockNumber}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(block.timestamp * 1000).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-[10px] text-zinc-500 space-y-0.5">
                    <div className="truncate">PREV: {formatTxHash(block.previousHash)}</div>
                    <div className="truncate text-rose-400 font-bold">ROOT: {formatTxHash(block.merkleRoot)}</div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{block.transactions.length} TXS</span>
                    <span>NONCE: {block.nonce}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Block Inspector (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="rounded-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                    BLOCK DATA PACKET
                  </span>
                  <Badge variant="verified" className="font-mono text-[10px]">
                    SEALED BLOCK #{selectedBlock.blockNumber}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-mono">
                  Block #{selectedBlock.blockNumber} Specifications
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-zinc-950 p-3 rounded-sm border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase">Previous Block Hash</span>
                    <span className="text-zinc-300 break-all">{selectedBlock.previousHash}</span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-sm border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase">Merkle Root Hash</span>
                    <span className="text-rose-400 font-bold break-all">{selectedBlock.merkleRoot}</span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-sm border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase">Validator / Miner</span>
                    <span className="text-zinc-300 break-all">{selectedBlock.miner}</span>
                  </div>

                  <div className="bg-zinc-950 p-3 rounded-sm border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px] uppercase">Consensus Nonce</span>
                    <span className="text-zinc-300">{selectedBlock.nonce}</span>
                  </div>
                </div>

                {/* Transactions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    TRANSACTIONS ({selectedBlock.transactions.length})
                  </h4>

                  {selectedBlock.transactions.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-zinc-800 rounded-sm text-xs text-zinc-500 font-mono">
                      Genesis Block · No internal transactions.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedBlock.transactions.map(tx => (
                        <div
                          key={tx.txHash}
                          className="p-4 rounded-sm bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                            <span className="text-rose-400 font-bold">{tx.functionName}()</span>
                            <span className="text-zinc-400">Gas Used: {tx.gasUsed.toLocaleString()}</span>
                          </div>

                          <div className="text-[10px] text-zinc-500 truncate">
                            Tx Hash: <span className="text-zinc-300">{tx.txHash}</span>
                          </div>

                          <div className="text-[10px] text-zinc-500 truncate">
                            From: <span className="text-zinc-300">{formatAddress(tx.from)}</span> → To: <span className="text-zinc-300">{formatAddress(tx.to)}</span>
                          </div>

                          <div className="bg-zinc-900 p-2.5 rounded-sm border border-zinc-800 mt-2 text-[11px] text-zinc-300">
                            <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Execution Payload</div>
                            <pre className="overflow-x-auto text-teal-300 text-[10px]">
                              {JSON.stringify(tx.arguments, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      )}

      {/* TAB 2: Integrity & Tamper Testing Lab */}
      {activeTab === 'integrity' && (
        <Card className="rounded-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                SECURITY EXPERIMENT // CHAPTER 4.3.3 VALIDATION
              </span>
              <Badge variant="swiss" className="font-mono text-[10px]">
                TAMPER-PROOF AUDIT
              </Badge>
            </div>
            <CardTitle className="text-lg">Data Integrity & Resistance to Record Tampering</CardTitle>
            <CardDescription>
              Demonstrates mathematical verification: in a traditional centralized database, records can be modified undetected. In Hospi-Chain, any single byte alteration causes catastrophic SHA-256 hash mismatch.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Left Column: Record Selector & Tamper Payload */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-zinc-200 font-mono text-[10px] uppercase">
                    SELECT PATIENT INTAKE RECORD
                  </label>
                  <select
                    value={selectedIntakeId}
                    onChange={e => {
                      setSelectedIntakeId(e.target.value);
                      setAuditResult(null);
                    }}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-rose-500 focus:outline-none font-sans"
                  >
                    {intakes.map(intake => (
                      <option key={intake.id} value={intake.id}>
                        {intake.patientName} - {intake.category} ({intake.severity} Priority)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedIntake && (
                  <div className="p-4 rounded-sm border border-zinc-800 bg-zinc-950 space-y-3 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-sans">{selectedIntake.patientName}</span>
                      <Badge variant={tamperedIntakeIds.has(selectedIntake.id) ? "swiss" : "verified"}>
                        {tamperedIntakeIds.has(selectedIntake.id) ? 'TAMPERED STATE' : 'PRISTINE STATE'}
                      </Badge>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] block">CURRENT OFF-CHAIN CLINICAL NOTES:</span>
                      <p className="text-zinc-200 mt-1 p-2 bg-zinc-900 rounded-sm border border-zinc-800 font-sans text-xs">
                        {selectedIntake.clinicalNotes}
                      </p>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] block">IMMUTABLE ON-CHAIN HASH:</span>
                      <span className="text-rose-400 text-[11px] break-all">{selectedIntake.ipfsHash}</span>
                    </div>
                  </div>
                )}

                {/* Simulated Tampering Box */}
                <div className="p-4 rounded-sm border border-rose-900/60 bg-rose-950/20 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-rose-400 font-bold font-mono">
                    <AlertOctagon className="h-4 w-4" />
                    <span>SIMULATE MALICIOUS RECORD ALTERATION</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Inject falsified notes into off-chain storage to test whether the consensus protocol detects corruption:
                  </p>
                  <textarea
                    rows={2}
                    value={tamperInput}
                    onChange={e => setTamperInput(e.target.value)}
                    placeholder="e.g. Negative for Lassa virus; patient released from quarantine..."
                    className="w-full rounded-md border border-rose-900/60 bg-zinc-950 p-2 text-zinc-200 text-xs focus:outline-none font-sans"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="swiss"
                      size="sm"
                      onClick={handleApplyTamper}
                      disabled={!tamperInput}
                      className="font-mono text-xs"
                    >
                      Inject Tampered Notes
                    </Button>
                    {tamperedIntakeIds.has(selectedIntakeId) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestore}
                        className="font-mono text-xs"
                      >
                        Restore Original Notes
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Audit Verification Results */}
              <div className="border border-zinc-800 bg-zinc-950 rounded-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono uppercase">
                      CRYPTOGRAPHIC VERIFICATION ENGINE
                    </h4>
                    <p className="text-[11px] text-zinc-400">Recomputes SHA-256 and checks against on-chain block</p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRunAudit}
                    className="gap-2 font-mono text-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Run Integrity Audit</span>
                  </Button>
                </div>

                {auditResult ? (
                  <Alert variant={auditResult.isValid ? "success" : "destructive"}>
                    {auditResult.isValid ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    <div className="space-y-2">
                      <AlertTitle className="text-sm font-bold">
                        {auditResult.isValid ? 'Audit Result: 100% Valid & Untampered' : 'CRITICAL: Data Tampering Detected!'}
                      </AlertTitle>
                      <AlertDescription className="text-xs leading-relaxed">
                        {auditResult.isValid
                          ? 'The computed SHA-256 hash of the off-chain clinical notes matches the immutable root stored on the Ethereum ledger. Provable integrity confirmed.'
                          : 'The computed hash of the current record does NOT match the value pinned to the blockchain ledger. Alteration detected; record discarded.'}
                      </AlertDescription>

                      <div className="space-y-1 font-mono text-[10px] pt-2 border-t border-zinc-800">
                        <div>
                          <span className="text-zinc-500">PINNED ON-CHAIN HASH:</span>
                          <div className="text-zinc-200 break-all">{auditResult.onChainHash}</div>
                        </div>
                        <div>
                          <span className="text-zinc-500">RECOMPUTED CURRENT HASH:</span>
                          <div className={auditResult.isValid ? 'text-emerald-400 break-all font-bold' : 'text-rose-400 break-all font-bold'}>
                            {auditResult.calculatedHash}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Alert>
                ) : (
                  <div className="p-12 text-center border border-dashed border-zinc-800 rounded-sm text-xs text-zinc-500 font-mono">
                    Click "Run Integrity Audit" to compute SHA-256 hashes and test against blockchain consensus.
                  </div>
                )}
              </div>

            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Solidity Code Viewer */}
      {activeTab === 'contract' && (
        <Card className="rounded-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
                  SMART CONTRACT SOURCE CODE
                </span>
                <CardTitle className="text-base font-mono mt-0.5">
                  HospitalCommunicableDiseaseLedger.sol
                </CardTitle>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                Solidity ^0.8.20
              </Badge>
            </div>
            <CardDescription>
              Verified smart contract implementation for tamper-proof communicable disease consultations.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <pre className="p-5 bg-zinc-950 border-t border-zinc-800 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HospitalCommunicableDiseaseLedger
 * @author Hospi-Chain Protocol Engineering
 * @notice Governs clinical consultation workflows and outbreak logging.
 */
contract HospitalCommunicableDiseaseLedger {
   
   enum Role { None, Patient, Doctor, HealthOfficer, Admin }
   
   struct ConsultationRecord {
       bytes32 consultationId;
       address patient;
       address doctor;
       bytes32 ipfsClinicalHash;
       uint256 timestamp;
       bool isCommunicable;
       bool quarantineEnforced;
       uint256 quarantineExpiration;
   }

   address public systemAdmin;
   mapping(address => Role) public userRoles;
   mapping(bytes32 => ConsultationRecord) public consultations;
   
   event ConsultationLogged(bytes32 indexed consultId, address indexed patient, address indexed doctor);
   event QuarantineEnforced(bytes32 indexed consultId, address indexed patient, uint256 releaseTime);
   event PublicHealthAlert(bytes32 indexed consultId, string pathogenRef, uint256 timestamp);

   modifier onlyAdmin() {
       require(msg.sender == systemAdmin, "Auth: Caller is not system administrator");
       _;
   }

   modifier onlyDoctor() {
       require(userRoles[msg.sender] == Role.Doctor, "Auth: Caller is not a certified doctor");
       _;
   }

   constructor() {
       systemAdmin = msg.sender;
       userRoles[msg.sender] = Role.Admin;
   }

   function assignUserRole(address _account, Role _role) external onlyAdmin {
       require(_account != address(0), "Invalid account address");
       userRoles[_account] = _role;
   }

   function recordConsultation(
       bytes32 _consultId,
       address _patient,
       bytes32 _ipfsHash,
       bool _isCommunicable,
       bool _quarantineEnforced,
       uint256 _durationDays,
       string calldata _pathogenRef
   ) external onlyDoctor {
       require(consultations[_consultId].timestamp == 0, "Record already finalized");
       
       uint256 releaseDate = 0;
       if (_quarantineEnforced) {
           releaseDate = block.timestamp + (_durationDays * 1 days);
           emit QuarantineEnforced(_consultId, _patient, releaseDate);
       }

       consultations[_consultId] = ConsultationRecord({
           consultationId: _consultId,
           patient: _patient,
           doctor: msg.sender,
           ipfsClinicalHash: _ipfsHash,
           timestamp: block.timestamp,
           isCommunicable: _isCommunicable,
           quarantineEnforced: _quarantineEnforced,
           quarantineExpiration: releaseDate
       });

       emit ConsultationLogged(_consultId, _patient, msg.sender);

       if (_isCommunicable) {
           emit PublicHealthAlert(_consultId, _pathogenRef, block.timestamp);
       }
   }
}`}
            </pre>
          </CardContent>
        </Card>
      )}

    </div>
  );
};
