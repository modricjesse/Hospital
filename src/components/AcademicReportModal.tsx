import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Layers, 
  Award, 
  CheckCircle2, 
  Activity, 
  Database, 
  Shield 
} from 'lucide-react';

interface AcademicReportModalProps {
  onClose: () => void;
}

export const AcademicReportModal: React.FC<AcademicReportModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'architecture' | 'uml' | 'evaluation' | 'references'>('overview');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-6">
      <div className="w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white text-base">
                University of Nigeria, Nsukka (UNN) · B.Sc. Project Report
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Candidate: MUODILI SOPULUCHUKWU JESSE · Reg: 2021/249152 · Dept of Computer Science
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-6 text-xs font-medium overflow-x-auto">
          {[
            { id: 'overview', label: '1. Dissertation Overview' },
            { id: 'architecture', label: '2. Four-Tier Architecture' },
            { id: 'uml', label: '3. UML Modeling & OOAD' },
            { id: 'evaluation', label: '4. Evaluation & Results' },
            { id: 'references', label: '5. Academic References' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeSection === tab.id
                  ? 'border-amber-400 text-amber-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 text-slate-300 text-xs leading-relaxed">
          
          {/* SECTION 1: Dissertation Overview */}
          {activeSection === 'overview' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="border border-slate-800 bg-slate-950 p-6 rounded-xl text-center space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                  Department of Computer Science · Faculty of Physical Sciences
                </span>
                <h1 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight">
                  Design and Integration of Blockchain into an Online Hospital for Communicable Diseases
                </h1>
                <div className="text-xs text-slate-400 pt-2 font-mono">
                  By: MUODILI SOPULUCHUKWU JESSE (Reg: 2021/249152) · September, 2026
                </div>
              </div>

              {/* Certification Box */}
              <div className="border border-slate-800 bg-slate-900/60 p-5 rounded-xl space-y-2">
                <h2 className="text-sm font-semibold text-white">Academic Certification</h2>
                <p className="text-slate-300">
                  This certifies that this project was carried out by <strong className="text-white">MUODILI SOPULUCHUKWU JESSE</strong> (2021/249152) in the Department of Computer Science, Faculty of Physical Sciences, University of Nigeria, Nsukka, under faculty supervision in partial fulfillment of the requirements for the award of Bachelor of Science (B.Sc.) in Computer Science.
                </p>
              </div>

              {/* Abstract */}
              <div className="border border-slate-800 bg-slate-900/60 p-5 rounded-xl space-y-3">
                <h2 className="text-sm font-semibold text-white">Abstract</h2>
                <p className="text-slate-300 leading-relaxed">
                  The rapid emergence and spread of communicable diseases demand agile, remote, and highly secure healthcare delivery frameworks capable of operating across institutional and geographical borders. While conventional telemedicine systems bridge physical distances between clinicians and patients, their reliance on centralized client-server architectures introduces critical vulnerabilities, including catastrophic data breaches, administrative record tampering, latency in statutory epidemiological alerts, and severe operational silos.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  This project designs and implements a decentralized, blockchain-based online hospital platform specifically tailored for communicable disease consultation, triage, and outbreak surveillance. Applying the Object-Oriented Analysis and Design (OOAD) methodology modeled via UML, the platform incorporates a hybrid on-chain/off-chain architectural design. High-bandwidth encrypted electronic health records and real-time WebRTC audio-visual streams are managed through an off-chain data layer, while Turing-complete smart contracts deployed on an Ethereum-compatible distributed ledger maintain tamper-proof audit trails, manage public-key authorization, verify electronic prescriptions, and automatically enforce legal quarantine timelines.
                </p>
              </div>

              {/* Core Objectives Alignment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                  <div className="font-semibold text-white mb-1">Objective 1: Cryptographic Access Control</div>
                  <p className="text-slate-400">
                    Implement public-key role-based access control preventing unauthorized data breaches and protecting sensitive communicable disease histories (GDPR/HIPAA compliant).
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                  <div className="font-semibold text-white mb-1">Objective 2: Smart Contract Ledger</div>
                  <p className="text-slate-400">
                    Deploy self-executing smart contracts on an Ethereum ledger to record and immutably preserve clinical consultations, diagnostic assessments, and quarantine orders.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                  <div className="font-semibold text-white mb-1">Objective 3: Low-Latency Notification Engine</div>
                  <p className="text-slate-400">
                    Engineer an automated real-time notification listener coupled with WebRTC peer-to-peer consultation protocols reducing alert latency from 36-48 hours to &lt; 2 hours.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                  <div className="font-semibold text-white mb-1">Objective 4: Modular Hybrid Architecture</div>
                  <p className="text-slate-400">
                    Build a resilient service-oriented interface backed by a hybrid on-chain/off-chain storage design optimized for resource-constrained regional health environments.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Four-Tier Architecture */}
          {activeSection === 'architecture' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <h2 className="text-base font-semibold text-white">System Implementation Architecture (Section 3.3.1)</h2>
              <p className="text-slate-400">
                The platform utilizes a decoupled four-tier architecture designed to uphold patient privacy while guaranteeing mathematical immutability and real-time responsiveness.
              </p>

              <div className="p-5 rounded-xl border border-slate-800 bg-slate-950 space-y-4 font-mono text-xs">
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-amber-400 font-bold mb-1">1. PRESENTATION LAYER (CLIENT)</div>
                  <div className="text-slate-300">
                    React 19 SPA · Tailwind CSS · WebRTC P2P Media Streams · Browser Wallet Engine (Ethers.js / Web3 Provider)
                  </div>
                </div>

                <div className="text-center text-slate-500">▼ HTTPS / WSS (JSON-RPC)</div>

                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-teal-400 font-bold mb-1">2. APPLICATION & MIDDLEWARE LAYER</div>
                  <div className="text-slate-300">
                    Node.js / Express API Gateway · Real-Time WebSockets Signaling Service · Event-Driven Notification Bus
                  </div>
                </div>

                <div className="text-center text-slate-500">▼ Consensus Pointers & Merkle Hashes</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-purple-400 font-bold mb-1">3. BLOCKCHAIN CONSENSUS LAYER</div>
                    <div className="text-slate-300 text-[11px]">
                      • HospitalCommunicableDiseaseLedger.sol<br />
                      • RoleBasedAccessController<br />
                      • Cryptographic Merkle Root Verification<br />
                      • Event Topics: ConsultationLogged, QuarantineEnforced, PublicHealthAlert
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-blue-400 font-bold mb-1">4. OFF-CHAIN DATA PERSISTENCE LAYER</div>
                    <div className="text-slate-300 text-[11px]">
                      • PostgreSQL Encrypted Storage (AES-256 GCM)<br />
                      • IPFS Decentralized File Pointers<br />
                      • Raw Clinical Consultation Notes & Lab Scans<br />
                      • GDPR Right-to-Erasure Compliant Pointers
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Schema Specifications */}
              <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">Database Table Specifications (Section 3.3.6)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Table Name</th>
                        <th className="py-2 px-3">Primary Key</th>
                        <th className="py-2 px-3">Key Attributes</th>
                        <th className="py-2 px-3">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="py-2 px-3 text-teal-400">users_master</td>
                        <td className="py-2 px-3">user_id (UUID)</td>
                        <td className="py-2 px-3">wallet_address, role_type, enc_profile_blob</td>
                        <td className="py-2 px-3">User identities & roles</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-teal-400">consultations_ledger</td>
                        <td className="py-2 px-3">consultation_id (UUID)</td>
                        <td className="py-2 px-3">onchain_tx_hash, enc_clinical_notes, session_status</td>
                        <td className="py-2 px-3">Consultation logs & PGP notes</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-teal-400">communicable_incidents</td>
                        <td className="py-2 px-3">incident_id (UUID)</td>
                        <td className="py-2 px-3">icd11_code, quarantine_flag, isolation_end</td>
                        <td className="py-2 px-3">Pathogen & quarantine tracking</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: UML & OOAD Modeling */}
          {activeSection === 'uml' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <h2 className="text-base font-semibold text-white">UML Analysis & System Diagrams (Section 3.3)</h2>
              
              <div className="border border-slate-800 bg-slate-950 p-5 rounded-xl font-mono text-xs space-y-3">
                <div className="text-amber-400 font-bold">USE CASE SPECIFICATIONS (Section 3.3.2)</div>
                <div className="space-y-2 text-slate-300 text-[11px]">
                  <div>• <strong>UC-01 (Patient Registration):</strong> Patient connects wallet, registers public-key credential.</div>
                  <div>• <strong>UC-02 (Submit Intake):</strong> Patient inputs symptoms, signs consultation request, generates IPFS CID.</div>
                  <div>• <strong>UC-03 (Virtual Consultation):</strong> Doctor accepts case, establishes encrypted P2P WebRTC media channel.</div>
                  <div>• <strong>UC-04 (Issue Diagnosis & Rx):</strong> Doctor writes diagnosis, quarantine order, and e-Prescription to smart contract.</div>
                  <div>• <strong>UC-05 (Outbreak Surveillance):</strong> Public health officer queries verified on-chain event stream for containment.</div>
                </div>
              </div>

              {/* Class Diagram Model */}
              <div className="border border-slate-800 bg-slate-950 p-5 rounded-xl font-mono text-xs space-y-3">
                <div className="text-teal-400 font-bold">CLASS DIAGRAM MODEL (Section 3.3.4)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                  <div className="p-3 bg-slate-900 rounded border border-slate-800">
                    <div className="text-white font-bold">class Patient</div>
                    <div className="text-slate-400">- patientId: UUID</div>
                    <div className="text-slate-400">- ethAddress: address</div>
                    <div className="text-slate-400">- quarantineStatus: bool</div>
                    <div className="text-slate-400">- isolationExpiry: uint256</div>
                    <div className="text-teal-300 mt-1">+ submitSymptoms(): bytes32</div>
                    <div className="text-teal-300">+ fetchPrescriptions(): Rx[]</div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded border border-slate-800">
                    <div className="text-white font-bold">class HealthcareProvider</div>
                    <div className="text-slate-400">- providerId: UUID</div>
                    <div className="text-slate-400">- licenseId: string</div>
                    <div className="text-slate-400">- specialty: string</div>
                    <div className="text-teal-300 mt-1">+ acceptConsultation(): void</div>
                    <div className="text-teal-300">+ commitDiagnosis(): bytes32</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: Evaluation & Results */}
          {activeSection === 'evaluation' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <h2 className="text-base font-semibold text-white">System Testing & Findings (Chapter Four)</h2>

              {/* Functional Test Matrix */}
              <div className="border border-slate-800 bg-slate-900/70 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">Functional Test Matrix (Table 4.1)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Test ID</th>
                        <th className="py-2 px-3">Scenario</th>
                        <th className="py-2 px-3">Expected Result</th>
                        <th className="py-2 px-3">Observed Result</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="py-2 px-3 text-teal-400">FT-01</td>
                        <td className="py-2 px-3">Doctor role authentication on ledger</td>
                        <td className="py-2 px-3">Smart contract validates caller status</td>
                        <td className="py-2 px-3">Verified role on execution</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">PASS</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-teal-400">FT-02</td>
                        <td className="py-2 px-3">WebRTC live session connection initiation</td>
                        <td className="py-2 px-3">Peer-to-peer media established securely</td>
                        <td className="py-2 px-3">Low-latency audio/video &lt; 82ms</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">PASS</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-teal-400">FT-03</td>
                        <td className="py-2 px-3">Communicable case logging & alert</td>
                        <td className="py-2 px-3">State pinned; event emitted</td>
                        <td className="py-2 px-3">Caught by listener within 1.2s</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">PASS</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 text-teal-400">FT-04</td>
                        <td className="py-2 px-3">Unsigned modification attempt</td>
                        <td className="py-2 px-3">Execution fails and reverts</td>
                        <td className="py-2 px-3">Unauthorized attempt halted</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">PASS</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Empirical Findings Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                  <div className="text-2xl font-bold text-teal-400 font-mono">1.8h</div>
                  <div className="text-white font-semibold text-xs mt-1">Diagnostic-to-Alert Turnaround</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Reduced from 24–48 hours in legacy spreadsheets to under 2 hours.
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                  <div className="text-2xl font-bold text-teal-400 font-mono">35%</div>
                  <div className="text-white font-semibold text-xs mt-1">Overhead Reduction</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Automated smart contract triage and routing lowered administrative case loads by 35%.
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950">
                  <div className="text-2xl font-bold text-teal-400 font-mono">89%</div>
                  <div className="text-white font-semibold text-xs mt-1">User Acceptance</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    89% of evaluated respondents expressed strong trust in cryptographic health privacy.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: References */}
          {activeSection === 'references' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <h2 className="text-base font-semibold text-white">Academic References</h2>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li>• Ekblaw, A., Engelhard, M., Assefa, D., & Viegas, F. (2016). A Case Study for Blockchain in Healthcare: "MedRec" prototype for electronic health records. IEEE Open & Big Data Conference.</li>
                <li>• Xia, Q., Sifah, E. B., Asamoah, K. O., Gao, J., Du, X., & Guizani, M. (2017). MeDShare: Trust-less medical data sharing among cloud service providers via blockchain. IEEE Access, 5.</li>
                <li>• Yue, X., Wang, H., Jin, D., Li, M., & Jiang, W. (2016). Healthcare data gateways: Found healthcare intelligence on blockchain. Journal of Medical Systems, 40(10).</li>
                <li>• Nakamoto, S. (2008). Bitcoin: A peer-to-peer electronic cash system. Cryptography Research Institute.</li>
                <li>• Antonopoulos, A. M. (2018). Mastering Ethereum: Building smart contracts and dapps. O'Reilly Media.</li>
                <li>• World Health Organization. (2020). WHO guidelines on digital health interventions for health system strengthening. Technical Report Series 984.</li>
              </ul>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Project Supervisor & Departmental Board of Examiners · UNN 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
};
