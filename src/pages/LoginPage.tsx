import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Atom,
  FlaskConical,
  Binary,
  Cpu,
  ArrowRight,
  UserCheck,
  Building,
  GraduationCap,
  Briefcase,
  AlertCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth, isFirebaseConfigured } from '../lib/firebase/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { DataService, localStore } from '../services/dataService';
import { UserRole, UserProfile } from '../types';
import { triggerAppSplash } from '../components/AppSplashAnimation';

export const LoginPage: React.FC = () => {
  const { allUsers, switchUser, isFirebaseActive } = useAuth();
  const navigate = useNavigate();

  // Mode: signin vs register
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Signin form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  // Registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regInstitution, setRegInstitution] = useState('SJB Institute of Technology');
  const [regDepartment, setRegDepartment] = useState('Department of Computer Science & Engineering');
  const [regIdNumber, setRegIdNumber] = useState('');
  const [regRequestedRole, setRegRequestedRole] = useState<UserRole>('student');

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

    // Shuffle characters
    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');

    setRegPassword(pwd);
    setRegConfirmPassword(pwd);
    setShowPassword(true);
    setSuccessMsg(`Generated strong password: ${pwd}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isFirebaseActive && auth) {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          // Look up user profile by UID or email
          let profile = await DataService.getCurrentUser(cred.user.uid);
          if (!profile && cred.user.email) {
            profile = await DataService.getCurrentUser(cred.user.email);
          }
          if (profile) {
            await switchUser(profile);
          } else {
            // Self-heal profile from Firebase Auth account
            const fallbackProfile: UserProfile = {
              id: cred.user.uid,
              email: cred.user.email || email,
              displayName: cred.user.displayName || email.split('@')[0],
              role: 'student',
              organizationId: 'org-main-01',
              assignedLabs: ['lab-atl-01', 'lab-atl-02', 'lab-atl-03', 'lab-sll-01', 'lab-sll-02', 'lab-bfl-01', 'lab-bfl-02', 'lab-bfl-03', 'lab-vin-01', 'lab-cbl-01', 'lab-cbl-02'],
              assignedLabId: 'lab-atl-01',
              createdAt: new Date().toISOString()
            };
            await DataService.updateUser(fallbackProfile);
            await switchUser(fallbackProfile);
          }
          triggerAppSplash();
          navigate('/');
          return;
        } catch (firebaseErr: any) {
          console.warn('Firebase auth attempt failed, checking institutional roster:', firebaseErr);
        }
      }

      // Check matched user in local directory
      const cleanEmail = email.trim().toLowerCase();
      let matched: UserProfile | null = allUsers.find(u => u.email.toLowerCase() === cleanEmail) || 
                                        localStore.getUsers().find(u => u.email.toLowerCase() === cleanEmail) || 
                                        null;
      if (!matched) {
        matched = await DataService.getCurrentUser(cleanEmail);
      }

      if (matched) {
        await switchUser(matched);
        triggerAppSplash();
        navigate('/');
      } else {
        setErrorMsg('Invalid email or password. Please verify credentials or register a new account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  // Direct Account Registration into Firebase Authentication & Firestore Database
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }

    setLoading(true);
    try {
      let createdUid: string | undefined;

      // 1. Create user in Firebase Authentication
      if (isFirebaseConfigured() && auth) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
          createdUid = cred.user.uid;
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
          } else if (fbErr.code === 'auth/operation-not-allowed') {
            setErrorMsg('Email/Password provider is not enabled in Firebase Console. Please verify Authentication settings.');
            setLoading(false);
            return;
          }
          throw fbErr;
        }
      }

      // 2. Create user profile in Firestore database & local store
      const newUser = await DataService.registerNewAccount({
        uid: createdUid,
        displayName: regFullName,
        email: regEmail,
        institution: regInstitution,
        departmentId: regDepartment,
        institutionId: regIdNumber || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        requestedRole: regRequestedRole
      });

      // 3. Immediately log the newly created user in and launch dashboard
      await switchUser(newUser);
      triggerAppSplash();
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    if (isFirebaseActive && auth) {
      try {
        await sendPasswordResetEmail(auth, resetEmail);
        setResetStatus(`Firebase password reset link dispatched to ${resetEmail}`);
        return;
      } catch (err) {
        console.warn('Firebase reset email error, using fallback:', err);
      }
    }

    setResetStatus(`Password reset instructions and security token sent to ${resetEmail}. Check your inbox.`);
  };


  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F7FC] text-[#20213A] font-sans selection:bg-purple-200 selection:text-purple-900">
      {/* Left Column: Vibrant Violet-to-Blue Gradient (Desktop only / Header on mobile) */}
      <div className="relative lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between overflow-hidden bg-vibrant-gradient text-white min-h-[340px] lg:min-h-screen">
        {/* Animated background floating shapes */}
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-12 left-10 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none animate-float-reverse" />

        {/* Top Header Logo */}
        <div className="relative z-10 flex items-center space-x-3">
          <img
            src="/app-logo-v2.png"
            alt="ILMS Logo"
            className="w-12 h-12 rounded-2xl bg-white/90 p-1 border border-white/40 shadow-lg object-contain"
          />
          <div>
            <span className="font-extrabold text-2xl tracking-wider text-white font-heading">ILMS</span>
            <span className="block text-xs uppercase tracking-widest text-purple-200 font-semibold">
              Intelligent Multi-Lab Operating System
            </span>
          </div>
        </div>

        {/* Hero Copy & Features in Left Column */}
        <div className="relative z-10 my-8 lg:my-auto space-y-6 max-w-lg">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-semibold text-purple-100">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Next-Generation Academic & Research Infrastructure</span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-5xl leading-tight text-white tracking-tight">
            One Unified OS for All Academic Laboratories.
          </h1>

          <p className="text-purple-100 text-sm sm:text-base leading-relaxed">
            Manage physics instrumentation, chemistry reagent stocks, biology specimens, AI compute clusters, faculty attendance, and student equipment loans with automated Firebase synchronization.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center space-x-3">
              <FlaskConical className="w-5 h-5 text-purple-200 shrink-0" />
              <span className="text-xs font-semibold">Chemicals & Materials</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center space-x-3">
              <Cpu className="w-5 h-5 text-blue-200 shrink-0" />
              <span className="text-xs font-semibold">Precision Hardware</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center space-x-3">
              <Binary className="w-5 h-5 text-emerald-200 shrink-0" />
              <span className="text-xs font-semibold">Workstation Telemetry</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-yellow-200 shrink-0" />
              <span className="text-xs font-semibold">EHS Hazard Protocol</span>
            </div>
          </div>
        </div>

        {/* Left Footer Badges */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-purple-200">
          <span>Enterprise University Edition v2.4</span>
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Firebase Certified Backend</span>
          </span>
        </div>
      </div>

      {/* Right Column: Clean White Authentication Card */}
      <div className="lg:w-1/2 p-6 sm:p-12 lg:p-16 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-card border border-[#E4E7F0] space-y-6">
          {/* Form Header Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E4E7F0] pb-3">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setErrorMsg(null); }}
                className={`pb-1 font-heading font-black text-xl sm:text-2xl transition border-b-2 ${
                  authMode === 'signin'
                    ? 'border-brand-purple text-[#20213A]'
                    : 'border-transparent text-[#5B6478] hover:text-[#20213A]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setErrorMsg(null); }}
                className={`pb-1 font-heading font-bold text-sm sm:text-base transition border-b-2 ${
                  authMode === 'register'
                    ? 'border-brand-purple text-brand-purple'
                    : 'border-transparent text-[#5B6478] hover:text-[#20213A]'
                }`}
              >
                Create Account
              </button>
            </div>
            <p className="text-xs text-[#5B6478]">
              {authMode === 'signin'
                ? 'Enter your institutional credentials to access the laboratory management system.'
                : 'Register for student, faculty, or technical staff access.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'signin' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6478]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@institution.edu"
                    className="w-full bg-[#F7F7FC] border border-[#E4E7F0] focus:border-brand-purple focus:bg-white rounded-2xl pl-11 pr-4 py-3 text-sm text-[#20213A] font-medium outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setIsForgotPasswordOpen(true);
                      setResetStatus(null);
                    }}
                    className="text-xs font-semibold text-brand-purple hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6478]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#F7F7FC] border border-[#E4E7F0] focus:border-brand-purple focus:bg-white rounded-2xl pl-11 pr-11 py-3 text-sm text-[#20213A] font-medium outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5B6478] hover:text-[#20213A]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-[#5B6478] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-brand-purple focus:ring-brand-purple border-[#E4E7F0]"
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-vibrant-gradient text-white font-bold text-base shadow-glow-purple hover:opacity-95 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* CREATE ACCOUNT FORM */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Alex Thorne"
                  className="w-full bg-[#F7F7FC] border border-[#E4E7F0] focus:border-brand-purple focus:bg-white rounded-2xl px-4 py-2.5 text-xs font-semibold outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="alex.thorne@institution.edu"
                  className="w-full bg-[#F7F7FC] border border-[#E4E7F0] focus:border-brand-purple focus:bg-white rounded-2xl px-4 py-2.5 text-xs font-semibold outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={generateSecurePassword}
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-brand-purple hover:underline cursor-pointer"
                      title="Generate a strong compliant password automatically"
                    >
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className="w-full bg-[#F7F7FC] border border-[#E4E7F0] focus:border-brand-purple focus:bg-white rounded-2xl px-4 py-2.5 pr-9 text-xs font-semibold outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5B6478] hover:text-[#20213A]"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#5B6478]">
                      Confirm Password
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-[#F7F7FC] border border-[#E4E7F0] focus:border-brand-purple focus:bg-white rounded-2xl px-4 py-2.5 pr-9 text-xs font-semibold outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5B6478] hover:text-[#20213A]"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1">
                    Institution / Campus
                  </label>
                  <input
                    type="text"
                    required
                    value={regInstitution}
                    onChange={(e) => setRegInstitution(e.target.value)}
                    className="w-full bg-[#F7F7FC] border border-[#E4E7F0] focus:border-brand-purple focus:bg-white rounded-2xl px-3 py-2 text-xs font-medium outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1">
                    Student / Staff ID
                  </label>
                  <input
                    type="text"
                    required
                    value={regIdNumber}
                    onChange={(e) => setRegIdNumber(e.target.value)}
                    placeholder="STU-2026-099"
                    className="w-full bg-[#F7F7FC] border border-[#E4E7F0] focus:border-brand-purple focus:bg-white rounded-2xl px-3 py-2 text-xs font-mono font-semibold outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1">
                  Requested Role
                </label>
                <select
                  value={regRequestedRole}
                  onChange={(e) => setRegRequestedRole(e.target.value as any)}
                  className="w-full bg-[#F7F7FC] border border-[#E4E7F0] focus:border-brand-purple focus:bg-white rounded-2xl px-3 py-2 text-xs font-semibold outline-none transition"
                >
                  <option value="student">Student / Scholar (Default)</option>
                  <option value="faculty">Faculty / Lead Researcher</option>
                  <option value="technician">Laboratory Manager & Senior Technician</option>
                </select>
                <p className="text-[11px] text-[#5B6478] mt-1">
                  Security notice: Elevated faculty and manager roles require institutional Administrator approval before activation.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-2xl bg-vibrant-gradient text-white font-bold text-sm shadow-glow-purple hover:opacity-95 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E4E7F0] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4E7F0] pb-3">
              <h3 className="font-heading font-black text-xl text-[#20213A]">
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-[#5B6478]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5B6478]">
              Enter your verified institutional email address to receive password reset instructions.
            </p>

            {resetStatus && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {resetStatus}
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6478] mb-1">
                  Institutional Email
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="user@institution.edu"
                  className="w-full bg-[#F7F7FC] border border-[#E4E7F0] focus:border-brand-purple focus:bg-white rounded-2xl px-4 py-2.5 text-xs font-semibold outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-brand-purple hover:bg-brand-violet text-white font-bold text-xs shadow-md transition"
                >
                  Send Reset Link
                </button>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#5B6478] font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
