import { useState, useRef, useCallback, useEffect } from 'react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onRemove: () => void;
  currentPhoto?: string;
  label?: string;
}

export default function CameraCapture({ onCapture, onRemove, currentPhoto, label = '📸 Add Photo Evidence (Optional)' }: CameraCaptureProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCameraError('');
  }, [stream]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      setStream(mediaStream);
      setShowCamera(true);
      // Wait for video element to be mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device. Try uploading a photo instead.');
      } else {
        setCameraError('Could not access camera. Try uploading a photo instead.');
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    onCapture(dataUrl);
    stopCamera();
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDim = 1280;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height / width) * maxDim;
              width = maxDim;
            } else {
              width = (width / height) * maxDim;
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject('Canvas not supported'); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => reject('Failed to load image');
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject('Failed to read file');
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
      setCameraError('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }

    setProcessing(true);
    setCameraError('');
    try {
      if (file.size > MAX_FILE_SIZE) {
        const compressed = await compressImage(file);
        onCapture(compressed);
      } else {
        const compressed = await compressImage(file);
        onCapture(compressed);
      }
    } catch {
      setCameraError('Failed to process image. Please try again.');
    }
    setProcessing(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (currentPhoto) {
    return (
      <div className="camera-section">
        <label className="camera-label">{label}</label>
        <div className="photo-preview">
          <img src={currentPhoto} alt="Complaint photo" className="preview-img" />
          <div className="photo-actions">
            <button type="button" className="retake-btn" onClick={() => { onRemove(); startCamera(); }}>
              🔄 Retake
            </button>
            <button type="button" className="remove-btn" onClick={onRemove}>
              🗑️ Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-section">
      <label className="camera-label">{label}</label>

      {cameraError && <div className="camera-error">⚠️ {cameraError}</div>}

      {showCamera ? (
        <div className="camera-live">
          <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="camera-controls">
            <button type="button" className="capture-btn" onClick={capturePhoto}>
              📷 Capture
            </button>
            <button type="button" className="cancel-camera-btn" onClick={stopCamera}>
              ✕ Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="camera-options">
          <button type="button" className="camera-option-btn" onClick={startCamera}>
            📷 Open Camera
          </button>
          <span className="camera-divider">or</span>
          <label className="camera-option-btn upload-label">
            📁 Choose from Gallery
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {processing && (
        <div className="camera-processing">
          <span className="spinner"></span> Processing image...
        </div>
      )}

      <p className="camera-hint">Max 5 MB. JPEG, PNG or WebP. Images are compressed automatically.</p>
    </div>
  );
}
