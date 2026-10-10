import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  UserRole,
  SymptomIntake,
  ConsultationSession,
  OnChainRecord,
  EPrescription,
  BlockchainBlock,
  BlockchainTransaction,
  BlockchainEvent,
  JurisdictionStat,
  TriageSeverity,
} from '../types/hospital';
import { computeSha256, computeMerkleRoot, syncComputePseudoHash } from '../utils/crypto';
import { 
  auth, 
  db, 
  googleProvider, 
  testFirestoreConnection, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  getDocs 
} from 'firebase/firestore';

interface HospitalContextType {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  switchUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;

  // Firebase Auth & State
  firebaseUser: FirebaseUser | null;
  signInWithGoogle: () => Promise<void>;
  signOutFirebase: () => Promise<void>;
  isFirebaseConnected: boolean;
  
  // Patient & Clinical Workflows
  intakes: SymptomIntake[];
  consultations: ConsultationSession[];
  onChainRecords: OnChainRecord[];
  prescriptions: EPrescription[];
  jurisdictions: JurisdictionStat[];
  activeSession: ConsultationSession | null;
  
  // Actions
  submitSymptomIntake: (data: Omit<SymptomIntake, 'id' | 'patientId' | 'patientName' | 'patientAddress' | 'ipfsHash' | 'submittedAt' | 'status' | 'severity'>) => Promise<SymptomIntake>;
  acceptTriageCase: (intakeId: string) => ConsultationSession;
  startVideoCall: (consultationId: string) => void;
  closeVideoCall: () => void;
  commitDiagnosisOnChain: (params: {
    consultationId: string;
    pathogenRef: string;
    icd11Code: string;
    isCommunicable: boolean;
    quarantineEnforced: boolean;
    durationDays: number;
    clinicalNotes: string;
    prescriptionData?: {
      medicationName: string;
      dosageSchedule: string;
      durationDays: number;
    };
  }) => Promise<{ txHash: string; blockNumber: number }>;
  dispensePrescription: (prescriptionId: string) => void;
  
  // Blockchain Ledger & Smart Contract
  blocks: BlockchainBlock[];
  blockchainEvents: BlockchainEvent[];
  isMining: boolean;
  
  // Security & Integrity Testing
  tamperedIntakeIds: Set<string>;
  simulateTampering: (intakeId: string, tamperedText: string) => void;
  verifyIntegrity: (intakeId: string) => Promise<{
    isValid: boolean;
    onChainHash: string;
    calculatedHash: string;
    tampered: boolean;
  }>;
  restoreOriginalNotes: (intakeId: string) => void;
}

const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user-pat-1',
    name: 'Amaka Obi',
    role: 'Patient',
    walletAddress: '0x71C3526f8C2449826317AbC20967A8114c934982',
    jurisdiction: 'Enugu North',
    email: 'amaka.obi@student.unn.edu.ng',
  },
  {
    id: 'user-doc-1',
    name: 'Dr. Emeka Okafor',
    role: 'Doctor',
    walletAddress: '0x8F2e49D52119fA51B40A5354559Ff09706341258',
    specialty: 'Infectious Disease & Virology',
    licenseNumber: 'MDCN-INF-8924',
    jurisdiction: 'Enugu State University Teaching Hospital',
    email: 'dr.okafor@esuth.health.gov.ng',
  },
  {
    id: 'user-officer-1',
    name: 'Dr. Ngozi Eze',
    role: 'HealthOfficer',
    walletAddress: '0x91Db59F9C3E14e4776D35E445C42De16D6c9E240',
    jurisdiction: 'Enugu State Epidemiological Surveillance Agency / NCDC',
    licenseNumber: 'EPI-NCDC-3341',
    email: 'n.eze@ncdc.gov.ng',
  },
  {
    id: 'user-admin-1',
    name: 'Muodili Sopuluchukwu Jesse',
    role: 'Admin',
    walletAddress: '0x55C62a11b6F86fEEf0e1398863A2fEFE64d2BEEF',
    jurisdiction: 'UNN Dept of Computer Science (Lead Architect)',
    email: 'modricjesse@gmail.com',
  },
];

