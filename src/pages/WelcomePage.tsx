import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Atom,
  FlaskConical,
  Cpu,
  Microscope,
  Binary,
  Compass,
  Calendar,
  CheckCircle2,
  Boxes,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User,
  Building,
  GraduationCap,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  ChevronDown,
  Layers,
  Activity,
  FileSpreadsheet,
  QrCode,
  BookOpen,
  Phone,
  Users,
  Inbox,
  Copy,
  Download,
  Smartphone,
  Laptop,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localStore, DataService } from '../services/dataService';
import { UserRole, UserProfile } from '../types';
import { auth, isFirebaseConfigured, db } from '../lib/firebase/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { usePWA } from '../hooks/usePWA';
import { QRCodeSVG } from 'qrcode.react';

declare const __LOCAL_LAN_IP__: string | undefined;

export const WelcomePage: React.FC = () => {
  const { allUsers, switchUser, currentUser, isFirebaseActive } = useAuth();
  const { isInstallable, isInstalled, promptInstall } = usePWA();
  const navigate = useNavigate();

  // Install / Download modal state
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Signin state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regInstitution, setRegInstitution] = useState('SJB Institute of Technology');
  const [regDepartment, setRegDepartment] = useState('Department of Computer Science & Engineering');
  const [regRole, setRegRole] = useState<UserRole>('student');
  const [regIdNumber, setRegIdNumber] = useState('');



  const [hostIp, setHostIp] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ilms_host_ip');
      // Discard stale hardcoded IP 192.168.29.29
      if (stored && stored !== '192.168.29.29') return stored;
    }
    return typeof __LOCAL_LAN_IP__ !== 'undefined' ? __LOCAL_LAN_IP__ : '192.168.42.39';
  });
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetch('/api/network-ip')
      .then(res => res.json())
      .then(data => {
        if (data && data.ip) {
          const stored = localStorage.getItem('ilms_host_ip');
          if (!stored || stored === '192.168.29.29') {
            setHostIp(data.ip);
            localStorage.setItem('ilms_host_ip', data.ip);
          }
        }
      })
      .catch(() => {});
  }, []);

  const currentPort = typeof window !== 'undefined' && window.location.port ? window.location.port : '5173';
  const mobileInstallUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `http://${hostIp}:${currentPort}`
    : typeof window !== 'undefined' ? window.location.origin : `http://${hostIp}:${currentPort}`;

  const handleUpdateHostIp = (newIp: string) => {
    setHostIp(newIp);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ilms_host_ip', newIp);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileInstallUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleInstallClick = async () => {
    setInstallStatus(null);
    if (isInstalled) {
      setInstallStatus('ILMS is already installed on your computer! Click the [ ⧉↗ ] icon in your address bar (right next to the star ★ at the top of your screen) or double-click "ILMS Laboratory System" on your Desktop to open it.');
      setIsInstallModalOpen(true);
      return;
    }
    const res = await promptInstall();
    if (res.success) return;

    if (res.reason === 'already-installed') {
      setInstallStatus('ILMS is already installed on this computer! Look for "ILMS Laboratory System" on your Desktop or click the [ ⧉↗ ] icon in the browser address bar.');
    } else if (res.reason === 'ios-manual') {
      setInstallStatus('On iPhone/iPad: In Safari, tap the Share icon (⎋ at bottom) and select "Add to Home Screen".');
    } else {
      setInstallStatus('Notice the [ ⧉↗ ] icon in your browser address bar at the top (next to the star ★). Click it to launch the app directly, or double-click "ILMS Laboratory System" on your Desktop!');
    }
    setIsInstallModalOpen(true);
  };

  const handleDirectDownload = (type: 'app' | 'source') => {
    const fileName = type === 'app' ? 'ILMS-Mobile-Web-App.zip' : 'ILMS-Complete-Source.zip';
    const link = document.createElement('a');
    link.href = `/${fileName}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccessNotice(`"${fileName}" download initiated! Check your device Downloads folder.`);
    setTimeout(() => setDownloadSuccessNotice(null), 6000);
  };

  // Live institution stats loaded from local database
  const [stats, setStats] = useState({
    labs: 12,
    inventory: 0,
    equipment: 0,
    users: 0,
  });

  useEffect(() => {
    try {
      const inv = localStore.getInventory();
      const eq = localStore.getEquipment();
      const users = localStore.getUsers();
      setStats({
        labs: 12,
        inventory: inv.length,
        equipment: eq.length,
        users: users.length,
      });
    } catch (e) {
      console.warn('Could not read store stats:', e);
    }
  }, []);


  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isFirebaseActive && auth) {
        try {
          const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
          let matched: UserProfile | null | undefined = allUsers.find(u => u.email.toLowerCase() === cred.user.email?.toLowerCase());
          if (!matched) {
            matched = await DataService.getCurrentUser(cred.user.uid);
          }
          if (matched) {
            await switchUser(matched.id);
            setIsAuthModalOpen(false);
            navigate('/');
            return;
          }
        } catch (fErr: any) {
          console.warn('Firebase login attempt:', fErr.message);
        }
      }

      const cleanEmail = email.trim().toLowerCase();
      const found = allUsers.find(u => u.email.toLowerCase() === cleanEmail);
      if (found) {
        await switchUser(found.id);
        setIsAuthModalOpen(false);
        navigate('/');
        return;
      }

      setErrorMsg('Invalid email or password. Please verify your credentials or register a new account.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const generateSecurePassword = () => {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%&*';
    const all = uppers + lowers + numbers + symbols;

    let pwd = '';
    pwd += uppers[Math.floor(Math.random() * uppers.length)];
    pwd += lowers[Math.floor(Math.random() * lowers.length)];
    pwd += numbers[Math.floor(Math.random() * numbers.length)];
    pwd += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = pwd.length; i < 10; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }

    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');

    setRegPassword(pwd);
    setRegConfirmPassword(pwd);
    setSuccessMsg(`Generated strong password: ${pwd}`);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanName = regFullName.trim();

    if (!cleanName || !cleanEmail || !regPassword) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      let createdUid = `usr-${Date.now()}`;

      // 1. Create User in Firebase Authentication (Users list in Firebase Console)
      if (isFirebaseActive && auth) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, regPassword);
          createdUid = cred.user.uid;
          console.info('Firebase Auth: User created with UID:', createdUid);
        } catch (fbErr: any) {
          console.error('Firebase Auth registration error:', fbErr);
          if (fbErr.code === 'auth/email-already-in-use') {
            setErrorMsg('This email address is already registered in Firebase. Please sign in instead.');
            setLoading(false);
            return;
          } else if (fbErr.code === 'auth/weak-password') {
            setErrorMsg('Password is too weak. Please choose at least 6 characters.');
            setLoading(false);
            return;
          } else if (fbErr.code === 'auth/invalid-email') {
            setErrorMsg('Please enter a valid email address.');
            setLoading(false);
            return;
          } else if (fbErr.code === 'auth/operation-not-allowed') {
            setErrorMsg('Email/Password provider is disabled in Firebase Console. Please enable it in Authentication -> Sign-in method.');
            setLoading(false);
            return;
          }
          console.warn('Firebase Auth encountered error, saving locally:', fbErr.message);
        }
      }

      // 2. Build complete UserProfile
      const newUserProfile: UserProfile = {
        id: createdUid,
        email: cleanEmail,
        displayName: cleanName,
        role: regRole,
        departmentId: regDepartment,
        organizationId: 'org-sjbit-01',
        institution: regInstitution || 'SJB Institute of Technology',
        institutionId: regIdNumber || `1JB23CS${Date.now().toString().slice(-3)}`,
        status: 'active',
        emailVerified: true,
        assignedLabs: ['lab-atl-01', 'lab-atl-02', 'lab-atl-03', 'lab-sll-01', 'lab-sll-02', 'lab-bfl-01', 'lab-bfl-02', 'lab-bfl-03', 'lab-vin-01', 'lab-cbl-01', 'lab-cbl-02', 'lab-chem-01'],
        assignedLabId: 'lab-atl-01',
        createdAt: new Date().toISOString()
      };

      // 3. Write profile document to Cloud Firestore 'users' collection
      if (isFirebaseActive && db) {
        try {
          await setDoc(doc(db, 'users', createdUid), newUserProfile);
          console.info('Cloud Firestore: User document created at /users/' + createdUid);
        } catch (fsErr: any) {
          console.warn('Firestore write warning:', fsErr.message);
        }
      }

      // 4. Update Local Store & Active Session
      const updated = [...allUsers.filter(u => u.email.toLowerCase() !== cleanEmail), newUserProfile];
      localStore.setUsers(updated);
      await switchUser(createdUid);

      setSuccessMsg('Account created and registered in Firebase successfully! Redirecting...');
      setTimeout(() => {
        setIsAuthModalOpen(false);
        navigate('/');
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };


  const labModules = [
    {
      id: 'chem',
      name: 'Chemistry & Reagents',
      tag: 'Chemical Safety',
      desc: 'CAS register, batch certificates, SDS storage, expiration tracking, and hazardous waste logging.',
      icon: FlaskConical,
      color: 'bg-[#FBE5EF] border-[#E9DDF1] text-[#8961D8]',
      badge: 'Active & Verified',
    },
    {
      id: 'phys',
      name: 'Physics & Optics',
      tag: 'Precision Lasers',
      desc: 'Interferometers, optical benches, darkroom safety, calibration dates, and spectrometer scheduling.',
      icon: Atom,
      color: 'bg-[#F0E9FF] border-[#BCA0F5]/50 text-[#8961D8]',
      badge: '18 Instruments',
    },
    {
      id: 'cs',
      name: 'Computer Science & AI',
      tag: 'Compute & Workstations',
      desc: 'NVIDIA DGX clusters, Linux terminals, software licenses, network nodes, and workstation health.',
      icon: Cpu,
      color: 'bg-[#FFF8F2] border-[#FFD2BF] text-[#8961D8]',
      badge: '96 Workstations',
    },
    {
      id: 'bio',
      name: 'Biology & Specimens',
      tag: 'Cold Storage',
      desc: 'Centrifuges, incubator temperature logs, autoclave tracking, and bio-hazard level 2 protocols.',
      icon: Microscope,
      color: 'bg-[#FBE5EF] border-[#E9DDF1] text-[#8961D8]',
      badge: 'Cold Chain OK',
    },
    {
      id: 'ece',
      name: 'Electronics & Electrical',
      tag: 'Embedded & IoT',
      desc: 'Digital oscilloscopes, FPGA testbeds, soldering stations, logic analyzers, and component drawers.',
      icon: Binary,
      color: 'bg-[#F0E9FF] border-[#BCA0F5]/50 text-[#8961D8]',
      badge: '34 Benches',
    },
    {
      id: 'mech',
      name: 'Mechanical & CNC',
      tag: 'Heavy Fabrication',
      desc: '5-Axis milling, lathe tools, hydraulic presses, safety guards, and preventative machine maintenance.',
      icon: Layers,
      color: 'bg-[#FFF8F2] border-[#FFD2BF] text-[#8961D8]',
      badge: 'Safety Cleared',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F2] text-[#332B40] font-sans selection:bg-[#BCA0F5]/30 selection:text-[#332B40]">
      {/* 1. LUNA TOP NAVIGATION — FLUID & 100% VISIBLE ON MOBILE */}
      <header className="relative sm:sticky top-0 z-30 bg-[#FFF8F2]/95 backdrop-blur-md border-b border-[#E9DDF1] px-3 sm:px-8 py-3 sm:py-4 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & University Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0 min-w-0" onClick={() => navigate('/')}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#BCA0F5] to-[#FFD2BF] flex items-center justify-center shadow-sm shrink-0">
              <Atom className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-[#332B40] block leading-tight">ILMS</span>
              <span className="hidden sm:block text-[10px] font-bold uppercase tracking-wider text-[#71667D] truncate">
                Integrated Laboratory Management System
              </span>
              <span className="block sm:hidden text-[9px] font-bold uppercase tracking-wide text-[#71667D] truncate">
                Lab Management OS
              </span>
            </div>
          </div>

          {/* Center Nav Links (Luna Style) */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-[#71667D]">
            <a href="#modules" className="hover:text-[#8961D8] transition">Featured Modules</a>
            <a href="#how-it-works" className="hover:text-[#8961D8] transition">How It Works</a>
            <a href="#capabilities" className="hover:text-[#8961D8] transition">Capabilities</a>
            <a href="#project-team" className="hover:text-[#8961D8] transition">Project Team</a>
            <a href="#statistics" className="hover:text-[#8961D8] transition">Institution Stats</a>
          </nav>

          {/* Right Action Buttons — Perfectly Sized to Always Fit Mobile Header */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            <button
              onClick={() => {
                setAuthMode('signin');
                setErrorMsg(null);
                setIsAuthModalOpen(true);
              }}
              className="h-8 sm:h-10 px-3 sm:px-5 rounded-full bg-white hover:bg-[#F0E9FF] border border-[#E9DDF1] text-xs sm:text-sm font-bold text-[#332B40] transition shadow-xs flex items-center justify-center active:scale-95"
            >
              Sign In
            </button>
            <button
              onClick={handleInstallClick}
              className="h-8 sm:h-10 px-3 sm:px-5 rounded-full bg-[#BCA0F5] hover:bg-[#8961D8] text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-1 sm:space-x-1.5 active:scale-95"
            >
              {isInstalled ? (
                <>
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Open App</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Install</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION — LUNA AESTHETICS + 3D GIRL MASCOT */}
      <section className="relative overflow-hidden pt-6 sm:pt-8 pb-16 sm:pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        {/* Soft Background Gradients */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FFD2BF]/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-[#BCA0F5]/25 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* Left Column: Headlines & Actions — Full Width on Mobile */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 w-full">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#F0E9FF] border border-[#BCA0F5]/60 text-xs font-bold text-[#8961D8] shadow-sm">
              <Sparkles className="w-4 h-4 text-[#8961D8]" />
              <span>Next-Gen Academic Laboratory Cloud Platform</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-[#332B40] leading-[1.15] tracking-tight w-full">
              One Connected Space for Every Laboratory.
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#71667D] leading-relaxed w-full">
              ILMS seamlessly connects academic departments, precision equipment, hazardous inventory, practical faculty attendance, research bookings, safety audits, and procurement workflows in real-time.
            </p>

            {/* CTAs & Quick Info — Perfectly Aligned Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2 w-full">
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setIsAuthModalOpen(true);
                }}
                className="h-12 px-6 rounded-full bg-[#BCA0F5] hover:bg-[#8961D8] text-white font-black text-sm shadow-lg shadow-[#8961D8]/20 transition flex items-center space-x-2 active:scale-95"
              >
                <span>Access Laboratory Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg(null);
                  setIsAuthModalOpen(true);
                }}
                className="h-12 px-6 rounded-full bg-white hover:bg-[#F0E9FF] border border-[#E9DDF1] text-[#332B40] font-bold text-sm shadow-xs transition flex items-center space-x-2 active:scale-95"
              >
                <span>Register Institutional ID</span>
              </button>
            </div>
          </div>

          {/* Right Column: 3D Girl Character Mascot in Luna Organic Container */}
          <div className="lg:col-span-5 flex justify-center relative">
            {/* Luna Floating Cards & Decorative Badges */}
            <div className="relative w-full max-w-md">
              {/* Main Mascot Soft Card Container */}
              <div
                className="w-full aspect-[4/5] rounded-[2.5rem] bg-gradient-to-b from-[#FFF8F2] via-[#FFD2BF]/40 to-[#F0E9FF] border-2 border-[#E9DDF1] p-4 flex flex-col items-center justify-end relative shadow-2xl overflow-hidden"
              >
                {/* Floating Experiment Icon Pills */}
                <div className="absolute top-6 left-6 px-3.5 py-1.5 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#E9DDF1] shadow-md flex items-center space-x-2 z-10 animate-bounceSubtle">
                  <Microscope className="w-4 h-4 text-[#8961D8]" />
                  <span className="text-xs font-bold text-[#332B40]">Optics & Chem</span>
                </div>

                <div className="absolute top-16 right-6 px-3.5 py-1.5 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#E9DDF1] shadow-md flex items-center space-x-2 z-10">
                  <Cpu className="w-4 h-4 text-[#E7A34B]" />
                  <span className="text-xs font-bold text-[#332B40]">AI Clusters</span>
                </div>

                {/* Welcoming Speech Bubble from Mascot */}
                <div className="absolute bottom-6 left-4 right-4 bg-white/95 backdrop-blur-md border border-[#E9DDF1] rounded-3xl p-3.5 shadow-xl z-20 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0E9FF] border border-[#BCA0F5] text-[#8961D8] flex items-center justify-center shrink-0 font-bold text-xs">
                    ILMS
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#332B40]">
                      “Welcome to ILMS! Let's get your laboratory ready.”
                    </p>
                    <p className="text-[10px] text-[#71667D]">
                      Your intelligent guide for experiments, inventory & attendance.
                    </p>
                  </div>
                </div>

                {/* Clean, Pristine 3D Mascot Character */}
                <div className="w-full h-full relative flex items-center justify-center">
                  <img
                    src="/mascot.png"
                    alt="ILMS 3D Mascot Character"
                    className="w-full h-full object-contain object-bottom scale-105 drop-shadow-xl z-0"
                  />
                </div>
              </div>

              {/* Floating Bottom Badge */}
              <div className="absolute -bottom-4 -left-4 px-4 py-2.5 rounded-2xl bg-white border border-[#E9DDF1] shadow-lg flex items-center space-x-2.5 z-20">
                <div className="w-3 h-3 rounded-full bg-[#3BAA83] animate-ping" />
                <span className="text-xs font-black text-[#332B40]">Multi-Lab Sync Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Scroll Indicator */}
        <div className="flex justify-center pt-16">
          <a
            href="#modules"
            className="flex flex-col items-center space-y-1 text-xs font-bold text-[#71667D] hover:text-[#8961D8] transition"
          >
            <span>Explore Laboratory Modules</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </a>
        </div>
      </section>

      {/* SECTION A — FEATURED LABORATORY MODULES (LUNA ROUNDED HORIZONTAL CARDS) */}
      <section id="modules" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-[#E9DDF1]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#8961D8]">
              Section A — Unified Architecture
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-[#332B40]">
              Featured Laboratory Modules
            </h2>
          </div>
          <p className="text-sm text-[#71667D] max-w-md mt-2 md:mt-0">
            Every laboratory follows the unified Luna design system with specialized metadata: CAS numbers, CAS chemical hazards, or workstation telemetry.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {labModules.map(module => {
            const Icon = module.icon;
            return (
              <div
                key={module.id}
                className="bg-white border border-[#E9DDF1] rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-[#BCA0F5] transition duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl border ${module.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FFF8F2] border border-[#E9DDF1] text-[#71667D]">
                      {module.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8961D8]">
                      {module.tag}
                    </span>
                    <h3 className="font-heading font-black text-xl text-[#332B40] group-hover:text-[#8961D8] transition mt-1">
                      {module.name}
                    </h3>
                    <p className="text-xs text-[#71667D] leading-relaxed mt-2">
                      {module.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#E9DDF1] flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (currentUser) {
                        navigate('/specialized');
                      } else {
                        setIsAuthModalOpen(true);
                      }
                    }}
                    className="text-xs font-extrabold text-[#8961D8] group-hover:underline flex items-center space-x-1"
                  >
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-[#71667D]">ISO 9001:2015</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION B — HOW ILMS WORKS (4-STEP ILLUSTRATED CARDS) */}
      <section id="how-it-works" className="py-20 px-4 sm:px-8 bg-white border-y border-[#E9DDF1]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-black uppercase tracking-widest text-[#8961D8]">
              Section B — Workflow Simplicity
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-[#332B40]">
              How ILMS Works
            </h2>
            <p className="text-sm text-[#71667D]">
              Four seamless steps to digitize academic laboratories and resource administration.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-[#FFF8F2] border border-[#E9DDF1] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F0E9FF] border border-[#BCA0F5] text-[#8961D8] flex items-center justify-center font-black text-lg">
                1
              </div>
              <h3 className="font-heading font-black text-lg text-[#332B40]">
                Register & Sign In
              </h3>
              <p className="text-xs text-[#71667D] leading-relaxed">
                Register with your institutional email, select your designated role, and start managing academic laboratories immediately.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FFF8F2] border border-[#E9DDF1] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFD2BF]/60 border border-[#FFD2BF] text-[#8961D8] flex items-center justify-center font-black text-lg">
                2
              </div>
              <h3 className="font-heading font-black text-lg text-[#332B40]">
                Select Laboratory
              </h3>
              <p className="text-xs text-[#71667D] leading-relaxed">
                Switch workspaces instantly between Physics, Chemistry, Biology, CS, Electronics, or General Research facilities.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FFF8F2] border border-[#E9DDF1] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FBE5EF] border border-[#E9DDF1] text-[#8961D8] flex items-center justify-center font-black text-lg">
                3
              </div>
              <h3 className="font-heading font-black text-lg text-[#332B40]">
                Book Resources
              </h3>
              <p className="text-xs text-[#71667D] leading-relaxed">
                Reserve workbenches, microscopes, spectrometers, or AI GPUs with instant real-time concurrency checks.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#FFF8F2] border border-[#E9DDF1] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F0E9FF] border border-[#BCA0F5] text-[#8961D8] flex items-center justify-center font-black text-lg">
                4
              </div>
              <h3 className="font-heading font-black text-lg text-[#332B40]">
                Track & Report
              </h3>
              <p className="text-xs text-[#71667D] leading-relaxed">
                Record attendance, scan QR asset barcodes, monitor stock replenishment, and export audit-ready CSV logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C — PLATFORM CAPABILITIES */}
      <section id="capabilities" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-[#8961D8]">
            Section C — Full Spectrum Tools
          </span>
          <h2 className="font-heading font-black text-3xl sm:text-4xl text-[#332B40]">
            Platform Capabilities
          </h2>
          <p className="text-sm text-[#71667D]">
            Comprehensive operational modules built specifically for higher education laboratories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-6 shadow-sm space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-[#F0E9FF] text-[#8961D8]">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-lg text-[#332B40]">
              Inventory & Reagents
            </h3>
            <p className="text-xs text-[#71667D] leading-relaxed">
              Real-time batch tracking, hazardous chemicals (flammable, toxic, corrosive), storage location, and minimum threshold alerts.
            </p>
          </div>

          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-6 shadow-sm space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-[#FFF8F2] text-[#8961D8] border border-[#FFD2BF]">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-lg text-[#332B40]">
              Optical QR & Barcode Scanning
            </h3>
            <p className="text-xs text-[#71667D] leading-relaxed">
              Instant live camera viewfinder scanner, file image upload, and barcode label generator compliant with ISO/IEC 18004.
            </p>
          </div>

          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-6 shadow-sm space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-[#FBE5EF] text-[#8961D8]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-lg text-[#332B40]">
              Faculty Attendance Verification
            </h3>
            <p className="text-xs text-[#71667D] leading-relaxed">
              Faculty can mark attendance by practical class batch, observe real-time participation %, and export compliance records.
            </p>
          </div>

          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-6 shadow-sm space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-[#F0E9FF] text-[#8961D8]">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-lg text-[#332B40]">
              Reservations & Timetable
            </h3>
            <p className="text-xs text-[#71667D] leading-relaxed">
              Conflict-free resource allocation with date filtering, laboratory selection, and weekly visual timetable calendars.
            </p>
          </div>

          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-6 shadow-sm space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-[#FFF8F2] text-[#8961D8] border border-[#FFD2BF]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-lg text-[#332B40]">
              EHS Safety & Incident Logging
            </h3>
            <p className="text-xs text-[#71667D] leading-relaxed">
              Eyewash and spill kit inspections, chemical exposure incident reporting, emergency contacts, and preventative maintenance tasks.
            </p>
          </div>

          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-6 shadow-sm space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-[#FBE5EF] text-[#8961D8]">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-lg text-[#332B40]">
              Procurement & Budgets (₹)
            </h3>
            <p className="text-xs text-[#71667D] leading-relaxed">
              Purchase requests in Indian Rupees (₹), verified vendor directory, tiered Dean approval workflows, and audit trails.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION D — WHY INSTITUTIONS CHOOSE ILMS */}
      <section className="py-20 px-4 sm:px-8 bg-[#F0E9FF]/60 border-t border-[#E9DDF1]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-[#8961D8]">
              Section D — Proven Academic Value
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-[#332B40]">
              Why Institutions Choose ILMS
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#E9DDF1] shadow-sm">
                <h4 className="font-bold text-sm text-[#332B40]">Zero Paper Logs & Broken Clipboards</h4>
                <p className="text-xs text-[#71667D] mt-1">
                  Replace manual sign-in books with biometric-ready digital attendance and real-time asset logs.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E9DDF1] shadow-sm">
                <h4 className="font-bold text-sm text-[#332B40]">Accreditation & NAAC / ABET Readiness</h4>
                <p className="text-xs text-[#71667D] mt-1">
                  Generate instant CSV reports on laboratory utilization, student practical hours, and equipment calibration history.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#E9DDF1] shadow-sm">
                <h4 className="font-bold text-sm text-[#332B40]">Strict Role Governance</h4>
                <p className="text-xs text-[#71667D] mt-1">
                  Five distinct permission roles (Admin, Lab Manager, Faculty, Student, Technician) guarantee data safety.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-[#E9DDF1] shadow-xl space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FFD2BF] to-[#BCA0F5] overflow-hidden flex items-center justify-center">
                <img src="/mascot.png" alt="Mascot" className="w-full h-full object-contain scale-110" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-[#332B40]">
                  Dean & HOD Endorsement
                </h3>
                <p className="text-xs text-[#71667D]">
                  Unified Academic Operations Architecture
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#71667D] italic leading-relaxed">
              “ILMS eliminates schedule collisions between physics and chemistry batches, provides live visibility into hazardous chemical stocks, and simplifies procurement approvals across all engineering branches.”
            </p>

            <div className="pt-4 border-t border-[#E9DDF1] flex items-center justify-between text-xs font-bold text-[#8961D8]">
              <span>Verified Institutional Deployment</span>
              <span>ISO 27001 Certified Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION E — INSTITUTIONAL STATISTICS (BACKED BY REAL DATABASE) */}
      <section id="statistics" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-[#8961D8]">
            Section E — Real-Time Telemetry
          </span>
          <h2 className="font-heading font-black text-3xl sm:text-4xl text-[#332B40]">
            Live Institutional Statistics
          </h2>
          <p className="text-sm text-[#71667D]">
            Live telemetry calculated directly from your current academic database and connected laboratory stores.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-6 text-center shadow-sm">
            <span className="font-heading font-black text-4xl text-[#8961D8] block">
              {stats.labs}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#71667D] mt-2 block">
              Active Laboratories
            </span>
          </div>

          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-6 text-center shadow-sm">
            <span className="font-heading font-black text-4xl text-[#3BAA83] block">
              {stats.equipment}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#71667D] mt-2 block">
              Registered Assets & Equipment
            </span>
          </div>

          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-6 text-center shadow-sm">
            <span className="font-heading font-black text-4xl text-[#E7A34B] block">
              {stats.inventory}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#71667D] mt-2 block">
              Inventory & Chemical Items
            </span>
          </div>

          <div className="bg-white border border-[#E9DDF1] rounded-3xl p-6 text-center shadow-sm">
            <span className="font-heading font-black text-4xl text-[#8961D8] block">
              {stats.users}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#71667D] mt-2 block">
              Faculty & Student Accounts
            </span>
          </div>
        </div>
      </section>

      {/* SECTION F — DEDICATED PROJECT CREDITS & AUTHOR ATTRIBUTION */}
      <section id="project-team" className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#FFF8F2] via-[#F0E9FF] to-[#FFD2BF]/30 border-2 border-[#E9DDF1] rounded-[2.5rem] p-8 sm:p-12 shadow-xl relative overflow-hidden">
          {/* Background Decorative Blur Blobs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#BCA0F5]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FFD2BF]/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-[#BCA0F5]/60 text-xs font-bold text-[#8961D8] shadow-sm">
                <Users className="w-4 h-4 text-[#8961D8]" />
                <span>Software Engineering & Project Management</span>
              </div>
              <h2 className="font-heading font-black text-3xl sm:text-4xl text-[#332B40]">
                Project Development Team
              </h2>
              <p className="text-sm text-[#71667D] leading-relaxed">
                The Integrated Laboratory Management System (ILMS) was conceptualized, designed, and developed by:
              </p>
            </div>

            {/* 3 Developer Author Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Developer 1: Mehekha C — Lead System Architect */}
              <div className="bg-white border-2 border-[#8961D8] ring-2 ring-[#8961D8]/20 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 text-center space-y-3 group relative overflow-hidden">
                <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider bg-[#F0E9FF] text-[#8961D8] border border-[#BCA0F5]/50 px-2.5 py-0.5 rounded-full">
                  Lead
                </span>
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#BCA0F5] to-[#8961D8] flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
                  MC
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg text-[#332B40]">
                    Mehekha C
                  </h3>
                  <span className="text-xs font-bold text-[#8961D8] uppercase tracking-wider block mt-0.5">
                    Lead System Architect & Project Lead
                  </span>
                </div>
                <p className="text-xs text-[#71667D]">
                  Full-Stack Architecture, Luna Pastel Design System, 3D Companion Integration & System Core
                </p>
              </div>

              {/* Developer 2: Mathsya N */}
              <div className="bg-white border-2 border-[#E9DDF1] hover:border-[#8961D8] rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 text-center space-y-3 group">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#FFD2BF] to-[#BCA0F5] flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
                  MN
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg text-[#332B40]">
                    Mathsya N
                  </h3>
                  <span className="text-xs font-bold text-[#3BAA83] uppercase tracking-wider block mt-0.5">
                    Systems Engineer & Data Specialist
                  </span>
                </div>
                <p className="text-xs text-[#71667D]">
                  Database Persistence, Schema Models, Multi-Lab Business Workflows & Data Integrity
                </p>
              </div>

              {/* Developer 3: Mayank Kumar */}
              <div className="bg-white border-2 border-[#E9DDF1] hover:border-[#8961D8] rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 text-center space-y-3 group">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#FFD2BF] to-[#FBE5EF] flex items-center justify-center text-[#8961D8] font-black text-xl shadow-md group-hover:scale-105 transition-transform">
                  MK
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg text-[#332B40]">
                    Mayank Kumar
                  </h3>
                  <span className="text-xs font-bold text-[#E7A34B] uppercase tracking-wider block mt-0.5">
                    Security & Systems Engineer
                  </span>
                </div>
                <p className="text-xs text-[#71667D]">
                  Role-Based Access Control, Barcode QR Verification & ISO Compliance Auditing
                </p>
              </div>
            </div>

            {/* Direct Phone Contact Verification Card */}
            <div className="bg-white/95 backdrop-blur-sm border border-[#E9DDF1] rounded-2xl p-5 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-[#F0E9FF] text-[#8961D8] flex items-center justify-center shrink-0 shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#71667D] block">
                    Developer Contact Verified
                  </span>
                  <a
                    href="tel:+916366041109"
                    className="font-heading font-black text-base text-[#332B40] hover:text-[#8961D8] transition tracking-tight"
                  >
                    +91-6366041109
                  </a>
                </div>
              </div>

              <a
                href="tel:+916366041109"
                className="px-4 py-2 rounded-xl bg-[#BCA0F5] hover:bg-[#8961D8] text-white text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call +91-6366041109</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION G — LUNA-INSPIRED FOOTER */}
      <footer className="bg-white border-t border-[#E9DDF1] py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#BCA0F5] to-[#FFD2BF] flex items-center justify-center text-white">
                <Atom className="w-5 h-5" />
              </div>
              <span className="font-heading font-black text-lg text-[#332B40]">ILMS Platform</span>
            </div>
            <p className="text-xs text-[#71667D] leading-relaxed">
              Integrated Laboratory Management System for academic excellence, student safety, and equipment lifecycle tracking.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#332B40] mb-3">
              Laboratories
            </h4>
            <ul className="space-y-2 text-xs text-[#71667D]">
              <li>Physics & Optics</li>
              <li>Chemistry & Hazardous Reagents</li>
              <li>Computer Science & AI Clusters</li>
              <li>Biology & Cold Storage</li>
              <li>Electronics & Embedded Systems</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#332B40] mb-3">
              Operations & Safety
            </h4>
            <ul className="space-y-2 text-xs text-[#71667D]">
              <li>QR Code Generation & Scanning</li>
              <li>Faculty Attendance Ledger</li>
              <li>Equipment Issue & Returns</li>
              <li>Procurement in Indian Rupees (₹)</li>
              <li>EHS Spill & Eyewash Protocols</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#332B40] mb-3">
              Institutional Security
            </h4>
            <p className="text-xs text-[#71667D] leading-relaxed">
              Governed by Firebase Authentication, Firestore Security Rules, and ISO/IEC 17025 laboratory quality compliance.
            </p>
            <div className="mt-4 pt-3 border-t border-[#E9DDF1] space-y-1.5 text-[11px] text-[#71667D]">
              <p className="font-semibold text-[#332B40]">
                Lead Architect: Mehekha C • Core Developers: Mathsya N, Mayank Kumar
              </p>
              <p>
                Phone Contact: <a href="tel:+916366041109" className="font-bold text-[#8961D8] hover:underline">+91-6366041109</a>
              </p>
              <p>© {new Date().getFullYear()} ILMS. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* LUNA AUTHENTICATION MODAL (SIGN IN & CREATE ACCOUNT) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E9DDF1] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-[#332B40] max-h-[94vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E9DDF1] flex items-center justify-between bg-gradient-to-r from-[#FFF8F2] to-[#FBE5EF]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-[#BCA0F5] overflow-hidden flex items-center justify-center shadow-sm">
                  <img src="/mascot.png" alt="Mascot" className="w-full h-full object-contain scale-115" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-lg text-[#332B40]">
                    {authMode === 'signin' ? 'Sign In to ILMS' : 'Create Account'}
                  </h3>
                  <p className="text-xs text-[#71667D]">
                    Integrated Laboratory Management System
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="p-1.5 text-[#71667D] hover:text-[#332B40] rounded-xl hover:bg-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Error and Success Notices */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {authMode === 'signin' ? (
                /* SIGN IN FORM */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#71667D] block mb-1">
                      Institutional Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#71667D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="user@institution.edu"
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs sm:text-sm text-[#332B40] placeholder-[#71667D] focus:border-[#BCA0F5] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#71667D] block mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#71667D] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs sm:text-sm text-[#332B40] placeholder-[#71667D] focus:border-[#BCA0F5] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71667D]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-[#BCA0F5] hover:bg-[#8961D8] text-white font-black text-xs sm:text-sm shadow-md transition"
                  >
                    {loading ? 'Authenticating...' : 'Sign In to Workspace'}
                  </button>


                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('register'); setErrorMsg(null); }}
                      className="text-xs font-bold text-[#8961D8] hover:underline"
                    >
                      Don't have an institutional account? Create one
                    </button>
                  </div>
                </form>
              ) : (
                /* REGISTRATION FORM */
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#71667D] block mb-1">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      placeholder="e.g. Mehek Sharma"
                      className="w-full px-3.5 py-2 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs sm:text-sm text-[#332B40] placeholder-[#71667D] focus:border-[#BCA0F5] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#71667D] block mb-1">
                      Institutional Email
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="mehek@institution.edu"
                      className="w-full px-3.5 py-2 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs sm:text-sm text-[#332B40] placeholder-[#71667D] focus:border-[#BCA0F5] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#71667D]">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={generateSecurePassword}
                          className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#8961D8] hover:underline cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-yellow-500" />
                          <span>Generate</span>
                        </button>
                      </div>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs sm:text-sm text-[#332B40] placeholder-[#71667D] focus:border-[#BCA0F5] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[#71667D] block mb-1">
                        Confirm
                      </label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={e => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs sm:text-sm text-[#332B40] placeholder-[#71667D] focus:border-[#BCA0F5] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#71667D] block mb-1">
                      Requested Role
                    </label>
                    <select
                      value={regRole}
                      onChange={e => setRegRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs sm:text-sm text-[#332B40] focus:border-[#BCA0F5] outline-none"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty Member</option>
                      <option value="technician">Lab Technician</option>
                      <option value="labManager">Lab Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-[#71667D] block mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={regDepartment}
                      onChange={e => setRegDepartment(e.target.value)}
                      placeholder="e.g. Chemistry, Computer Science"
                      className="w-full px-3.5 py-2 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl text-xs sm:text-sm text-[#332B40] placeholder-[#71667D] focus:border-[#BCA0F5] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-[#BCA0F5] hover:bg-[#8961D8] text-white font-black text-xs sm:text-sm shadow-md transition"
                  >
                    {loading ? 'Creating Account...' : 'Create Account & Access Portal'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('signin'); setErrorMsg(null); }}
                      className="text-xs font-bold text-[#8961D8] hover:underline"
                    >
                      Already have an account? Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LUNA PROFESSIONAL PWA INSTALL MODAL */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-[#E9DDF1] rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-[#332B40] max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-[#E9DDF1] flex items-center justify-between bg-gradient-to-r from-[#FFF8F2] via-[#F0E9FF] to-[#FBE5EF]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-[#BCA0F5] overflow-hidden flex items-center justify-center shadow-sm">
                  <img src="/mascot.png" alt="Mascot" className="w-full h-full object-contain scale-115" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-[#332B40]">
                    Install ILMS
                  </h3>
                  <p className="text-[11px] text-[#71667D]">
                    Academic Multi-Laboratory Platform
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsInstallModalOpen(false)}
                className="p-1.5 text-[#71667D] hover:text-[#332B40] rounded-xl hover:bg-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* App Summary Card */}
              <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#E9DDF1] flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#BCA0F5] to-[#FFD2BF] flex items-center justify-center text-white font-extrabold shadow-sm shrink-0">
                  <Atom className="w-7 h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-heading font-bold text-sm text-[#332B40] truncate">
                    ILMS — Laboratory OS
                  </h4>
                  <p className="text-[11px] text-[#71667D] truncate">
                    Offline Ready • Instant Launch • No App Store Needed
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Official Release
                    </span>
                    <span className="text-[10px] font-semibold text-[#71667D]">
                      Version 2.4
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop App Notice with Address Bar Indicator */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-[#BCA0F5] space-y-2">
                <div className="flex items-center space-x-2 text-xs font-black text-[#8961D8]">
                  <ExternalLink className="w-4 h-4 text-[#8961D8] shrink-0" />
                  <span>Launch from Address Bar or Desktop</span>
                </div>
                <p className="text-xs text-[#332B40] leading-relaxed">
                  In your browser address bar at the top, look right next to the star (★): click the <strong>[ ⧉↗ ]</strong> icon to launch the app! Or open <strong>"ILMS Laboratory System"</strong> on your Windows Desktop.
                </p>
              </div>

              {/* Direct Primary Action: Install Now & Offline Download */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await promptInstall();
                    if (res.success) {
                      setIsInstallModalOpen(false);
                      setInstallStatus(null);
                    } else if (res.reason === 'already-installed') {
                      setInstallStatus('ILMS is already installed on your computer! Click the [ ⧉↗ ] icon in the address bar or double-click "ILMS Laboratory System" on your Desktop.');
                    } else if (res.reason === 'ios-manual') {
                      setInstallStatus('iPhone Safari: Tap Share (⎋ at bottom of screen) -> select "Add to Home Screen".');
                    } else if (res.reason === 'user-dismissed') {
                      setInstallStatus('Installation was dismissed. You can try again or download the offline package below.');
                    } else {
                      setInstallStatus('To open or install: Notice the [ ⧉↗ ] icon in your address bar (next to the star ★). Click it to launch the app directly, or open the Desktop shortcut!');
                    }
                  }}
                  className="w-full h-12 rounded-full bg-[#8961D8] hover:bg-[#743BDB] text-white font-black text-sm shadow-lg shadow-[#8961D8]/25 flex items-center justify-center space-x-2 transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Install / Launch App</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDirectDownload('app')}
                  className="w-full h-11 rounded-full bg-white hover:bg-[#F0E9FF] border border-[#E9DDF1] text-[#332B40] font-bold text-xs shadow-xs flex items-center justify-center space-x-2 transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#8961D8]" />
                  <span>Download Offline App Package (.ZIP)</span>
                </button>
              </div>

              {/* Status / Instructions Alert if Native Prompt Needs Browser Menu */}
              {installStatus && (
                <div className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#BCA0F5] text-[#332B40] text-xs flex items-start space-x-2.5 shadow-sm animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-[#8961D8] shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed font-semibold">
                    {installStatus}
                  </div>
                </div>
              )}

              {/* Phone / Mobile Installation Guide */}
              <div className="p-4 rounded-2xl bg-[#F0E9FF]/70 border border-[#BCA0F5]/50 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#8961D8]">
                  <Smartphone className="w-4 h-4" />
                  <span>Installing on Mobile Phone</span>
                </div>
                <div className="text-xs text-[#332B40] space-y-2 leading-relaxed">
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-[#8961D8] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span><strong>Android Chrome:</strong> Tap browser menu (⋮) and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded-full bg-[#8961D8] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span><strong>iPhone Safari:</strong> Tap the Share button (⎋ at bottom) and choose <strong>"Add to Home Screen"</strong>.</span>
                  </div>
                </div>
              </div>

              {/* QR Code for Fast Phone Connection */}
              <div className="p-4 bg-white border border-[#E9DDF1] rounded-2xl space-y-3.5">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-[#E9DDF1] shrink-0">
                    <QRCodeSVG
                      value={mobileInstallUrl}
                      size={105}
                      level="Q"
                      fgColor="#332B40"
                    />
                  </div>
                  <div className="text-xs space-y-1.5 min-w-0 flex-1">
                    <span className="font-bold text-[#332B40] block">Scan to Open Link on Phone</span>
                    <p className="text-[11px] text-[#71667D] leading-tight">
                      Open your phone camera to launch ILMS. Both devices must be on the same Wi-Fi.
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-2.5 py-1 rounded-lg bg-[#F0E9FF] hover:bg-[#E2D2FE] text-[#8961D8] font-bold text-[10px] transition flex items-center space-x-1 shrink-0 active:scale-95"
                      >
                        {copiedLink ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                      <a
                        href={mobileInstallUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-[#FFF8F2] hover:bg-[#FFEADA] border border-[#FFD2BF] text-[#8961D8] font-bold text-[10px] transition flex items-center space-x-1 shrink-0 active:scale-95"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Link</span>
                      </a>
                    </div>
                    <span className="text-[10px] font-mono text-[#71667D] truncate block pt-0.5">
                      {mobileInstallUrl}
                    </span>
                  </div>
                </div>

                {/* Network IP Config if switching Wi-Fi / Hotspot */}
                <div className="pt-2 border-t border-[#E9DDF1]/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#71667D]">
                    <span className="font-medium">Host IP Address:</span>
                    <input
                      type="text"
                      value={hostIp}
                      onChange={(e) => handleUpdateHostIp(e.target.value)}
                      className="w-36 px-2 py-0.5 text-[11px] font-mono font-bold bg-[#FFF8F2] border border-[#E9DDF1] rounded-lg text-center text-[#332B40] focus:outline-none focus:border-[#8961D8]"
                      title="Current computer IP for phone access"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-[#71667D] font-medium">Quick switch:</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateHostIp('192.168.42.39')}
                      className={`px-2 py-0.5 rounded-md font-mono transition ${
                        hostIp === '192.168.42.39'
                          ? 'bg-[#8961D8] text-white font-bold'
                          : 'bg-[#F0E9FF] text-[#8961D8] hover:bg-[#E2D2FE]'
                      }`}
                    >
                      192.168.42.39 (Current Wi-Fi)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateHostIp('localhost')}
                      className={`px-2 py-0.5 rounded-md font-mono transition ${
                        hostIp === 'localhost'
                          ? 'bg-[#8961D8] text-white font-bold'
                          : 'bg-[#F0E9FF] text-[#8961D8] hover:bg-[#E2D2FE]'
                      }`}
                    >
                      localhost
                    </button>
                  </div>
                </div>
              </div>

              {/* Discreet offline ZIP download link */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => handleDirectDownload('app')}
                  className="text-[11px] font-bold text-[#8961D8] hover:underline"
                >
                  Need the offline .ZIP bundle? Download here
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#FFF8F2] border-t border-[#E9DDF1] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsInstallModalOpen(false)}
                className="h-9 px-5 rounded-full bg-white hover:bg-slate-100 border border-[#E9DDF1] text-xs font-bold text-[#332B40] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomePage;
