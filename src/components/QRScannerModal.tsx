import React, { useEffect, useState, useRef } from 'react';
import jsQR from 'jsqr';
import { X, Camera, AlertCircle, Search, QrCode, Upload, RefreshCw, CheckCircle2, ShieldAlert, Sparkles, SwitchCamera } from 'lucide-react';
import { UniversalInventoryItem, EquipmentAsset } from '../types';
import { localStore } from '../services/dataService';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemFound: (item: UniversalInventoryItem | EquipmentAsset, type: 'inventory' | 'equipment') => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onItemFound }) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [detectedCode, setDetectedCode] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setManualCode('');
      setPermissionBlocked(false);
      setDetectedCode(null);
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
        throw new Error('Your browser does not support camera media stream access.');
      }

      // Request camera stream with ideal facingMode constraint
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
      } catch (err) {
        // Fallback to simple video constraint (for laptops/desktops with single webcam)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');

        // Ensure video playback starts smoothly across browsers
        const onLoaded = async () => {
          try {
            await videoRef.current?.play();
            setIsScanning(true);
            animationFrameId.current = requestAnimationFrame(scanFrameLoop);
          } catch (pErr) {
            console.warn('Autoplay error handled:', pErr);
            setIsScanning(true);
            animationFrameId.current = requestAnimationFrame(scanFrameLoop);
          }
        };

        if (videoRef.current.readyState >= 2) {
          onLoaded();
        } else {
          videoRef.current.onloadeddata = onLoaded;
          // Also invoke immediately to avoid delay if already ready
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
        setErrorMsg('Camera access was blocked by your browser. Please tap the lock / camera icon in your address bar (🔒), allow camera access for this site, and click "Activate Camera" below.');
      } else {
        setErrorMsg('Webcam is currently busy or unavailable. You can click "Activate Camera Now" below, upload a QR code image, or click any sample barcode to test.');
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

    // Run jsQR decoding on video frame
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      });

      if (code && code.data) {
        setDetectedCode(code.data);
        handleCodeDetected(code.data);
        return;
      }
    } catch (qrErr) {
      // Continue next frame
    }

    animationFrameId.current = requestAnimationFrame(scanFrameLoop);
  };

  const handleCodeDetected = (code: string) => {
    stopCamera();
    const inventory = localStore.getInventory();
    const equipment = localStore.getEquipment();

    const cleanCode = code.trim().toLowerCase();
    const invMatch = inventory.find(
      i => i.qrCode.toLowerCase() === cleanCode || i.sku.toLowerCase() === cleanCode || i.id.toLowerCase() === cleanCode
    );

    if (invMatch) {
      onItemFound(invMatch, 'inventory');
      onClose();
      return;
    }

    const equipMatch = equipment.find(
      e => e.qrCode.toLowerCase() === cleanCode || e.assetTag.toLowerCase() === cleanCode || e.id.toLowerCase() === cleanCode
    );

    if (equipMatch) {
      onItemFound(equipMatch, 'equipment');
      onClose();
      return;
    }

    setErrorMsg(`Scanned code "${code}" is not registered in the current active laboratory catalog.`);
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
          setErrorMsg('No QR code could be detected in this uploaded image. Please try a clearer picture or enter the code manually.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const sampleAssets = [
    { label: 'Hydrochloric Acid 37%', code: 'CHEM-HCL-37-1L', type: 'Chemical' },
    { label: 'HPLC Spectrometer', code: 'ILMS-EQ-CHEM-HPLC-01', type: 'Equipment' },
    { label: 'NVIDIA DGX A100', code: 'ILMS-EQ-CS-DGX-01', type: 'AI Server' },
    { label: 'ESP32-S3 Kit', code: 'ILMS-QR-ECE-ESP32', type: 'Dev Kit' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-[#E9DDF1] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col text-[#332B40] max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E9DDF1] bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-[#F0E9FF] border border-[#BCA0F5]/40 text-[#8961D8]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-[#332B40]">Asset QR & Barcode Scanner</h3>
              <p className="text-xs text-[#71667D]">Live optical viewfinder, image upload & instant search</p>
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
          {/* Live Viewport */}
          <div className="relative">
            <div className="w-full h-72 bg-[#FFF8F2] rounded-3xl border-2 border-dashed border-[#BCA0F5] overflow-hidden flex items-center justify-center relative shadow-inner">
              {/* Native Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Laser Scanning Line Animation when active */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-52 h-52 border-2 border-[#BCA0F5] rounded-2xl relative shadow-glow-purple">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#8961D8] rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#8961D8] rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#8961D8] rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#8961D8] rounded-br-lg"></div>
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#8961D8] to-transparent animate-pulse absolute top-1/2 -translate-y-1/2"></div>
                  </div>
                  <span className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full mt-3 backdrop-blur-sm">
                    Center QR code inside square
                  </span>
                </div>
              )}

              {/* Inactive State Card with Prominent Activation Button */}
              {!isScanning && (
                <div className="text-center p-6 text-[#71667D] space-y-3 z-10">
                  <div className="w-14 h-14 rounded-full bg-[#F0E9FF] border border-[#BCA0F5] text-[#8961D8] flex items-center justify-center mx-auto shadow-sm">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-base font-black text-[#332B40]">Camera Scanner Not Active</p>
                    <p className="text-xs text-[#71667D] mt-1 max-w-xs mx-auto">
                      Click below to request permission and start live optical barcode scanning.
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-[#BCA0F5] hover:bg-[#8961D8] text-white font-black rounded-2xl text-xs transition shadow-md inline-flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Activate Camera Now</span>
                  </button>
                </div>
              )}
            </div>

            {/* Viewport Toolbar */}
            <div className="flex items-center justify-between mt-3 gap-2">
              <button
                onClick={startCamera}
                className="px-3 py-2 rounded-2xl bg-white hover:bg-[#F0E9FF] border border-[#E9DDF1] text-xs font-bold text-[#332B40] flex items-center space-x-1.5 transition shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#8961D8]" />
                <span>Re-start Camera</span>
              </button>

              <button
                onClick={() => setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))}
                className="px-3 py-2 rounded-2xl bg-white hover:bg-[#F0E9FF] border border-[#E9DDF1] text-xs font-bold text-[#332B40] flex items-center space-x-1.5 transition shadow-sm"
              >
                <SwitchCamera className="w-3.5 h-3.5 text-[#8961D8]" />
                <span>Flip Camera</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-2xl bg-[#F0E9FF] hover:bg-[#E9DDF1] border border-[#BCA0F5]/50 text-xs font-bold text-[#8961D8] flex items-center space-x-1.5 transition shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload QR Image</span>
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

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-1">
                <span className="font-bold block">Camera Notice</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* One-Click Demo Barcodes */}
          <div className="space-y-2 pt-2 border-t border-[#E9DDF1]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#71667D] block">
              Quick Test Asset Barcodes (One-Click Scan Simulation)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {sampleAssets.map(sample => (
                <button
                  key={sample.code}
                  onClick={() => handleCodeDetected(sample.code)}
                  className="p-2.5 bg-[#FFF8F2] hover:bg-[#F0E9FF] border border-[#E9DDF1] hover:border-[#BCA0F5] rounded-2xl text-left transition group shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#332B40] group-hover:text-[#8961D8] truncate">
                      {sample.label}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white border border-[#E9DDF1] text-[#71667D]">
                      {sample.type}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8961D8] mt-0.5 block truncate">
                    {sample.code}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-[#E9DDF1] space-y-2">
            <label className="text-xs font-bold text-[#332B40] block">
              Manual Asset Tag / SKU Lookup
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. CHEM-HCL-37-1L or ILMS-EQ-CHEM-01"
                className="flex-1 bg-[#FFF8F2] border border-[#E9DDF1] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-[#332B40] placeholder-[#71667D] focus:outline-none focus:border-[#BCA0F5]"
              />
              <button
                type="submit"
                className="bg-[#BCA0F5] hover:bg-[#8961D8] text-white font-black px-4 py-2.5 rounded-2xl text-xs transition flex items-center space-x-1.5 shadow-md"
              >
                <Search className="w-4 h-4" />
                <span>Find</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#FFF8F2] border-t border-[#E9DDF1] text-center shrink-0">
          <p className="text-xs text-[#71667D]">
            Compliant with university asset barcodes and international ISO/IEC 18004 QR standards.
          </p>
        </div>
      </div>
    </div>
  );
};
