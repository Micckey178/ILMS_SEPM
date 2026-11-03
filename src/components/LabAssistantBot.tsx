import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X,
  Sparkles,
  ArrowRight,
  Send,
  Minimize2,
  Calendar,
  CheckCircle2,
  Boxes,
  Microscope,
  BookOpen,
  FileText,
  ShieldCheck,
  Wrench,
  ShoppingCart,
  QrCode,
  Building2,
  Users,
  Compass,
  MessageSquare,
  HelpCircle,
  Clock,
  Heart,
  Volume2,
  VolumeX,
  ThumbsUp,
  RotateCcw,
  Palette,
  Terminal,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { localStore } from '../services/dataService';
import { applyTheme, getSavedTheme } from '../utils/themeManager';

export interface InteractiveFollowUp {
  label: string;
  query: string;
  icon?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'lumi' | 'user';
  text: string;
  displayedText?: string;
  isStreaming?: boolean;
  actionPath?: string;
  actionLabel?: string;
  specialAction?: 'open_qr' | 'toggle_theme' | 'open_command';
  followUps?: InteractiveFollowUp[];
  timestamp: string;
  reaction?: 'liked' | 'thanked';
}

export const LabAssistantBot: React.FC = () => {
  const { currentUser, activeLab } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Dialog and panel state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Proactive speech bubble state
  const [bubbleText, setBubbleText] = useState<string>('Hi there! 👋 Welcome to ILMS. I\'ll help you find your way around.');
  const [isBubbleVisible, setIsBubbleVisible] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Mouse & Eye Tracking State
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [headTilt, setHeadTilt] = useState({ rotateX: 0, rotateY: 0, rotateZ: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isApproaching, setIsApproaching] = useState(false);
  const [isWaving, setIsWaving] = useState(true);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const avatarButtonRef = useRef<HTMLButtonElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<any>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const streamingTimerRef = useRef<any>(null);

  const role = currentUser?.role || 'student';
  const currentPath = location.pathname;

  // 1. First Visit Wave Animation (2.5 seconds on mount)
  useEffect(() => {
    const waveTimer = setTimeout(() => {
      setIsWaving(false);
    }, 2500);
    return () => clearTimeout(waveTimer);
  }, []);

  // 2. Natural Periodic Blinking (Every 4.2 - 6.2 seconds)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (document.hidden) return;
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 4200 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // 3. Mouse-Aware Head & Gaze Tracking with Smooth 3D Interpolation
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (document.hidden) return;

    // Do NOT let AI react to the motion of mouse on the login / welcome page
    const isLoginPage = currentPath.includes('/login') || currentPath.includes('/welcome');
    if (isLoginPage) {
      setEyeOffset({ x: 0, y: 0 });
      setHeadTilt({ rotateX: 0, rotateY: 0, rotateZ: 0 });
      setIsApproaching(false);
      return;
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEyeOffset({ x: 0, y: 0 });
      setHeadTilt({ rotateX: 0, rotateY: 0, rotateZ: 0 });
      return;
    }

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    // Reset idle timer on user activity (fires after 35s of inactivity)
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (!isOpen) {
        setBubbleText('Take your time. I\'m here if you need help.');
        setIsBubbleVisible(true);
      }
    }, 35000);

    const targetEl = avatarButtonRef.current || containerRef.current;
    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * 0.35; // Face level

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Proximity detection
    const isClose = distance < 160;
    setIsApproaching(isClose);

    // Natural eye clamping (max 4.2px)
    const maxShift = isClose ? 4.2 : 3.5;
    const angle = Math.atan2(dy, dx);
    const distRatio = Math.min(distance / 350, 1);

    const shiftX = Math.cos(angle) * distRatio * maxShift;
    const shiftY = Math.sin(angle) * distRatio * (maxShift * 0.75);

    setEyeOffset({ x: shiftX, y: shiftY });

    // Subtle 3D head tilt (perspective rotateX / rotateY / rotateZ)
    const curiousTiltZ = isClose ? (dx > 0 ? 3.5 : -3.5) : 0;
    const rotY = Math.max(-7, Math.min(7, dx / 45));
    const rotX = Math.max(-5, Math.min(5, -dy / 55));

    setHeadTilt({ rotateX: rotX, rotateY: rotY, rotateZ: curiousTiltZ });
  }, [isOpen, currentPath]);

  // Reset head tilt and eye offset when route changes (especially on login/welcome)
  useEffect(() => {
    const isLoginPage = currentPath.includes('/login') || currentPath.includes('/welcome');
    if (isLoginPage) {
      setEyeOffset({ x: 0, y: 0 });
      setHeadTilt({ rotateX: 0, rotateY: 0, rotateZ: 0 });
      setIsApproaching(false);
    }
  }, [currentPath]);

  const handlePointerLeaveWindow = useCallback(() => {
    setEyeOffset({ x: 0, y: 0 });
    setHeadTilt({ rotateX: 0, rotateY: 0, rotateZ: 0 });
    setIsApproaching(false);
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeaveWindow, { passive: true });
    window.addEventListener('blur', handlePointerLeaveWindow, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeaveWindow);
      window.removeEventListener('blur', handlePointerLeaveWindow);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [handlePointerMove, handlePointerLeaveWindow]);

  // 4. App-Wide Notifications Event Listener
  useEffect(() => {
    const handleLumiNotify = (e: any) => {
      const detail = e.detail;
      if (detail && detail.message) {
        setBubbleText(detail.message);
        setIsBubbleVisible(true);
        if (detail.type === 'success') {
          setIsCelebrating(true);
          setTimeout(() => setIsCelebrating(false), 2400);
        }
      }
    };

    window.addEventListener('lumi:notify', handleLumiNotify);
    return () => window.removeEventListener('lumi:notify', handleLumiNotify);
  }, []);

  // 5. Contextual Speech Bubble based on current route
  useEffect(() => {
    let message = 'Hi there! 👋 Welcome to ILMS. I\'ll help you find your way around.';

    if (currentPath.includes('/login') || currentPath.includes('/welcome')) {
      message = 'Hi there! 👋 Welcome to ILMS. I\'ll help you find your way around.';
    } else if (currentPath.includes('/bookings')) {
      message = 'Looking for a lab slot? Let\'s find an available time.';
    } else if (currentPath.includes('/attendance')) {
      message = role === 'student'
        ? 'Here is your practical session participation rate (minimum 75% required).'
        : 'Record student practical attendance or download official accredited rosters.';
    } else if (currentPath.includes('/inventory') || currentPath.includes('/equipment')) {
      message = 'I can help you find equipment and check stock availability.';
    } else if (currentPath.includes('/reports')) {
      message = 'Want to understand a report? Select one and I\'ll explain what it contains.';
    } else if (currentPath.includes('/schedule')) {
      message = 'Here is your unified timetable across all engineering and science labs.';
    } else if (currentPath.includes('/maintenance')) {
      message = 'Preventative maintenance and calibration overdues are tracked here.';
    } else if (currentPath.includes('/safety')) {
      message = 'Safety protocol active: Check eyewash stations, spill kits, and incident logs.';
    } else if (currentPath.includes('/procurement')) {
      message = 'Browse certified institutional vendors and approve orders in Indian Rupees (₹).';
    } else if (currentPath.includes('/settings')) {
      message = 'Customize your instant theme, password security, and notification channels.';
    } else if (currentPath.includes('/laboratories')) {
      message = 'Switch between Physics, Chemistry, CS, Biology, and Engineering workspaces.';
    } else if (currentPath === '/') {
      message = 'Let\'s check your laboratory activities for today.';
    }

    setBubbleText(message);
    setIsBubbleVisible(true);

    const hideTimer = setTimeout(() => {
      if (!isHovered && !isOpen) {
        setIsBubbleVisible(false);
      }
    }, 9000);

    return () => clearTimeout(hideTimer);
  }, [currentPath, role, isHovered, isOpen]);

  // Initial welcome message in chat history with interactive follow-up chips
  useEffect(() => {
    const userName = currentUser?.displayName || 'Colleague';
    const facilityName = activeLab?.name || 'Academic Facility';

    setMessages([
      {
        id: 'msg-welcome',
        sender: 'lumi',
        text: `Hello ${userName}! 👋 I'm Lumi, your personal ILMS companion. You are currently in "${facilityName}". How can I assist your laboratory work today?`,
        displayedText: `Hello ${userName}! 👋 I'm Lumi, your personal ILMS companion. You are currently in "${facilityName}". How can I assist your laboratory work today?`,
        isStreaming: false,
        followUps: [
          { label: '📅 How do I book a lab?', query: 'How do I book a lab?' },
          { label: '📊 Where can I see my attendance?', query: 'Where can I see my attendance?' },
          { label: '🔬 How do I request equipment?', query: 'How do I request equipment?' },
          { label: '📸 Scan QR barcode', query: 'How do I scan an asset QR code with my camera?' }
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [currentUser, activeLab]);

  // Scroll to bottom on new message or during streaming
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isThinking, isSpeaking]);

  // Text-To-Speech Synthesis function
  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Clean up markdown / emoji from speech text
      const cleanText = text.replace(/[*_#`]/g, '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.pitch = 1.15;
      utterance.rate = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const friendlyVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Google US English')));
      if (friendlyVoice) utterance.voice = friendlyVoice;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis unavailable', e);
    }
  };

  // 6. Interactive Rule-based & Live Data Knowledge Engine
  const answerQuery = (userQuery: string): {
    text: string;
    actionPath?: string;
    actionLabel?: string;
    specialAction?: 'open_qr' | 'toggle_theme' | 'open_command';
    followUps?: InteractiveFollowUp[];
  } => {
    const q = userQuery.toLowerCase();

    // Live inventory inspection for specific chemical / item
    if (q.includes('acetone') || q.includes('acid') || q.includes('ethanol') || q.includes('chemical') || q.includes('reagent')) {
      const inventory = localStore.getInventory();
      const match = inventory.find(i => i.name.toLowerCase().includes('acetone') || i.name.toLowerCase().includes('acid') || i.name.toLowerCase().includes('hydrochloric') || i.name.toLowerCase().includes('ethanol'));
      if (match) {
        return {
          text: `🔍 Live Inventory Check: We have **${match.name}** in stock! Current quantity is **${match.quantity} ${match.unit}** (Min threshold: ${match.minStock} ${match.unit}). Located in **${match.storageLocation}** under category **${match.category}**.`,
          actionPath: '/inventory',
          actionLabel: 'View in Inventory Register',
          followUps: [
            { label: '⚠️ Check low stock reagents', query: 'What items are low on stock?' },
            { label: '📸 Scan barcode with camera', query: 'Scan QR with camera' },
            { label: '📦 Create purchase request', query: 'How do I submit a purchase order in Rupees (₹)?' }
          ]
        };
      }
    }

    // Live low-stock checker
    if (q.includes('low stock') || q.includes('out of stock') || q.includes('threshold') || q.includes('replenish')) {
      const inventory = localStore.getInventory();
      const lowItems = inventory.filter(i => i.quantity <= i.minStock || i.isLowStock);
      const listSummary = lowItems.slice(0, 3).map(i => `• ${i.name} (${i.quantity}/${i.minStock} ${i.unit})`).join('\n');
      return {
        text: `⚠️ **${lowItems.length} items** currently need replenishment below minimum thresholds:\n${listSummary || 'All chemical levels are currently optimal!'}\n\nWould you like to draft a tiered purchase order for these materials?`,
        actionPath: '/procurement',
        actionLabel: 'Open Procurement Module',
        followUps: [
          { label: '💰 Draft purchase order (₹)', query: 'How do I submit a purchase order in Rupees (₹)?' },
          { label: '📋 View Universal Inventory', query: 'View chemical inventory' },
          { label: '🔬 Check Equipment Status', query: 'Check equipment status' }
        ]
      };
    }

    // Live Equipment status / instruments
    if (q.includes('equipment') || q.includes('spectrophotometer') || q.includes('oscilloscope') || q.includes('centrifuge') || q.includes('instrument')) {
      const equipment = localStore.getEquipment();
      const activeItems = equipment.filter(e => e.status === 'AVAILABLE' || e.status === 'IN_USE');
      return {
        text: `🔬 We have **${equipment.length} registered equipment instruments** (**${activeItems.length} operational & active**). All items include calibration validity dates and ISO compliance logs. You can reserve any apparatus for your practical session.`,
        actionPath: '/equipment',
        actionLabel: 'Browse Equipment Register',
        followUps: [
          { label: '📅 Reserve instrument slot', query: 'How do I book a lab?' },
          { label: '📸 Scan instrument QR tag', query: 'How do I scan an asset QR code with my camera?' },
          { label: '🔧 Maintenance & calibration', query: 'What preventative maintenance is overdue?' }
        ]
      };
    }

    // QR Code / Camera Scanner
    if (q.includes('qr') || q.includes('camera') || q.includes('scan') || q.includes('barcode')) {
      return {
        text: '📸 You can activate your device camera right now to scan QR tags or asset barcodes! You can also upload a photo of a barcode or use 1-click test simulation chips.',
        actionPath: '/inventory',
        actionLabel: 'Open Inventory Register',
        specialAction: 'open_qr',
        followUps: [
          { label: '📸 Launch QR Camera Scanner Now', query: 'Open QR scanner' },
          { label: '🧪 Search chemical by CAS number', query: 'Where can I find hazardous SDS storage details?' },
          { label: '📦 Browse all inventory items', query: 'View chemical inventory' }
        ]
      };
    }

    // 1-Click Demo / Login / Authentication
    if (q.includes('sign in') || q.includes('login') || q.includes('demo') || q.includes('credential')) {
      return {
        text: 'To sign in: Use the **1-Click Demo Access** buttons on the Welcome page for instant Administrator, Faculty, Technician, or Student roles. Alternatively, sign in directly with your university email and password.',
        actionPath: '/welcome',
        actionLabel: 'Go to Login & Demo Access',
        followUps: [
          { label: '🚀 Try 1-Click Demo Access', query: 'How do I sign in with 1-click demo access?' },
          { label: '📝 How do I register an account?', query: 'How do I register a new laboratory account?' },
          { label: '👥 What roles are available?', query: 'What user roles and permissions are supported?' }
        ]
      };
    }

    // Registration & Account Creation
    if (q.includes('register') || q.includes('signup') || q.includes('create account') || q.includes('verification')) {
      return {
        text: 'To register an account: Switch to the **Register** tab on the Welcome page. Enter your Full Name, institutional email, department, and select your role to immediately activate your academic laboratory permissions.',
        actionPath: '/welcome',
        actionLabel: 'Open Registration Tab',
        followUps: [
          { label: '🚀 Try 1-Click Demo instead', query: 'How do I sign in with 1-click demo access?' },
          { label: '🏫 Learn about Multi-Lab sync', query: 'Switch between Physics, Chemistry, CS, Biology, and Engineering workspaces' }
        ]
      };
    }

    // Laboratory Booking / Reservation
    if (q.includes('book') || q.includes('reserve') || q.includes('slot')) {
      return {
        text: 'To book a lab or workbench: Navigate to **Laboratory Bookings**. Pick your designated workbench or apparatus, select an open date and time slot, and submit. The system instantly checks concurrency to prevent double-booking.',
        actionPath: '/bookings',
        actionLabel: 'Open Laboratory Bookings',
        followUps: [
          { label: '⚠️ What happens during conflicts?', query: 'What happens if there is a scheduling conflict?' },
          { label: '❌ Can I cancel an existing booking?', query: 'Can I cancel an existing reservation?' },
          { label: '🔬 Reserve specific equipment', query: 'How do I request equipment?' }
        ]
      };
    }

    // Attendance & Participation (75% rule)
    if (q.includes('attendance') || q.includes('absent') || q.includes('present') || q.includes('75%')) {
      return {
        text: 'In **Practical Attendance**: Instructors record student participation in real-time (Present, Absent, Late) and export accredited PDF rosters. Students must maintain at least **75% participation** across laboratory sessions to be eligible for end-semester practical exams.',
        actionPath: '/attendance',
        actionLabel: 'Open Attendance Module',
        followUps: [
          { label: '📄 Download verified PDF roster', query: 'Where can I download the attendance PDF report?' },
          { label: '👨‍🏫 How do faculty mark attendance?', query: 'How do I mark student attendance?' },
          { label: '📅 View my schedule timetable', query: 'View unified schedule' }
        ]
      };
    }

    // Requesting Equipment
    if (q.includes('request equipment') || (q.includes('request') && q.includes('equipment'))) {
      return {
        text: 'To request equipment: Open the **Equipment Asset Register**. Locate the instrument (e.g. UV-Vis Spectrophotometer, Digital Storage Oscilloscope, Centrifuge), review its calibration status, and click **"Reserve"** to request session access.',
        actionPath: '/equipment',
        actionLabel: 'Browse Equipment Register',
        followUps: [
          { label: '📅 Check open booking slots', query: 'How do I book a lab?' },
          { label: '📸 Scan instrument QR tag', query: 'How do I scan an asset QR code with my camera?' }
        ]
      };
    }

    // Report Explanation & PDF Audits
    if (q.includes('report') || q.includes('audit') || q.includes('accreditation') || q.includes('naac')) {
      return {
        text: 'The **Executive Reports & Audit Ledger** calculates 4 compliance analyses: 1) Equipment Utilization Rate, 2) Chemical Hazard & Reagent Consumption, 3) Practical Session Hours, and 4) Calibration Compliance. All reports include instant ISO/IEC 17025 accredited PDF downloads.',
        actionPath: '/reports',
        actionLabel: 'Open Executive Reports',
        followUps: [
          { label: '📄 Download Audit Ledger PDF', query: 'How do I download the PDF compliance audit ledger?' },
          { label: '📊 Explain Equipment Utilization', query: 'Explain the Equipment Utilization report' },
          { label: '🏛️ NAAC / ABET requirements', query: 'What metrics are required for NAAC / ABET accreditation?' }
        ]
      };
    }

    // PDF Download Guidance
    if (q.includes('pdf') || q.includes('download') || q.includes('export')) {
      return {
        text: 'You can export verified PDF documents directly! In **Attendance**, click **"Download Official PDF"** on any completed practical session. In **Executive Reports**, click **"Download PDF Report"** for audit-ready compliance documentation with official signature blocks.',
        actionPath: '/attendance',
        actionLabel: 'Go to Attendance for PDF',
        followUps: [
          { label: '📊 Open Executive Reports', query: 'Explain this report' },
          { label: '👨‍🏫 Record attendance roster', query: 'How do I mark student attendance?' }
        ]
      };
    }

    // Theme Switcher & Accessibility
    if (q.includes('theme') || q.includes('dark') || q.includes('light') || q.includes('color') || q.includes('mode')) {
      return {
        text: 'You can switch themes instantly! Choose from **Luna Pastel (Warm Cream)**, **Pure Dark Mode**, or **High-Contrast Light**. You can also click the quick toggle button below to switch right now!',
        actionPath: '/settings',
        actionLabel: 'Open Theme Settings',
        specialAction: 'toggle_theme',
        followUps: [
          { label: '🎨 Toggle Luna / Dark Mode Now', query: 'Toggle theme' },
          { label: '⚙️ Open Display Settings', query: 'Where can I customize the app theme?' }
        ]
      };
    }

    // Profile & Sign Out
    if (q.includes('profile') || q.includes('sign out') || q.includes('signout') || q.includes('logout') || q.includes('password')) {
      return {
        text: 'To manage your account or sign out: Navigate to **Account Settings**. You can edit your display name, update your password, configure security preferences, or click **"Sign Out"** to conclude your session safely.',
        actionPath: '/settings',
        actionLabel: 'Open Account Settings',
        followUps: [
          { label: '🎨 Change display theme', query: 'Where can I customize the app theme?' },
          { label: '🔐 Manage password security', query: 'How do I sign in with demo access?' }
        ]
      };
    }

    // Timetable & Calendar Schedule
    if (q.includes('schedule') || q.includes('timetable') || q.includes('calendar') || q.includes('practical')) {
      return {
        text: 'The **Unified Schedule** calendar allows filtering practical classes, lab exams, and open research hours by day, week, month, or facility across all engineering disciplines.',
        actionPath: '/schedule',
        actionLabel: 'View Unified Schedule',
        followUps: [
          { label: '📅 Book open workbench slot', query: 'How do I book a lab?' },
          { label: '📊 View student attendance', query: 'Where can I see my attendance?' }
        ]
      };
    }

    // EHS Safety Protocols & Spills
    if (q.includes('safety') || q.includes('hazard') || q.includes('spill') || q.includes('incident')) {
      return {
        text: 'EHS Safety protocols cover chemical spill kits, emergency eyewash stations, hazardous waste disposal, and emergency incident dispatching with immediate technician notifications.',
        actionPath: '/safety',
        actionLabel: 'Open Safety & Incidents',
        followUps: [
          { label: '🚨 Report a safety incident', query: 'How do I report a lab fault or incident?' },
          { label: '🧪 Check SDS hazard sheets', query: 'Where can I find hazardous SDS storage details?' }
        ]
      };
    }

    // Procurement & Orders in Indian Rupees
    if (q.includes('procurement') || q.includes('vendor') || q.includes('purchase') || q.includes('price') || q.includes('rupee')) {
      return {
        text: 'Vendor & Procurement tracks purchase requests in **Indian Rupees (₹)** with multi-tier Dean approvals, certified vendor directories, and verified institutional delivery receipts.',
        actionPath: '/procurement',
        actionLabel: 'Open Procurement Module',
        followUps: [
          { label: '📋 Submit purchase order in ₹', query: 'How do I submit a purchase order in Rupees (₹)?' },
          { label: '🏢 View certified institutional vendors', query: 'How are vendors certified?' }
        ]
      };
    }

    // Facility & Laboratory Switching
    if (q.includes('lab') || q.includes('laboratory') || q.includes('switch') || q.includes('facility')) {
      return {
        text: `You are currently working in **"${activeLab?.name || 'General Academic Facility'}"** (${activeLab?.building || 'Main Campus'}). You can switch active facilities anytime using the top-right laboratory dropdown.`,
        actionPath: '/laboratories',
        actionLabel: 'Explore Laboratories',
        followUps: [
          { label: '📅 Book slot in current lab', query: 'How do I book a lab?' },
          { label: '🔬 Check equipment in this lab', query: 'How do I request equipment?' }
        ]
      };
    }

    // Default intelligent friendly response
    return {
      text: `I understand you're asking about **"${userQuery}"**. You can jump directly to that module using the navigation shortcuts below, or let me know if you would like me to guide you step-by-step!`,
      actionPath: '/',
      actionLabel: 'Go to Dashboard',
      followUps: [
        { label: '📅 How do I book a lab?', query: 'How do I book a lab?' },
        { label: '📊 Where can I see my attendance?', query: 'Where can I see my attendance?' },
        { label: '🔬 How do I request equipment?', query: 'How do I request equipment?' },
        { label: '📄 Explain this report', query: 'Explain this report' }
      ]
    };
  };

  // 7. Interactive Message Sender with Typewriter Streaming Effect
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || customQuestion).trim();
    if (!query) return;

    setHasInteracted(true);
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      displayedText: query,
      isStreaming: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setCustomQuestion('');
    setIsThinking(true);

    // Realistic thinking pause (300ms)
    setTimeout(() => {
      const response = answerQuery(query);
      const msgId = `lumi-${Date.now()}`;

      // Start streaming response word by word
      const fullText = response.text;
      const words = fullText.split(' ');
      let currentWordIndex = 0;

      const initialLumiMsg: ChatMessage = {
        id: msgId,
        sender: 'lumi',
        text: fullText,
        displayedText: '',
        isStreaming: true,
        actionPath: response.actionPath,
        actionLabel: response.actionLabel,
        specialAction: response.specialAction,
        followUps: response.followUps,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, initialLumiMsg]);
      setIsThinking(false);
      setIsSpeaking(true);

      // Trigger text-to-speech if enabled
      speakText(fullText);

      // Stream words
      if (streamingTimerRef.current) clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = setInterval(() => {
        currentWordIndex += 2;
        const currentSlice = words.slice(0, currentWordIndex).join(' ');

        setMessages(prev =>
          prev.map(m =>
            m.id === msgId
              ? {
                  ...m,
                  displayedText: currentSlice,
                  isStreaming: currentWordIndex < words.length
                }
              : m
          )
        );

        if (currentWordIndex >= words.length) {
          clearInterval(streamingTimerRef.current);
          setIsSpeaking(false);
        }
      }, 35);
    }, 300);
  };

  // Interactive Reaction Handler (Thumbs up / Thank you)
  const handleReactToMessage = (messageId: string, reactionType: 'liked' | 'thanked') => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, reaction: reactionType } : m))
    );
    setIsCelebrating(true);
    setTimeout(() => setIsCelebrating(false), 2000);

    const replyText =
      reactionType === 'liked'
        ? "Awesome! Glad this was helpful! Let me know if you need anything else 😊"
        : "You're so welcome! I love helping you keep the labs running smoothly! 🌟";

    const feedbackMsg: ChatMessage = {
      id: `lumi-react-${Date.now()}`,
      sender: 'lumi',
      text: replyText,
      displayedText: replyText,
      isStreaming: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, feedbackMsg]);
  };

  // Interactive In-Chat Special Actions Handler
  const handleExecuteSpecialAction = (specialAction?: 'open_qr' | 'toggle_theme' | 'open_command', path?: string) => {
    if (specialAction === 'open_qr') {
      window.dispatchEvent(new CustomEvent('ilms:open-qr'));
      setIsOpen(false);
      return;
    }
    if (specialAction === 'toggle_theme') {
      const current = getSavedTheme();
      const nextTheme = current === 'dark' ? 'luna' : 'dark';
      applyTheme(nextTheme);
      setIsCelebrating(true);
      setTimeout(() => setIsCelebrating(false), 1500);
      return;
    }
    if (specialAction === 'open_command') {
      window.dispatchEvent(new CustomEvent('ilms:open-command'));
      setIsOpen(false);
      return;
    }
    if (path) {
      navigate(path);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    }
  };

  return (
    <>
      <style>{`
        @keyframes lumiWaveKeyframe {
          0%, 100% { transform: rotate(0deg); }
          20%, 60% { transform: rotate(-8deg) translateY(-2px); }
          40%, 80% { transform: rotate(8deg) translateY(-2px); }
        }
        @keyframes lumiCheerKeyframe {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-7px) scale(1.05); }
        }
        @keyframes lumiTalkPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03) translateY(-1px); }
        }
        .animate-lumi-wave {
          animation: lumiWaveKeyframe 1.1s ease-in-out 2;
        }
        .animate-lumi-cheer {
          animation: lumiCheerKeyframe 0.5s ease-in-out 3;
        }
        .animate-lumi-talking {
          animation: lumiTalkPulse 0.4s ease-in-out infinite;
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. FLOATING COMPANION AVATAR & PROACTIVE SPEECH BUBBLE                    */}
      {/* ========================================================================= */}
      {(!isOpen || isMinimized) && (
        <div
          ref={containerRef}
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 right-3 sm:right-6 z-40 flex items-end gap-3 no-print select-none"
        >
          {/* Proactive Speech Bubble */}
          {isBubbleVisible && (
            <div
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
              }}
              className="hidden md:flex items-center gap-2.5 px-4 py-3 bg-white border border-[#E9DDF1] hover:border-[#743BDB] rounded-3xl shadow-xl shadow-[#743BDB]/10 cursor-pointer max-w-xs transition-all duration-300 animate-in fade-in slide-in-from-right-2 group"
              title="Click to talk with Lumi"
            >
              <div className="w-6 h-6 rounded-full bg-[#F0E9FF] text-[#743BDB] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#332B40] leading-snug group-hover:text-[#743BDB] transition line-clamp-2">
                  {bubbleText}
                </p>
                <span className="text-[10px] text-[#71667D] block font-medium">
                  Click to chat with Lumi
                </span>
              </div>
            </div>
          )}

          {/* Interactive 3D Girl Mascot Button with Mouse Tracking */}
          <button
            ref={avatarButtonRef}
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setIsBubbleVisible(false);
            }}
            onMouseEnter={() => {
              const isLoginPage = currentPath.includes('/login') || currentPath.includes('/welcome');
              if (!isLoginPage) {
                setIsHovered(true);
                setBubbleText('Hey! Need a hand with anything?');
                setIsBubbleVisible(true);
              }
            }}
            onMouseLeave={() => {
              setIsHovered(false);
            }}
            className={`relative p-1.5 bg-[#FFF8F2] hover:bg-[#FBE5EF] border-2 border-[#BCA0F5] hover:border-[#743BDB] rounded-full shadow-2xl shadow-[#743BDB]/25 hover:scale-105 active:scale-95 transition-all duration-200 group focus:outline-none focus:ring-4 focus:ring-[#743BDB]/30 ${
              isCelebrating ? 'animate-lumi-cheer' : isWaving ? 'animate-lumi-wave' : isSpeaking ? 'animate-lumi-talking' : ''
            }`}
            aria-label="Open Lumi — Your ILMS Companion"
            title="Lumi — Your Interactive ILMS Companion"
          >
            {/* 3D Perspective Head/Body Container */}
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gradient-to-b from-[#FFF8F2] via-[#FFD2BF] to-[#BCA0F5]/40 flex items-center justify-center relative shadow-inner"
              style={{ perspective: '600px' }}
            >
              {/* Mascot Image with Dynamic 3D Head Tilt */}
              <div
                className="w-full h-full relative transition-transform duration-100 ease-out flex items-center justify-center"
                style={{
                  transform: `rotateY(${headTilt.rotateY}deg) rotateX(${headTilt.rotateX}deg) rotateZ(${headTilt.rotateZ}deg)`
                }}
              >
                <img
                  src="/mascot.png"
                  alt="Lumi 3D Mascot"
                  className="w-full h-full object-contain object-top scale-110 drop-shadow-md pointer-events-none"
                />

                {/* Natural Eyelid Blink Overlay */}
                {isBlinking && (
                  <div className="absolute top-[26%] left-[28%] right-[28%] h-[12%] bg-[#FFE2D1] rounded-full z-10 transition-transform duration-75 border-b border-[#D89F8B]/40 shadow-xs" />
                )}
              </div>
            </div>

            {/* Speaking / Audio Indicator or Online Ping */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#19CDB5] rounded-full border-2 border-white shadow-sm flex items-center justify-center">
              <span className={`w-1.5 h-1.5 bg-white rounded-full ${isSpeaking ? 'animate-bounce' : 'animate-ping'}`} />
            </span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. REAL INTERACTIVE CONVERSATION PANEL ("Lumi — Your ILMS Companion")    */}
      {/* ========================================================================= */}
      {isOpen && !isMinimized && (
        <div
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 right-2 sm:right-6 z-50 w-[calc(100vw-16px)] sm:w-[440px] max-h-[78vh] sm:max-h-[85vh] bg-white border border-[#E9DDF1] rounded-[2rem] shadow-2xl shadow-[#743BDB]/15 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 no-print"
          role="dialog"
          aria-labelledby="lumi-title"
        >
          {/* Panel Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#F0E9FF] via-[#FFD2BF]/40 to-[#FFF8F2] border-b border-[#E9DDF1] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mascot Portrait with Eye Tracking */}
              <div
                className={`relative w-12 h-12 rounded-2xl bg-[#FFF8F2] border-2 border-[#BCA0F5] overflow-hidden flex items-center justify-center shadow-md shrink-0 ${
                  isSpeaking ? 'animate-lumi-talking ring-2 ring-[#743BDB]' : ''
                }`}
                style={{ perspective: '400px' }}
              >
                <div
                  className="w-full h-full relative transition-transform duration-100 ease-out"
                  style={{
                    transform: `rotateY(${headTilt.rotateY * 0.8}deg) rotateX(${headTilt.rotateX * 0.8}deg)`
                  }}
                >
                  <img
                    src="/mascot.png"
                    alt="Lumi"
                    className="w-full h-full object-contain object-top scale-115 pointer-events-none"
                  />
                  {isBlinking && (
                    <div className="absolute top-[26%] left-[28%] right-[28%] h-[12%] bg-[#FFE2D1] rounded-full z-10" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 id="lumi-title" className="font-heading font-black text-sm sm:text-base text-[#332B40]">
                    Lumi — Your ILMS Companion
                  </h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#19CDB5]/15 text-[#0A9D87] border border-[#19CDB5]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#19CDB5] animate-ping" />
                    Interactive
                  </span>
                </div>
                <p className="text-[11px] text-[#71667D]">
                  Navigating <strong className="text-[#332B40] capitalize">{activeLab?.code || 'Main Lab'}</strong> for <strong className="capitalize text-[#743BDB]">{role}</strong>
                </p>
              </div>
            </div>

            {/* Header Controls (Voice Toggle, Minimize, Close) */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => {
                  const nextVoice = !voiceEnabled;
                  setVoiceEnabled(nextVoice);
                  if (nextVoice) {
                    speakText("Voice narration enabled! I'll read my answers aloud.");
                  } else if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className={`p-1.5 rounded-xl transition ${
                  voiceEnabled
                    ? 'bg-[#743BDB] text-white shadow-sm'
                    : 'text-[#71667D] hover:text-[#332B40] hover:bg-white/80'
                }`}
                title={voiceEnabled ? 'Mute Lumi Voice' : 'Enable Lumi Voice Narration'}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-[#71667D] hover:text-[#332B40] rounded-xl hover:bg-white/80 transition"
                title="Minimize panel"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                }}
                className="p-1.5 text-[#71667D] hover:text-[#332B40] rounded-xl hover:bg-white/80 transition"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Chat Stream with Dynamic Typewriter & Branching Chips */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs bg-[#FFF8F2]/60">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {msg.sender === 'lumi' ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#FFD2BF] border border-[#BCA0F5] shrink-0 mt-0.5 shadow-sm">
                    <img src="/mascot.png" alt="Lumi" className="w-full h-full object-contain scale-120" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#743BDB] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                    {(currentUser?.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-3xl max-w-[85%] leading-relaxed shadow-sm space-y-2.5 ${
                    msg.sender === 'user'
                      ? 'bg-[#743BDB] text-white rounded-tr-sm'
                      : 'bg-white border border-[#E9DDF1] text-[#332B40] rounded-tl-sm'
                  }`}
                >
                  {/* Message Content (Streaming Typewriter or full) */}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.displayedText || msg.text}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-3 ml-1 bg-[#743BDB] animate-pulse align-middle" />
                    )}
                  </div>

                  {/* Interactive Action Button (e.g. Open QR, Toggle Theme, Go to page) */}
                  {(msg.actionPath || msg.specialAction) && !msg.isStreaming && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleExecuteSpecialAction(msg.specialAction, msg.actionPath)}
                        className="px-3.5 py-1.5 bg-[#F0E9FF] hover:bg-[#743BDB] text-[#743BDB] hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm w-fit group"
                      >
                        {msg.specialAction === 'open_qr' && <QrCode className="w-3.5 h-3.5" />}
                        {msg.specialAction === 'toggle_theme' && <Palette className="w-3.5 h-3.5" />}
                        <span>{msg.actionLabel || (msg.specialAction === 'open_qr' ? 'Launch Camera QR Scanner' : 'Go to page')}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                      </button>
                    </div>
                  )}

                  {/* Interactive Conversational Follow-Up Chips */}
                  {msg.followUps && msg.followUps.length > 0 && !msg.isStreaming && (
                    <div className="pt-2 border-t border-[#E9DDF1]/60 space-y-1">
                      <span className="text-[10px] font-bold text-[#71667D] block">
                        Interactive follow-up suggestions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.followUps.map((fu, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(fu.query)}
                            className="px-2.5 py-1 bg-[#FFF8F2] hover:bg-[#F0E9FF] border border-[#BCA0F5]/50 hover:border-[#743BDB] text-[#743BDB] rounded-xl text-[11px] font-semibold transition shadow-2xs text-left"
                          >
                            {fu.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Footer: Timestamp & Interactive Reactions */}
                  <div className="flex items-center justify-between pt-1 text-[9px]">
                    {msg.sender === 'lumi' && !msg.isStreaming ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleReactToMessage(msg.id, 'liked')}
                          disabled={Boolean(msg.reaction)}
                          className={`px-1.5 py-0.5 rounded-lg border transition flex items-center gap-1 ${
                            msg.reaction === 'liked'
                              ? 'bg-[#19CDB5]/15 border-[#19CDB5] text-[#0A9D87] font-bold'
                              : 'border-transparent text-[#71667D] hover:bg-[#F0E9FF]'
                          }`}
                          title="Helpful answer"
                        >
                          <ThumbsUp className="w-2.5 h-2.5" />
                          <span>Helpful</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReactToMessage(msg.id, 'thanked')}
                          disabled={Boolean(msg.reaction)}
                          className={`px-1.5 py-0.5 rounded-lg border transition flex items-center gap-1 ${
                            msg.reaction === 'thanked'
                              ? 'bg-rose-50 border-rose-300 text-rose-600 font-bold'
                              : 'border-transparent text-[#71667D] hover:bg-rose-50'
                          }`}
                          title="Say thanks to Lumi"
                        >
                          <Heart className="w-2.5 h-2.5" />
                          <span>Thanks</span>
                        </button>
                      </div>
                    ) : (
                      <div />
                    )}

                    <span
                      className={`font-medium ${
                        msg.sender === 'user' ? 'text-purple-200' : 'text-[#71667D]'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking Animation */}
            {isThinking && (
              <div className="flex items-start space-x-2.5 animate-in fade-in">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#FFD2BF] border border-[#BCA0F5] shrink-0 mt-0.5">
                  <img src="/mascot.png" alt="Lumi Thinking" className="w-full h-full object-contain scale-120 animate-pulse" />
                </div>
                <div className="p-3.5 bg-white border border-[#E9DDF1] rounded-3xl rounded-tl-sm text-[#71667D] shadow-sm flex items-center space-x-2">
                  <span className="text-[11px] font-semibold text-[#743BDB]">Lumi is typing...</span>
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-[#743BDB] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#743BDB] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[#743BDB] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Interactive Prompt Chips */}
          <div className="px-4 py-2.5 bg-white border-t border-[#E9DDF1] space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#71667D]">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-[#743BDB]" />
                <span>Ask Lumi:</span>
              </span>
              <span className="text-[9px] text-[#743BDB] lowercase">click any to send</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {[
                'How do I book a lab?',
                'Where can I see my attendance?',
                'How do I request equipment?',
                'Explain this report',
                'What items are low on stock?',
                'How do I scan an asset QR code with my camera?'
              ].map((question, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(question)}
                  className="px-2.5 py-1 bg-[#F0E9FF] hover:bg-[#743BDB] hover:text-white border border-[#BCA0F5]/50 text-[#743BDB] rounded-xl text-[11px] font-semibold transition truncate max-w-full text-left shadow-2xs"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-[#E9DDF1] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={customQuestion}
              onChange={e => setCustomQuestion(e.target.value)}
              placeholder="Ask Lumi anything about labs, chemicals, attendance, or booking..."
              className="flex-1 px-4 py-2.5 bg-[#FFF8F2] border border-[#E9DDF1] focus:border-[#743BDB] rounded-2xl text-xs text-[#332B40] placeholder-[#71667D] outline-none transition font-medium"
            />
            <button
              type="submit"
              disabled={!customQuestion.trim() || isThinking}
              className="p-2.5 bg-[#743BDB] hover:bg-[#602BBF] disabled:opacity-50 text-white rounded-2xl shadow-sm transition flex items-center justify-center shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default LabAssistantBot;