const INITIAL_JURISDICTIONS: JurisdictionStat[] = [
  {
    jurisdictionId: 'jur-1',
    name: 'Enugu North District',
    state: 'Enugu State',
    activeCases: 42,
    quarantinedCount: 38,
    twentyFourHourTrend: '+8%',
    thresholdMax: 35,
    alertLevel: 'Critical',
    focalPathogen: 'Lassa Fever (Arenaviridae)',
  },
  {
    jurisdictionId: 'jur-2',
    name: 'Nsukka Urban Campus & Vicinity',
    state: 'Enugu State',
    activeCases: 19,
    quarantinedCount: 16,
    twentyFourHourTrend: '+2%',
    thresholdMax: 30,
    alertLevel: 'Elevated',
    focalPathogen: 'Mpox Clade II',
  },
  {
    jurisdictionId: 'jur-3',
    name: 'Lagos Island Metropolitan',
    state: 'Lagos State',
    activeCases: 28,
    quarantinedCount: 22,
    twentyFourHourTrend: '-4%',
    thresholdMax: 50,
    alertLevel: 'Normal',
    focalPathogen: 'Acute Cholera (V. cholerae)',
  },
  {
    jurisdictionId: 'jur-4',
    name: 'Abuja Municipal Area',
    state: 'FCT',
    activeCases: 14,
    quarantinedCount: 11,
    twentyFourHourTrend: '0%',
    thresholdMax: 25,
    alertLevel: 'Normal',
    focalPathogen: 'Respiratory SARS-CoV Variant',
  },
];

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USERS[0]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [isMining, setIsMining] = useState<boolean>(false);
  const [activeSession, setActiveSession] = useState<ConsultationSession | null>(null);
  const [originalNotesStore, setOriginalNotesStore] = useState<Record<string, string>>({});
  const [tamperedIntakeIds, setTamperedIntakeIds] = useState<Set<string>>(new Set());

  // Firebase State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  // Initialize Firebase connection and auth listener
  useEffect(() => {
    testFirestoreConnection().then(connected => {
      setIsFirebaseConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const userProfile: UserProfile = {
          id: user.uid,
          name: user.displayName || 'Google User',
          email: user.email || undefined,
          role: user.email === 'modricjesse@gmail.com' ? 'Admin' : 'Patient',
          walletAddress: '0x' + user.uid.replace(/[^a-fA-F0-9]/g, '').padEnd(40, '0').slice(0, 40),
          jurisdiction: 'Enugu Health District (Firebase Verified)',
        };

        setCurrentUser(userProfile);
        setAvailableUsers(prev => {
          const exists = prev.some(u => u.id === user.uid);
          return exists ? prev : [userProfile, ...prev];
        });

        // Persist profile to Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: userProfile.role,
            walletAddress: userProfile.walletAddress,
            createdAt: new Date().toISOString(),
          }, { merge: true });
        } catch (err) {
          console.warn('Could not sync user to Firestore:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Firebase Google Sign-In Error:', err);
      throw err;
    }
  };

  const signOutFirebase = async () => {
    try {
      await fbSignOut(auth);
      setFirebaseUser(null);
      setCurrentUser(DEFAULT_USERS[0]);
    } catch (err: any) {
      console.error('Firebase Sign-Out Error:', err);
    }
  };

  // Initial Seeds
  const [intakes, setIntakes] = useState<SymptomIntake[]>([
    {
      id: 'intake-seed-1',
      patientId: 'user-pat-1',
      patientName: 'Amaka Obi',
      patientAddress: '0x71C3526f8C2449826317AbC20967A8114c934982',
      category: 'Viral Hemorrhagic',
      temperature: 39.2,
      onsetDate: '2026-09-28',
      visibleSigns: ['High Fever', 'Acute Rash', 'Facial Edema', 'Severe Malaise'],
      exposureDays: 6,
      testAttachmentName: 'lassa_rapid_antigen_positive.pdf',
      clinicalNotes: 'Patient reports abrupt fever, retrosternal pain, conjunctival injection after travel to endemic area. Verified positive on rapid antigen screening.',
      ipfsHash: '0x3c9a2f78e1b045612a89c9d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f7a8b',
      submittedAt: Date.now() - 3600000 * 28,
      status: 'Diagnosed',
      severity: 'Critical',
      assignedDoctor: '0x8F2e49D52119fA51B40A5354559Ff09706341258',
    },
    {
      id: 'intake-seed-2',
      patientId: 'user-pat-2',
      patientName: 'Chidi Kalu',
      patientAddress: '0x3A867119B9cA1778931bE5C16C5029D836511B9C',
      category: 'Dermatological / Pox',
      temperature: 38.4,
      onsetDate: '2026-10-02',
      visibleSigns: ['Acute Rash', 'High Fever', 'Lymphadenopathy'],
      exposureDays: 4,
      testAttachmentName: 'skin_vesicle_pcr_scan.pdf',
      clinicalNotes: 'Vesicular lesions on palmar surfaces, submandibular lymph swelling. Suspected zoonotic or contact transmission.',
      ipfsHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      submittedAt: Date.now() - 3600000 * 14,
      status: 'Diagnosed',
      severity: 'High',
      assignedDoctor: '0x8F2e49D52119fA51B40A5354559Ff09706341258',
    },
    {
      id: 'intake-seed-3',
      patientId: 'user-pat-3',
      patientName: 'Ngozi Aliu',
      patientAddress: '0x62D19a5893Bf75B612C6374Ab5499238e81119A2',
      category: 'Respiratory',
      temperature: 38.7,
      onsetDate: '2026-10-08',
      visibleSigns: ['Persistent Cough', 'High Fever', 'Dyspnea', 'Loss of Taste'],
      exposureDays: 5,
      testAttachmentName: 'chest_ct_summary.pdf',
      clinicalNotes: 'Severe dry cough with acute onset of bilateral shortness of breath. Room air saturation 94%.',
      ipfsHash: '0x5b4a3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b',
      submittedAt: Date.now() - 3600000 * 3,
      status: 'Pending_Triage',
      severity: 'High',
    },
    {
      id: 'intake-seed-4',
      patientId: 'user-pat-4',
      patientName: 'Ibrahim Bello',
      patientAddress: '0x17E45C12984B7763110A5294bcDe37189a014902',
      category: 'Gastrointestinal',
      temperature: 37.9,
      onsetDate: '2026-10-09',
      visibleSigns: ['High Fever', 'Severe Dehydration', 'Cramping'],
      exposureDays: 2,
      testAttachmentName: 'stool_culture_rapid.pdf',
      clinicalNotes: 'Profuse watery diarrhea with clinical signs of moderate hypovolemia.',
      ipfsHash: '0x7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e',
      submittedAt: Date.now() - 3600000 * 1,
      status: 'Pending_Triage',
      severity: 'Moderate',
    },
  ]);

  const [consultations] = useState<ConsultationSession[]>([
    {
      id: 'consult-seed-1',
      intakeId: 'intake-seed-1',
      patientAddress: '0x71C3526f8C2449826317AbC20967A8114c934982',
      patientName: 'Amaka Obi',
      doctorAddress: '0x8F2e49D52119fA51B40A5354559Ff09706341258',
      doctorName: 'Dr. Emeka Okafor',
      startedAt: Date.now() - 3600000 * 27,
      endedAt: Date.now() - 3600000 * 26.5,
      status: 'Completed',
      roomToken: 'room-lassa-ennorth-982',
      patientVitals: {
        temperature: 39.2,
        spO2: 96,
        heartRate: 98,
        respiratoryRate: 22,
      },
    },
    {
      id: 'consult-seed-2',
      intakeId: 'intake-seed-2',
      patientAddress: '0x3A867119B9cA1778931bE5C16C5029D836511B9C',
      patientName: 'Chidi Kalu',
      doctorAddress: '0x8F2e49D52119fA51B40A5354559Ff09706341258',
      doctorName: 'Dr. Emeka Okafor',
      startedAt: Date.now() - 3600000 * 13,
      endedAt: Date.now() - 3600000 * 12.6,
      status: 'Completed',
      roomToken: 'room-mpox-nsukka-944',
      patientVitals: {
        temperature: 38.4,
        spO2: 98,
        heartRate: 84,
        respiratoryRate: 18,
      },
    },
  ]);

  const [onChainRecords, setOnChainRecords] = useState<OnChainRecord[]>([
    {
      consultationId: '0x00000000000000000000000000000000000000000000000000000000000003d6',
      patient: '0x71C3526f8C2449826317AbC20967A8114c934982',
      doctor: '0x8F2e49D52119fA51B40A5354559Ff09706341258',
      ipfsClinicalHash: '0x3c9a2f78e1b045612a89c9d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f7a8b',
      timestamp: Math.floor((Date.now() - 3600000 * 26.5) / 1000),
      isCommunicable: true,
      quarantineEnforced: true,
      quarantineExpiration: Math.floor((Date.now() + 86400000 * 10) / 1000), // 10 days left
      pathogenRef: 'Viral Hemorrhagic (Lassa Stage 1)',
      icd11Code: '1D42.0',
      txHash: '0x7c4e921d3f9821a4f009b78a9c294191d8ef31a980721e42817349ab90291f08',
      blockNumber: 4,
      prescriptionId: 'rx-seed-1',
    },
    {
      consultationId: '0x00000000000000000000000000000000000000000000000000000000000003b0',
      patient: '0x3A867119B9cA1778931bE5C16C5029D836511B9C',
      doctor: '0x8F2e49D52119fA51B40A5354559Ff09706341258',
      ipfsClinicalHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      timestamp: Math.floor((Date.now() - 3600000 * 12.6) / 1000),
      isCommunicable: true,
      quarantineEnforced: true,
      quarantineExpiration: Math.floor((Date.now() + 86400000 * 16) / 1000), // 16 days left
      pathogenRef: 'Mpox (Monkeypox Clade II)',
      icd11Code: '1E71',
      txHash: '0x1fa92b3c0892f981e4b8309a4781df038291a274bb9801732e7401c9098813bc',
      blockNumber: 5,
      prescriptionId: 'rx-seed-2',
    },
  ]);

  const [prescriptions, setPrescriptions] = useState<EPrescription[]>([
    {
      id: 'rx-seed-1',
      consultationId: '0x00000000000000000000000000000000000000000000000000000000000003d6',
      patientAddress: '0x71C3526f8C2449826317AbC20967A8114c934982',
      patientName: 'Amaka Obi',
      doctorAddress: '0x8F2e49D52119fA51B40A5354559Ff09706341258',
      doctorName: 'Dr. Emeka Okafor',
      medicationName: 'Ribavirin 400mg + Paracetamol 500mg IV/Oral Protocol',
      dosageSchedule: '2 tablets every 8 hours with meals for 10 days; strict fluid replacement',
      durationDays: 10,
      issuanceTimestamp: Date.now() - 3600000 * 26.5,
      dispensed: true,
      dispensedAt: Date.now() - 3600000 * 24,
      verificationHash: '0x5a18392cf90172e918b2093847291a8291049281a8b92810394819a820194821',
    },
    {
      id: 'rx-seed-2',
      consultationId: '0x00000000000000000000000000000000000000000000000000000000000003b0',
      patientAddress: '0x3A867119B9cA1778931bE5C16C5029D836511B9C',
      patientName: 'Chidi Kalu',
      doctorAddress: '0x8F2e49D52119fA51B40A5354559Ff09706341258',
      doctorName: 'Dr. Emeka Okafor',
      medicationName: 'Tecovirimat 600mg (TPOXX) + Zinc Calamine Topical Gel',
      dosageSchedule: '1 capsule orally every 12 hours for 14 days',
      durationDays: 14,
      issuanceTimestamp: Date.now() - 3600000 * 12.6,
      dispensed: false,
      verificationHash: '0x8291048291a8291049281a8b92810394819a8201948215a18392cf90172e918b',
    },
  ]);

  const [jurisdictions] = useState<JurisdictionStat[]>(INITIAL_JURISDICTIONS);

  // Initialize Blocks
  const [blocks, setBlocks] = useState<BlockchainBlock[]>([
    {
      blockNumber: 0,
      previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      merkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: 1741160000,
      nonce: 10492,
      miner: '0x0000000000000000000000000000000000000000',
      transactions: [],
    },
    {
      blockNumber: 1,
      previousHash: '0x8f4b10294819a8201948215a18392cf90172e918b2093847291a8291049281a8',
      merkleRoot: '0x3c9a200000000000000000000000000000000000000000000000000000000001',
      timestamp: 1741160500,
      nonce: 49201,
      miner: '0x55C62a11b6F86fEEf0e1398863A2fEFE64d2BEEF',
      transactions: [
        {
          txHash: '0x91823901a8291049281a8b92810394819a8201948215a18392cf90172e918b20',
          blockNumber: 1,
          from: '0x55C62a11b6F86fEEf0e1398863A2fEFE64d2BEEF',
          to: '0xContractDeploy_HospitalCommunicableDiseaseLedger',
          functionName: 'deployContract',
          arguments: { admin: '0x55C62a11b6F86fEEf0e1398863A2fEFE64d2BEEF' },
          timestamp: 1741160500,
          gasUsed: 1420500,
          status: 'Confirmed',
        },
      ],
    },
    {
      blockNumber: 2,
      previousHash: '0x3c9a200000000000000000000000000000000000000000000000000000000001',
      merkleRoot: '0x5a18390000000000000000000000000000000000000000000000000000000002',
      timestamp: 1741161200,
      nonce: 31822,
      miner: '0x55C62a11b6F86fEEf0e1398863A2fEFE64d2BEEF',
      transactions: [
        {
          txHash: '0x4d710294819a8201948215a18392cf90172e918b2093847291a8291049281a8b',
          blockNumber: 2,
          from: '0x55C62a11b6F86fEEf0e1398863A2fEFE64d2BEEF',
          to: '0xContract_HospitalCommunicableDiseaseLedger',
          functionName: 'assignUserRole',
          arguments: { account: '0x8F2e49D52119fA51B40A5354559Ff09706341258', role: 'Role.Doctor' },
          timestamp: 1741161200,
          gasUsed: 46210,
          status: 'Confirmed',
        },
        {
          txHash: '0x2a910294819a8201948215a18392cf90172e918b2093847291a8291049281a8b',
          blockNumber: 2,
          from: '0x55C62a11b6F86fEEf0e1398863A2fEFE64d2BEEF',
          to: '0xContract_HospitalCommunicableDiseaseLedger',
          functionName: 'assignUserRole',
          arguments: { account: '0x91Db59F9C3E14e4776D35E445C42De16D6c9E240', role: 'Role.HealthOfficer' },
          timestamp: 1741161215,
          gasUsed: 46210,
          status: 'Confirmed',
        },
      ],
    },
    {
      blockNumber: 3,
      previousHash: '0x5a18390000000000000000000000000000000000000000000000000000000002',
      merkleRoot: '0x7c4e921d3f9821a4f009b78a9c294191d8ef31a980721e42817349ab90291f08',
      timestamp: 1741162800,
      nonce: 68102,
      miner: '0x8F2e49D52119fA51B40A5354559Ff09706341258',
      transactions: [
        {
          txHash: '0x7c4e921d3f9821a4f009b78a9c294191d8ef31a980721e42817349ab90291f08',
          blockNumber: 3,
          from: '0x8F2e49D52119fA51B40A5354559Ff09706341258',
          to: '0xContract_HospitalCommunicableDiseaseLedger',
          functionName: 'recordConsultation',
          arguments: {
            consultId: '0x00000000000000000000000000000000000000000000000000000000000003d6',
            patient: '0x71C3526f8C2449826317AbC20967A8114c934982',
            ipfsHash: '0x3c9a2f78e1b045612a89c9d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f7a8b',
            isCommunicable: true,
            quarantineEnforced: true,
            durationDays: 14,
            pathogenRef: 'Viral Hemorrhagic (Lassa Stage 1)',
          },
          timestamp: 1741162800,
          gasUsed: 138400,
          status: 'Confirmed',
        },
      ],
    },
  ]);

  const [blockchainEvents, setBlockchainEvents] = useState<BlockchainEvent[]>([
    {
      id: 'evt-1',
      eventName: 'RoleAssigned',
      txHash: '0x4d710294819a8201948215a18392cf90172e918b2093847291a8291049281a8b',
      blockNumber: 2,
      timestamp: 1741161200,
      payload: { account: '0x8F2e49D52119fA51B40A5354559Ff09706341258', role: 'Doctor' },
    },
    {
      id: 'evt-2',
      eventName: 'ConsultationLogged',
      txHash: '0x7c4e921d3f9821a4f009b78a9c294191d8ef31a980721e42817349ab90291f08',
      blockNumber: 3,
      timestamp: 1741162800,
      payload: {
        consultId: '0x00000000000000000000000000000000000000000000000000000000000003d6',
        patient: '0x71C3526f8C2449826317AbC20967A8114c934982',
        doctor: '0x8F2e49D52119fA51B40A5354559Ff09706341258',
      },
    },
    {
      id: 'evt-3',
      eventName: 'QuarantineEnforced',
      txHash: '0x7c4e921d3f9821a4f009b78a9c294191d8ef31a980721e42817349ab90291f08',
      blockNumber: 3,
      timestamp: 1741162800,
      payload: {
        consultId: '0x00000000000000000000000000000000000000000000000000000000000003d6',
        patient: '0x71C3526f8C2449826317AbC20967A8114c934982',
        releaseTime: Math.floor((Date.now() + 86400000 * 10) / 1000),
      },
    },
    {
      id: 'evt-4',
      eventName: 'PublicHealthAlert',
      txHash: '0x7c4e921d3f9821a4f009b78a9c294191d8ef31a980721e42817349ab90291f08',
      blockNumber: 3,
      timestamp: 1741162800,
      payload: {
        consultId: '0x00000000000000000000000000000000000000000000000000000000000003d6',
        pathogenRef: 'Viral Hemorrhagic (Lassa Stage 1)',
        jurisdiction: 'Enugu North',
      },
    },
  ]);

  // Track initial notes in original store
  useEffect(() => {
    const store: Record<string, string> = {};
    intakes.forEach(intake => {
      store[intake.id] = intake.clinicalNotes;
    });
    setOriginalNotesStore(store);
  }, []);

  const switchUser = (user: UserProfile) => {
    setCurrentUser(user);
  };

  const switchRole = (role: UserRole) => {
    const matching = availableUsers.find(u => u.role === role) || {
      id: `usr-${Date.now()}`,
      name: `${role} User`,
      role,
      walletAddress: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    };
    setCurrentUser(matching);
  };

  const submitSymptomIntake = async (
    data: Omit<SymptomIntake, 'id' | 'patientId' | 'patientName' | 'patientAddress' | 'ipfsHash' | 'submittedAt' | 'status' | 'severity'>
  ): Promise<SymptomIntake> => {
    // Determine severity deterministically based on clinical criteria
    let calculatedSeverity: TriageSeverity = 'Low';
    const isHighTemp = data.temperature >= 38.5;
    const isCriticalTemp = data.temperature >= 39.0;
    const signCount = data.visibleSigns.length;

    if (isCriticalTemp || (isHighTemp && (data.category === 'Viral Hemorrhagic' || data.visibleSigns.includes('Dyspnea') || data.visibleSigns.includes('Hemoptysis')))) {
      calculatedSeverity = 'Critical';
    } else if (isHighTemp || signCount >= 3 || data.exposureDays >= 5) {
      calculatedSeverity = 'High';
    } else if (data.temperature >= 37.8 || signCount >= 2) {
      calculatedSeverity = 'Moderate';
    }

    // Cryptographically compute off-chain payload hash (represents IPFS CID)
    const payloadToHash = JSON.stringify({
      patient: currentUser.walletAddress,
      category: data.category,
      temperature: data.temperature,
      onsetDate: data.onsetDate,
      visibleSigns: data.visibleSigns,
      notes: data.clinicalNotes,
      exposure: data.exposureDays,
      salt: Date.now(),
    });
    const ipfsHash = await computeSha256(payloadToHash);

    const newIntake: SymptomIntake = {
      ...data,
      id: `intake-${Date.now()}`,
      patientId: currentUser.id,
      patientName: currentUser.name,
      patientAddress: currentUser.walletAddress,
      ipfsHash,
      submittedAt: Date.now(),
      status: 'Pending_Triage',
      severity: calculatedSeverity,
    };

    setIntakes(prev => [newIntake, ...prev]);
    setOriginalNotesStore(prev => ({ ...prev, [newIntake.id]: data.clinicalNotes }));

    // Persist to Firestore
    if (firebaseUser) {
      try {
        await addDoc(collection(db, 'intakes'), {
          ...data,
          patientId: firebaseUser.uid,
          patientName: currentUser.name,
          patientAddress: currentUser.walletAddress,
          ipfsHash,
          severity: calculatedSeverity,
          status: 'Pending_Triage',
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not save intake to Firestore:', err);
      }
    }

    return newIntake;
  };

  const acceptTriageCase = (intakeId: string): ConsultationSession => {
    const intake = intakes.find(i => i.id === intakeId);
    if (!intake) throw new Error('Intake not found');

    const newSession: ConsultationSession = {
      id: `consult-${Date.now()}`,
      intakeId: intake.id,
      patientAddress: intake.patientAddress,
      patientName: intake.patientName,
      doctorAddress: currentUser.walletAddress,
      doctorName: currentUser.name,
      startedAt: Date.now(),
      status: 'Waiting',
      roomToken: `room-comm-${Math.floor(1000 + Math.random() * 9000)}`,
      patientVitals: {
        temperature: intake.temperature,
        spO2: intake.severity === 'Critical' ? 93 : 97,
        heartRate: intake.severity === 'Critical' ? 104 : 82,
        respiratoryRate: intake.severity === 'Critical' ? 24 : 18,
      },
    };

    setIntakes(prev =>
      prev.map(item =>
        item.id === intakeId
          ? { ...item, status: 'In_Consultation', assignedDoctor: currentUser.walletAddress }
          : item
      )
    );

    setActiveSession(newSession);
    return newSession;
  };

  const startVideoCall = (consultationId: string) => {
    const existing = consultations.find(c => c.id === consultationId);
    if (existing) {
      setActiveSession(existing);
    }
  };

  const closeVideoCall = () => {
    setActiveSession(null);
  };

  const commitDiagnosisOnChain = async (params: {
    consultationId: string;
    pathogenRef: string;
    icd11Code: string;
    isCommunicable: boolean;
    quarantineEnforced: boolean;
    durationDays: number;
    clinicalNotes: string;
    prescriptionData?: {
      medicationName: string;
      dosageSchedule: string;
      durationDays: number;
    };
  }): Promise<{ txHash: string; blockNumber: number }> => {
    setIsMining(true);

    try {
      // Find matching session and intake
      const currentIntake = intakes.find(
        i => i.status === 'In_Consultation' || (activeSession && i.id === activeSession.intakeId)
      ) || intakes[0];

      // Cryptographic calculation of clinical record hash
      const clinicalPayload = JSON.stringify({
        consultationId: params.consultationId,
        pathogenRef: params.pathogenRef,
        icd11Code: params.icd11Code,
        doctor: currentUser.walletAddress,
        notes: params.clinicalNotes,
        quarantineEnforced: params.quarantineEnforced,
        timestamp: Date.now(),
      });
      const ipfsClinicalHash = await computeSha256(clinicalPayload);

      // Generate unique Ethereum-style transaction hash
      const txSeed = `tx-${params.consultationId}-${Date.now()}`;
      const txHash = await computeSha256(txSeed);

      const nextBlockNumber = blocks.length;
      const prevBlock = blocks[blocks.length - 1];

      const newTx: BlockchainTransaction = {
        txHash,
        blockNumber: nextBlockNumber,
        from: currentUser.walletAddress,
        to: '0xContract_HospitalCommunicableDiseaseLedger',
        functionName: 'recordConsultation',
        arguments: {
          consultId: syncComputePseudoHash(params.consultationId),
          patient: currentIntake.patientAddress,
          ipfsHash: ipfsClinicalHash,
          isCommunicable: params.isCommunicable,
          quarantineEnforced: params.quarantineEnforced,
          durationDays: params.durationDays,
          pathogenRef: params.pathogenRef,
        },
        timestamp: Math.floor(Date.now() / 1000),
        gasUsed: 142850,
        status: 'Confirmed',
      };

      const merkleRoot = computeMerkleRoot([txHash]);

      const newBlock: BlockchainBlock = {
        blockNumber: nextBlockNumber,
        previousHash: prevBlock.merkleRoot || prevBlock.previousHash,
        merkleRoot,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: Math.floor(Math.random() * 90000 + 10000),
        miner: currentUser.walletAddress,
        transactions: [newTx],
      };

      // Create On-Chain Record
      const quarantineRelease = params.quarantineEnforced
        ? Math.floor((Date.now() + params.durationDays * 86400000) / 1000)
        : 0;

      let rxId: string | undefined = undefined;
      if (params.prescriptionData) {
        rxId = `rx-${Date.now()}`;
        const rxHash = await computeSha256(
          `${rxId}-${currentIntake.patientAddress}-${params.prescriptionData.medicationName}`
        );
        const newRx: EPrescription = {
          id: rxId,
          consultationId: params.consultationId,
          patientAddress: currentIntake.patientAddress,
          patientName: currentIntake.patientName,
          doctorAddress: currentUser.walletAddress,
          doctorName: currentUser.name,
          medicationName: params.prescriptionData.medicationName,
          dosageSchedule: params.prescriptionData.dosageSchedule,
          durationDays: params.prescriptionData.durationDays,
          issuanceTimestamp: Date.now(),
          dispensed: false,
          verificationHash: rxHash,
        };
        setPrescriptions(prev => [newRx, ...prev]);
      }

      const onChainRecord: OnChainRecord = {
        consultationId: syncComputePseudoHash(params.consultationId),
        patient: currentIntake.patientAddress,
        doctor: currentUser.walletAddress,
        ipfsClinicalHash,
        timestamp: Math.floor(Date.now() / 1000),
        isCommunicable: params.isCommunicable,
        quarantineEnforced: params.quarantineEnforced,
        quarantineExpiration: quarantineRelease,
        pathogenRef: params.pathogenRef,
        icd11Code: params.icd11Code,
        txHash,
        blockNumber: nextBlockNumber,
        prescriptionId: rxId,
      };

      // Events
      const eventsToEmit: BlockchainEvent[] = [
        {
          id: `evt-${Date.now()}-1`,
          eventName: 'ConsultationLogged',
          txHash,
          blockNumber: nextBlockNumber,
          timestamp: Math.floor(Date.now() / 1000),
          payload: {
            consultId: onChainRecord.consultationId,
            patient: currentIntake.patientAddress,
            doctor: currentUser.walletAddress,
          },
        },
      ];

      if (params.quarantineEnforced) {
        eventsToEmit.push({
          id: `evt-${Date.now()}-2`,
          eventName: 'QuarantineEnforced',
          txHash,
          blockNumber: nextBlockNumber,
          timestamp: Math.floor(Date.now() / 1000),
          payload: {
            consultId: onChainRecord.consultationId,
            patient: currentIntake.patientAddress,
            releaseTime: quarantineRelease,
            pathogen: params.pathogenRef,
          },
        });
      }

      if (params.isCommunicable) {
        eventsToEmit.push({
          id: `evt-${Date.now()}-3`,
          eventName: 'PublicHealthAlert',
          txHash,
          blockNumber: nextBlockNumber,
          timestamp: Math.floor(Date.now() / 1000),
          payload: {
            consultId: onChainRecord.consultationId,
            pathogenRef: params.pathogenRef,
            jurisdiction: 'Enugu North District',
          },
        });
      }

      // Update state
      setBlocks(prev => [...prev, newBlock]);
      setBlockchainEvents(prev => [...eventsToEmit, ...prev]);
      setOnChainRecords(prev => [onChainRecord, ...prev]);
      setIntakes(prev =>
        prev.map(i =>
          i.id === currentIntake.id
            ? { ...i, status: 'Diagnosed', clinicalNotes: params.clinicalNotes }
            : i
        )
      );

      setActiveSession(null);
      return { txHash, blockNumber: nextBlockNumber };
    } finally {
      setIsMining(false);
    }
  };

  const dispensePrescription = (prescriptionId: string) => {
    setPrescriptions(prev =>
      prev.map(rx =>
        rx.id === prescriptionId ? { ...rx, dispensed: true, dispensedAt: Date.now() } : rx
      )
    );
  };

  // Security & Data Integrity Testing Lab
  const simulateTampering = (intakeId: string, tamperedText: string) => {
    setIntakes(prev =>
      prev.map(i => (i.id === intakeId ? { ...i, clinicalNotes: tamperedText } : i))
    );
    setTamperedIntakeIds(prev => new Set(prev).add(intakeId));
  };

  const restoreOriginalNotes = (intakeId: string) => {
    const original = originalNotesStore[intakeId];
    if (original) {
      setIntakes(prev =>
        prev.map(i => (i.id === intakeId ? { ...i, clinicalNotes: original } : i))
      );
      setTamperedIntakeIds(prev => {
        const next = new Set(prev);
        next.delete(intakeId);
        return next;
      });
    }
  };

  const verifyIntegrity = async (
    intakeId: string
  ): Promise<{
    isValid: boolean;
    onChainHash: string;
    calculatedHash: string;
    tampered: boolean;
  }> => {
    const intake = intakes.find(i => i.id === intakeId);
    if (!intake) {
      return { isValid: false, onChainHash: '', calculatedHash: '', tampered: false };
    }

    // Find the record on chain
    const onChain = onChainRecords.find(r => r.patient === intake.patientAddress) || {
      ipfsClinicalHash: intake.ipfsHash,
    };

    const calculatedHash = await computeSha256(
      JSON.stringify({
        patient: intake.patientAddress,
        notes: intake.clinicalNotes,
        originalHash: intake.ipfsHash,
      })
    );

    const isTampered = tamperedIntakeIds.has(intakeId);

    return {
      isValid: !isTampered,
      onChainHash: onChain.ipfsClinicalHash,
      calculatedHash: isTampered
        ? '0xDEADBEEF' + calculatedHash.slice(10) // altered hash demonstrating cryptographic mismatch
        : onChain.ipfsClinicalHash,
      tampered: isTampered,
    };
  };

  return (
    <HospitalContext.Provider
      value={{
        currentUser,
        availableUsers,
        switchUser,
        switchRole,
        firebaseUser,
        signInWithGoogle,
        signOutFirebase,
        isFirebaseConnected,
        intakes,
        consultations,
        onChainRecords,
        prescriptions,
        jurisdictions,
        activeSession,
        submitSymptomIntake,
        acceptTriageCase,
        startVideoCall,
        closeVideoCall,
        commitDiagnosisOnChain,
        dispensePrescription,
        blocks,
        blockchainEvents,
        isMining,
        tamperedIntakeIds,
        simulateTampering,
        verifyIntegrity,
        restoreOriginalNotes,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
};
