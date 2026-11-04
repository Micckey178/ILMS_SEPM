import React, { useEffect, useState, useRef } from 'react';
import jsQR from 'jsqr';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Camera,
  AlertCircle,
  Search,
  QrCode,
  Upload,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Cpu,
  Boxes,
  Building2,
  UserCheck,
  SwitchCamera,
  Sparkles,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { UniversalInventoryItem, EquipmentAsset } from '../types';
import { localStore } from '../services/dataService';
import {
  INITIAL_EQUIPMENT,
  INITIAL_INVENTORY,
  INITIAL_WORKSTATIONS,
  INITIAL_LABORATORIES,
  INITIAL_USERS
} from '../lib/firebase/seedData';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemFound?: (item: UniversalInventoryItem | EquipmentAsset, type: 'inventory' | 'equipment') => void;
}

interface IdentifiedAssetResult {
  type: 'equipment' | 'inventory' | 'workstation' | 'laboratory' | 'student' | 'link';
  title: string;
  code: string;
  category: string;
  location: string;
  statusBadge: string;
  statusColor: string;
  targetUrl: string;
  rawItem: any;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onItemFound }) => {
  const navigate = useNavigate();

  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [identifiedResult, setIdentifiedResult] = useState<IdentifiedAssetResult | null>(null);
  const [isSecureEnv, setIsSecureEnv] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if running in secure context (required by browsers for camera getUserMedia)
    if (typeof window !== 'undefined') {
      const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setIsSecureEnv(isSecure);
    }

    if (isOpen) {
      setErrorMsg(null);
      setManualCode('');
      setPermissionBlocked(false);
      setIdentifiedResult(null);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setErrorMsg(null);
    setPermissionBlocked(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          !isSecureEnv
            ? 'Camera streaming requires HTTPS or http://localhost. You can use image upload or quick test simulation below.'
            : 'Your browser or device does not support camera media stream access.'
        );
      }

      // Request camera stream with cascading fallbacks
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (e1) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false
          });
        } catch (e2) {
          // Simplest fallback for virtual or desktop single webcams
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');

        const onLoaded = async () => {
          try {
            await videoRef.current?.play();
            setIsScanning(true);
            animationFrameId.current = requestAnimationFrame(scanFrameLoop);
          } catch (pErr) {
            setIsScanning(true);
            animationFrameId.current = requestAnimationFrame(scanFrameLoop);
          }
        };

        if (videoRef.current.readyState >= 2) {
          onLoaded();
        } else {
          videoRef.current.onloadeddata = onLoaded;
          try {
            await videoRef.current.play();
            setIsScanning(true);
            animationFrameId.current = requestAnimationFrame(scanFrameLoop);
          } catch (ign) {}
        }
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setIsScanning(false);
      setPermissionBlocked(true);

      const isPermissionDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.message?.toLowerCase().includes('permission') ||
        err?.message?.toLowerCase().includes('denied');

      if (isPermissionDenied) {
        setErrorMsg('Camera access was blocked by your browser. Tap the lock/camera icon (🔒) in your address bar, set Camera to "Allow", and click "Activate Camera" below.');
      } else if (!isSecureEnv) {
        setErrorMsg('Browser security blocks webcam hardware on plain HTTP IP addresses. Access via http://localhost:5173, or use "Upload QR Image" and quick-test simulation chips below.');
      } else {
        setErrorMsg(err.message || 'Webcam is currently busy, blocked, or unavailable. You can upload a photo of a barcode or select any test asset below.');
      }
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  const scanFrameLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      animationFrameId.current = requestAnimationFrame(scanFrameLoop);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      });

      if (code && code.data) {
        handleCodeDetected(code.data);
        return;
      }
    } catch (qrErr) {
      // Continue next frame
    }

    animationFrameId.current = requestAnimationFrame(scanFrameLoop);
  };

  /**
   * Comprehensive Universal Asset & Barcode Resolver
   * Resolves raw codes, URLs, QR prefixes, SKUs, and asset tags across all system entities.
   */
  const handleCodeDetected = (rawInput: string) => {
    stopCamera();
    setErrorMsg(null);

    let clean = rawInput.trim();
    if (!clean) return;

    // 1. If scanned input is a URL or deep link, extract query param or last segment
    try {
      if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('ilms://')) {
        const urlObj = new URL(clean);
        const paramId =
          urlObj.searchParams.get('search') ||
          urlObj.searchParams.get('q') ||
          urlObj.searchParams.get('id') ||
          urlObj.searchParams.get('sku') ||
          urlObj.searchParams.get('tag') ||
          urlObj.searchParams.get('code');
        if (paramId) {
          clean = paramId;
        } else {
          const parts = urlObj.pathname.split('/').filter(Boolean);
          if (parts.length > 0) clean = parts[parts.length - 1];
        }
      }
    } catch {}

    // 2. Strip standard QR prefixes (e.g. ILMS:equipment:TAG-101 -> TAG-101)
    clean = clean.replace(/^ILMS:(equipment|inventory|workstation|lab):/i, '');
    const cleanLower = clean.toLowerCase();

    // Collect all catalog entities from localStore and fallback seed
    const allEquipment: EquipmentAsset[] = [
      ...localStore.getEquipment(),
      ...INITIAL_EQUIPMENT
    ];
    const allInventory: UniversalInventoryItem[] = [
      ...localStore.getInventory(),
      ...INITIAL_INVENTORY
    ];
    const allWorkstations = [
      ...localStore.getWorkstations(),
      ...INITIAL_WORKSTATIONS
    ];
    const allLabs = [
      ...localStore.getLabs(),
      ...INITIAL_LABORATORIES
    ];
    const allUsers = [
      ...localStore.getUsers(),
      ...INITIAL_USERS
    ];

    // --- A. Match Equipment Assets ---
    const equipMatch = allEquipment.find(e =>
      e.assetTag?.toLowerCase() === cleanLower ||
      e.qrCode?.toLowerCase() === cleanLower ||
      e.id?.toLowerCase() === cleanLower ||
      e.serialNumber?.toLowerCase() === cleanLower ||
      cleanLower.includes(e.assetTag?.toLowerCase() || '___')
    );

    if (equipMatch) {
      const lab = allLabs.find(l => l.id === equipMatch.laboratoryId);
      const res: IdentifiedAssetResult = {
        type: 'equipment',
        title: equipMatch.name,
        code: equipMatch.assetTag,
        category: equipMatch.category || 'Laboratory Equipment',
        location: equipMatch.location || lab?.name || 'Department Academic Block',
        statusBadge: equipMatch.status,
        statusColor: equipMatch.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
        targetUrl: `/equipment?search=${encodeURIComponent(equipMatch.assetTag)}`,
        rawItem: equipMatch
      };
      setIdentifiedResult(res);
      if (onItemFound) onItemFound(equipMatch, 'equipment');
      return;
    }

    // --- B. Match Inventory Items ---
    const invMatch = allInventory.find(i =>
      i.sku?.toLowerCase() === cleanLower ||
      i.qrCode?.toLowerCase() === cleanLower ||
      i.id?.toLowerCase() === cleanLower ||
      cleanLower.includes(i.sku?.toLowerCase() || '___')
    );

    if (invMatch) {
      const lab = allLabs.find(l => l.id === invMatch.laboratoryId);
      const res: IdentifiedAssetResult = {
        type: 'inventory',
        title: invMatch.name,
        code: invMatch.sku,
        category: invMatch.category || 'Laboratory Supplies',
        location: invMatch.storageLocation || lab?.name || 'Central Hardware Store',
        statusBadge: `${invMatch.quantity} ${invMatch.unit} In Stock`,
        statusColor: invMatch.isLowStock ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800',
        targetUrl: `/inventory?search=${encodeURIComponent(invMatch.sku)}`,
        rawItem: invMatch
      };
      setIdentifiedResult(res);
      if (onItemFound) onItemFound(invMatch, 'inventory');
      return;
    }

    // --- C. Match Computer Workstations ---
    const wsMatch = allWorkstations.find(w =>
      w.workstationTag?.toLowerCase() === cleanLower ||
      w.id?.toLowerCase() === cleanLower ||
      cleanLower.includes(w.workstationTag?.toLowerCase().split(' ')[0] || '___')
    );

    if (wsMatch) {
      const lab = allLabs.find(l => l.id === wsMatch.laboratoryId);
      const res: IdentifiedAssetResult = {
        type: 'workstation',
        title: wsMatch.workstationTag,
        code: wsMatch.id,
        category: `Workstation Node (${wsMatch.os})`,
        location: lab?.name || 'CSE Academic Computing Suite',
        statusBadge: wsMatch.status,
        statusColor: wsMatch.status === 'WORKING' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800',
        targetUrl: `/specialized?labId=${wsMatch.laboratoryId}`,
        rawItem: wsMatch
      };
      setIdentifiedResult(res);
      return;
    }

    // --- D. Match Department Laboratories ---
    const labMatch = allLabs.find(l =>
      l.code?.toLowerCase() === cleanLower ||
      l.id?.toLowerCase() === cleanLower ||
      l.name?.toLowerCase().includes(cleanLower)
    );

    if (labMatch) {
      const res: IdentifiedAssetResult = {
        type: 'laboratory',
        title: `${labMatch.name} (${labMatch.code})`,
        code: labMatch.code,
        category: `Capacity: ${labMatch.capacity} Workstations`,
        location: labMatch.roomNumber,
        statusBadge: `Incharge: ${labMatch.managerName}`,
        statusColor: 'bg-indigo-100 text-indigo-800',
        targetUrl: `/laboratories?labId=${labMatch.id}`,
        rawItem: labMatch
      };
      setIdentifiedResult(res);
      return;
    }

    // --- E. Match Student Institution ID (USN) ---
    const studentMatch = allUsers.find(u =>
      (u.institutionId && u.institutionId.toLowerCase() === cleanLower) ||
      u.email.toLowerCase() === cleanLower
    );

    if (studentMatch) {
      const res: IdentifiedAssetResult = {
        type: 'student',
        title: studentMatch.displayName,
        code: studentMatch.institutionId || studentMatch.email,
        category: `Role: ${studentMatch.role.toUpperCase()}`,
        location: studentMatch.departmentId || 'Department of CSE',
        statusBadge: 'Enrolled Scholar',
        statusColor: 'bg-blue-100 text-blue-800',
        targetUrl: `/attendance?studentId=${studentMatch.id}`,
        rawItem: studentMatch
      };
      setIdentifiedResult(res);
      return;
    }

    // --- F. Match Web Link / Portal URLs ---
    const trimmedRaw = rawInput.trim();
    if (trimmedRaw.startsWith('http://') || trimmedRaw.startsWith('https://') || trimmedRaw.startsWith('www.')) {
      const fullUrl = trimmedRaw.startsWith('www.') ? `https://${trimmedRaw}` : trimmedRaw;
      let displayHost = 'Web Link';
      try {
        displayHost = new URL(fullUrl).hostname;
      } catch {}

      const res: IdentifiedAssetResult = {
        type: 'link',
        title: 'Online Web Link Detected',
        code: fullUrl,
        category: 'Web URL / Portal Link',
        location: displayHost,
        statusBadge: 'Ready to Open',
        statusColor: 'bg-indigo-100 text-indigo-800',
        targetUrl: fullUrl,
        rawItem: { url: fullUrl }
      };
      setIdentifiedResult(res);
      return;
    }

    // If no match found, prompt user with friendly assistance
    setErrorMsg(`Scanned code "${rawInput}" is not recognized. Try one of the test barcodes below, or enter a valid Tag (e.g. TAG-ATL1-7010) or SKU (e.g. SJBIT-SSD-1TB-NVME).`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data) {
          handleCodeDetected(code.data);
        } else {
          setErrorMsg('No QR code could be detected in this uploaded image. Please ensure the code is clear and in focus, or enter the tag/SKU manually.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Authentic verified SJBIT CSE Department assets for 1-click test simulation
  const verifiedTestAssets = [
    { label: 'Dell OptiPlex 7010 Desktop', code: 'TAG-ATL1-7010', type: 'Equipment', tag: 'CS-01 (Alan Turing)' },
    { label: 'NVIDIA RTX 4080 AI Station', code: 'TAG-ATL1-4080', type: 'AI Server', tag: 'CS-01 (Compute Node)' },
    { label: 'Cisco 9200L Managed Switch', code: 'TAG-ATL3-C9200L', type: 'Network', tag: 'CS-03 (Networking Lab)' },
    { label: 'Samsung 990 Pro 1TB NVMe SSD', code: 'SJBIT-SSD-1TB-NVME', type: 'Inventory', tag: 'Hardware Locker A-03' },
    { label: 'Digital Logic IC 74xx Kit', code: 'SJBIT-LD-74XX-KIT', type: 'Consumable', tag: 'CS-09 / CS-12' },
    { label: 'Aryabhata Lab Room Tag', code: 'CS-12', type: 'Laboratory', tag: 'Room CS-207 (2nd Floor)' },
    { label: 'Workstation Master Node', code: 'WS-ATL1-01', type: 'Workstation', tag: 'Ubuntu 24.04 / Win 11' },
    { label: 'Student Scholar Card (USN)', code: '1JB23CS001', type: 'Student', tag: 'Kavya N (Attendance)' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-[#E9DDF1] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col text-[#332B40] max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E9DDF1] bg-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-[#F0E9FF] border border-[#BCA0F5]/40 text-[#8961D8]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-[#332B40]">Asset & Lab QR Code Scanner</h3>
              <p className="text-xs text-[#71667D]">Live camera viewfinder, photo upload & instant barcode resolver</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#71667D] hover:text-[#332B40] rounded-xl hover:bg-[#FFF8F2] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* RESULT FOUND CARD: Rendered prominently when an asset is identified */}
          {identifiedResult ? (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-[#F0E9FF] to-white border-2 border-emerald-400 shadow-md space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                      Asset Successfully Identified
                    </span>
                    <h4 className="font-heading font-black text-base text-[#332B40] leading-tight">
                      {identifiedResult.title}
                    </h4>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-current ${identifiedResult.statusColor}`}>
                  {identifiedResult.statusBadge}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-3 rounded-2xl border border-[#E9DDF1]">
                <div>
                  <span className="text-[10px] text-[#71667D] block font-bold uppercase">Code / Identifier</span>
                  <span className="font-mono font-bold text-[#8961D8]">{identifiedResult.code}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#71667D] block font-bold uppercase">Location / Lab</span>
                  <span className="font-semibold text-[#332B40] truncate block">{identifiedResult.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    if (
                      identifiedResult.type === 'link' ||
                      identifiedResult.targetUrl.startsWith('http://') ||
                      identifiedResult.targetUrl.startsWith('https://')
                    ) {
                      window.open(identifiedResult.targetUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      navigate(identifiedResult.targetUrl);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#BCA0F5] to-[#8961D8] hover:opacity-95 text-white font-black text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                >
                  <span>
                    {identifiedResult.type === 'link' ? 'Open Link in Browser' : 'Open Record in Portal'}
                  </span>
                  {identifiedResult.type === 'link' ? (
                    <ExternalLink className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIdentifiedResult(null);
                    startCamera();
                  }}
                  className="py-2.5 px-4 rounded-2xl bg-white hover:bg-[#FFF8F2] border border-[#E9DDF1] text-xs font-bold text-[#332B40] transition"
                >
                  Scan Next Code
                </button>
              </div>
            </div>
          ) : (
            /* Live Viewport */
            <div className="relative">
              <div className="w-full h-64 sm:h-72 bg-[#FFF8F2] rounded-3xl border-2 border-dashed border-[#BCA0F5] overflow-hidden flex items-center justify-center relative shadow-inner">
                {/* Native Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Laser Scanning Reticle when camera is active */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-48 h-48 border-2 border-[#BCA0F5] rounded-2xl relative shadow-glow-purple">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#8961D8] rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#8961D8] rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#8961D8] rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#8961D8] rounded-br-lg"></div>
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#8961D8] to-transparent animate-pulse absolute top-1/2 -translate-y-1/2"></div>
                    </div>
                    <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full mt-3 backdrop-blur-sm">
                      Align QR or barcode inside viewfinder
                    </span>
                  </div>
                )}

                {/* Inactive State Prompt */}
                {!isScanning && (
                  <div className="text-center p-6 text-[#71667D] space-y-3 z-10">
                    <div className="w-12 h-12 rounded-full bg-[#F0E9FF] border border-[#BCA0F5] text-[#8961D8] flex items-center justify-center mx-auto shadow-sm">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#332B40]">Camera Standby / Blocked</p>
                      <p className="text-xs text-[#71667D] mt-0.5 max-w-xs mx-auto">
                        Click below to restart camera, or use image upload & quick simulation chips below.
                      </p>
                    </div>
                    <button
                      onClick={startCamera}
                      className="px-5 py-2.5 bg-[#BCA0F5] hover:bg-[#8961D8] text-white font-black rounded-2xl text-xs transition shadow-md inline-flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Activate Camera</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Viewport Toolbar */}
              <div className="flex flex-wrap items-center justify-between mt-2.5 gap-2">
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F0E9FF] border border-[#E9DDF1] text-xs font-bold text-[#332B40] flex items-center space-x-1.5 transition shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#8961D8]" />
                  <span>Restart Camera</span>
                </button>

                <button
                  onClick={() => setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F0E9FF] border border-[#E9DDF1] text-xs font-bold text-[#332B40] flex items-center space-x-1.5 transition shadow-xs"
                >
                  <SwitchCamera className="w-3.5 h-3.5 text-[#8961D8]" />
                  <span>Flip Camera</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-[#F0E9FF] hover:bg-[#E9DDF1] border border-[#BCA0F5]/50 text-xs font-bold text-[#8961D8] flex items-center space-x-1.5 transition shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload QR Photo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Feedback & Error Notices */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-1">
                <span className="font-bold block">Scanner Notice</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* 1-Click Verified SJBIT Test Barcodes */}
          <div className="space-y-2 pt-2 border-t border-[#E9DDF1]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#71667D] block">
                Instant Test Barcodes (Click to Simulate Scan):
              </span>
              <span className="text-[10px] font-extrabold text-[#8961D8]">8 Live Assets</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {verifiedTestAssets.map(sample => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => handleCodeDetected(sample.code)}
                  className="p-2.5 bg-[#FFF8F2] hover:bg-[#F0E9FF] border border-[#E9DDF1] hover:border-[#BCA0F5] rounded-2xl text-left transition group shadow-xs active:scale-98"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#332B40] group-hover:text-[#8961D8] truncate">
                      {sample.label}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-white border border-[#E9DDF1] text-[#71667D]">
                      {sample.type}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#8961D8] mt-0.5 block truncate">
                    {sample.code}
                  </span>
                  <span className="text-[9px] text-[#71667D] block truncate mt-0.5">
                    {sample.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-[#E9DDF1] space-y-2">
            <label className="text-xs font-bold text-[#332B40] block">
              Manual Barcode / SKU / Tag Lookup
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. TAG-ATL1-7010, SJBIT-SSD-1TB-NVME, CS-12, WS-ATL1-01"
                className="flex-1 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-[#332B40] placeholder-[#71667D] focus:outline-none focus:border-[#BCA0F5]"
              />
              <button
                type="submit"
                className="bg-[#BCA0F5] hover:bg-[#8961D8] text-white font-black px-4 py-2.5 rounded-2xl text-xs transition flex items-center space-x-1.5 shadow-md shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Find</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#FFF8F2] border-t border-[#E9DDF1] text-center shrink-0">
          <p className="text-[11px] text-[#71667D]">
            ISO/IEC 18004 QR and Code-128 barcode standards • Integrated with SJBIT Asset & Lab Registry.
          </p>
        </div>
      </div>
    </div>
  );
};
