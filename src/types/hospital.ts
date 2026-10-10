export type UserRole = 'Patient' | 'Doctor' | 'HealthOfficer' | 'Admin';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  walletAddress: string;
  licenseNumber?: string;
  specialty?: string;
  jurisdiction?: string;
  email?: string;
}

export type TriageSeverity = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface SymptomIntake {
  id: string;
  patientId: string;
  patientName: string;
  patientAddress: string;
  category: 'Respiratory' | 'Viral Hemorrhagic' | 'Gastrointestinal' | 'Dermatological / Pox' | 'General Communicable';
  temperature: number; // in Celsius
  onsetDate: string;
  visibleSigns: string[];
  exposureDays: number;
  testAttachmentName?: string;
  clinicalNotes: string;
  ipfsHash: string;
  submittedAt: number;
  status: 'Pending_Triage' | 'In_Consultation' | 'Diagnosed' | 'Discharged';
  severity: TriageSeverity;
  assignedDoctor?: string;
}

export interface ConsultationSession {
  id: string;
  intakeId: string;
  patientAddress: string;
  patientName: string;
  doctorAddress: string;
  doctorName: string;
  startedAt: number;
  endedAt?: number;
  status: 'Waiting' | 'Active' | 'Completed';
  roomToken: string;
  patientVitals: {
    temperature: number;
    spO2: number;
    heartRate: number;
    respiratoryRate: number;
  };
}

export interface OnChainRecord {
  consultationId: string; // bytes32 hex
  patient: string;
  doctor: string;
  ipfsClinicalHash: string;
  timestamp: number;
  isCommunicable: boolean;
  quarantineEnforced: boolean;
  quarantineExpiration: number; // unix timestamp in seconds
  pathogenRef: string;
  icd11Code: string;
  txHash: string;
  blockNumber: number;
  prescriptionId?: string;
}

export interface EPrescription {
  id: string;
  consultationId: string;
  patientAddress: string;
  patientName: string;
  doctorAddress: string;
  doctorName: string;
  medicationName: string;
  dosageSchedule: string;
  durationDays: number;
  issuanceTimestamp: number;
  dispensed: boolean;
  dispensedAt?: number;
  verificationHash: string;
}

export interface BlockchainTransaction {
  txHash: string;
  blockNumber: number;
  from: string;
  to: string;
  functionName: string;
  arguments: Record<string, any>;
  timestamp: number;
  gasUsed: number;
  status: 'Confirmed' | 'Failed';
}

export interface BlockchainBlock {
  blockNumber: number;
  previousHash: string;
  merkleRoot: string;
  timestamp: number;
  nonce: number;
  miner: string;
  transactions: BlockchainTransaction[];
}

export interface BlockchainEvent {
  id: string;
  eventName: 'ConsultationLogged' | 'QuarantineEnforced' | 'PublicHealthAlert' | 'RoleAssigned';
  txHash: string;
  blockNumber: number;
  timestamp: number;
  payload: Record<string, any>;
}

export interface JurisdictionStat {
  jurisdictionId: string;
  name: string;
  state: string;
  activeCases: number;
  quarantinedCount: number;
  twentyFourHourTrend: string;
  thresholdMax: number;
  alertLevel: 'Normal' | 'Elevated' | 'Critical';
  focalPathogen: string;
}
