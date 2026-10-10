import React, { useState } from 'react';
import { useHospital } from '../context/HospitalContext';
import { 
  Cpu, 
  Layers, 
  ShieldCheck, 
  AlertOctagon, 
  Code, 
  FileCheck2, 
  RefreshCw, 
  Key, 
  CheckCircle2, 
  XCircle,
  Copy,
  ChevronRight
} from 'lucide-react';
import { formatTxHash, formatAddress } from '../utils/crypto';

export const LedgerExplorer: React.FC = () => {
  const { 
    blocks, 
    intakes, 
    onChainRecords, 
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
    <div className="space-y-8">
      {/* Header and Explorer Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            EVM Blockchain Ledger & Smart Contract Explorer
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span>Network: Private EVM Consensus / Proof-of-Authority</span>
            <span aria-hidden="true">·</span>
            <span>Block Height: #{blocks.length - 1}</span>
            <span aria-hidden="true">·</span>
            <span>Contract: HospitalCommunicableDiseaseLedger</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs self-start">
          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'blocks'
                ? 'bg-teal-500/20 text-teal-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Blocks & Transactions
          </button>
          <button
            onClick={() => setActiveTab('integrity')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'integrity'
                ? 'bg-teal-500/20 text-teal-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tamper & Integrity Lab (Ch. 4.3.3)
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`px-3 py-1.5 font-medium rounded transition-colors ${
              activeTab === 'contract'
                ? 'bg-teal-500/20 text-teal-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Smart Contract Code
          </button>
        </div>
      </div>

      {/* TAB 1: Blocks & Transactions */}
      {activeTab === 'blocks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Block list */}
          <div className="lg:col-span-5 space-y-3">
            <h2 className="text-base font-semibold text-white">Mined Blocks Feed</h2>
            <div className="space-y-2">
              {[...blocks].reverse().map(block => (
                <button
                  key={block.blockNumber}
                  onClick={() => setSelectedBlockNumber(block.blockNumber)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selectedBlockNumber === block.blockNumber
                      ? 'border-teal-500/60 bg-slate-900'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm font-mono">Block #{block.blockNumber}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(block.timestamp * 1000).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 space-y-1">
                    <div className="truncate">Prev: {formatTxHash(block.previousHash)}</div>
                    <div className="truncate text-teal-400">Root: {formatTxHash(block.merkleRoot)}</div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>{block.transactions.length} Transactions</span>
                    <span>Nonce: {block.nonce}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Block Detail & Transactions Inspector */}
          <div className="lg:col-span-7">
            <div className="border border-slate-800 bg-slate-900/80 rounded-xl p-6 space-y-6">
              <div>
                <div className="text-xs font-mono uppercase text-teal-400 font-semibold">Block Inspector</div>
                <h2 className="text-xl font-bold text-white mt-0.5 font-mono">
                  Block #{selectedBlock.blockNumber}
                </h2>
              </div>

              {/* Header Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Previous Block Hash</span>
                  <span className="text-slate-200 break-all">{selectedBlock.previousHash}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Merkle Root Hash</span>
                  <span className="text-teal-300 break-all">{selectedBlock.merkleRoot}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Block Miner</span>
                  <span className="text-slate-300 break-all">{selectedBlock.miner}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Consensus Nonce</span>
                  <span className="text-slate-300">{selectedBlock.nonce}</span>
                </div>
              </div>

              {/* Transactions in block */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">
                  Transactions ({selectedBlock.transactions.length})
                </h3>

                {selectedBlock.transactions.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
                    Genesis Block · No internal transactions.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedBlock.transactions.map(tx => (
                      <div
                        key={tx.txHash}
                        className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                          <span className="text-teal-400 font-semibold">{tx.functionName}()</span>
                          <span className="text-slate-400">Gas: {tx.gasUsed.toLocaleString()}</span>
                        </div>

                        <div className="text-[11px] text-slate-400 truncate">
                          Tx Hash: <span className="text-slate-300">{tx.txHash}</span>
                        </div>

                        <div className="text-[11px] text-slate-400 truncate">
                          From: <span className="text-slate-300">{formatAddress(tx.from)}</span> → To: <span className="text-slate-300">{formatAddress(tx.to)}</span>
                        </div>

                        <div className="bg-slate-900/90 p-2.5 rounded border border-slate-800/80 mt-2 text-[11px] text-slate-300">
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Execution Arguments</div>
                          <pre className="overflow-x-auto text-teal-200">
                            {JSON.stringify(tx.arguments, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Integrity & Tamper Testing Lab (Chapter 4.3.3) */}
      {activeTab === 'integrity' && (
        <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-6 space-y-6">
          <div className="max-w-3xl">
            <h2 className="text-lg font-semibold text-white">
              Data Integrity & Resistance to Record Tampering (Evaluation Lab)
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              This interactive test reproduces the exact experimental validation described in Section 4.3.3: In a centralized system, a database administrator can silently alter patient clinical notes or diagnosis codes. In DeHosp-Chain, any off-chain alteration immediately breaks cryptographic equality with the immutable hash pinned on the blockchain.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Tamper Playground */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Select Patient Record to Inspect / Tamper
                </label>
                <select
                  value={selectedIntakeId}
                  onChange={e => {
                    setSelectedIntakeId(e.target.value);
                    setAuditResult(null);
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
                >
                  {intakes.map(intake => (
                    <option key={intake.id} value={intake.id}>
                      {intake.patientName} - {intake.category} ({intake.severity} Priority)
                    </option>
                  ))}
                </select>
              </div>

              {selectedIntake && (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{selectedIntake.patientName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                      tamperedIntakeIds.has(selectedIntake.id) ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-teal-950 text-teal-300'
                    }`}>
                      {tamperedIntakeIds.has(selectedIntake.id) ? 'TAMPERED STATE' : 'PRISTINE STATE'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px] block">Current Off-Chain Clinical Notes:</span>
                    <p className="text-slate-300 mt-1 p-2 bg-slate-900 rounded border border-slate-800">
                      {selectedIntake.clinicalNotes}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-500 text-[11px] block font-mono">Immutable On-Chain IPFS Hash:</span>
                    <span className="text-teal-400 font-mono text-[11px] break-all">{selectedIntake.ipfsHash}</span>
                  </div>
                </div>
              )}

              {/* Simulated Tamper Input */}
              <div className="p-4 rounded-xl border border-rose-900/40 bg-rose-950/20 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-rose-400 font-semibold">
                  <AlertOctagon className="h-4 w-4" />
                  <span>Simulate Malicious Database Modification</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Input altered notes below to test how the blockchain consensus detects tampering:
                </p>
                <textarea
                  rows={2}
                  value={tamperInput}
                  onChange={e => setTamperInput(e.target.value)}
                  placeholder="e.g.: Patient negative for Lassa fever; discharged without quarantine."
                  className="w-full rounded-lg border border-rose-900/60 bg-slate-950 p-2 text-slate-200 text-xs focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApplyTamper}
                    disabled={!tamperInput}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs disabled:opacity-40 transition-colors"
                  >
                    Inject Tampered Notes
                  </button>
                  {tamperedIntakeIds.has(selectedIntakeId) && (
                    <button
                      onClick={handleRestore}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
                    >
                      Restore Original
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Verification Runner & Results */}
            <div className="border border-slate-800 bg-slate-950 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Cryptographic Verification Engine</h3>
                  <p className="text-[11px] text-slate-400">Recomputes SHA-256 and checks against on-chain block</p>
                </div>

                <button
                  onClick={handleRunAudit}
                  className="px-4 py-2 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Run Integrity Audit</span>
                </button>
              </div>

              {auditResult ? (
                <div className={`p-4 rounded-xl border space-y-3 text-xs ${
                  auditResult.isValid
                    ? 'border-teal-500/50 bg-teal-950/30 text-teal-200'
                    : 'border-rose-500/60 bg-rose-950/40 text-rose-200'
                }`}>
                  <div className="flex items-center gap-2 text-sm font-bold">
                    {auditResult.isValid ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-teal-400" />
                        <span className="text-white">Audit Result: 100% Valid & Untampered</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-rose-400" />
                        <span className="text-white">CRITICAL: Tampering Detected!</span>
                      </>
                    )}
                  </div>

                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {auditResult.isValid
                      ? 'The recomputed SHA-256 hash of the off-chain clinical notes precisely matches the immutable root stored on the Ethereum ledger. Data provenance is mathematically intact.'
                      : 'The recomputed hash of the current record does NOT match the value pinned to the blockchain ledger. Any medical decisions or isolation changes derived from this payload are rejected.'}
                  </p>

                  <div className="space-y-1.5 font-mono text-[10px] pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-slate-500">Pinned On-Chain Hash:</span>
                      <div className="text-slate-200 break-all">{auditResult.onChainHash}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Computed Current Hash:</span>
                      <div className={auditResult.isValid ? 'text-teal-400 break-all' : 'text-rose-400 break-all'}>
                        {auditResult.calculatedHash}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-500">
                  Click "Run Integrity Audit" to compute SHA-256 hashes and test against blockchain consensus.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Solidity Smart Contract Code */}
      {activeTab === 'contract' && (
        <div className="border border-slate-800 bg-slate-900/80 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                HospitalCommunicableDiseaseLedger.sol
              </h2>
              <p className="text-xs text-slate-400">
                Verified Solidity implementation from Section 4.2 of the project report
              </p>
            </div>
            <span className="text-xs font-mono text-teal-400 bg-teal-950 px-2.5 py-1 rounded border border-teal-800">
              Solidity ^0.8.20
            </span>
          </div>

          <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HospitalCommunicableDiseaseLedger
 * @author MUODILI SOPULUCHUKWU JESSE (2021/249152)
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
        </div>
      )}
    </div>
  );
};
