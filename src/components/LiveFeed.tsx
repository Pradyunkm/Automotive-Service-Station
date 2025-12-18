import { Camera, X, RefreshCw, Activity, Upload } from 'lucide-react';
import { useState, useEffect, ChangeEvent, useRef } from "react";

// Production API URL
const API_URL = "https://automotive-service-station.onrender.com";

// --- 1. API HELPER ---
const analyzeImageFile = async (file: File, cameraId: number, serviceRecordId?: string, shouldUpload: boolean = false) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("camera_id", cameraId.toString());
  formData.append("is_manual", "true");
  formData.append("should_upload", shouldUpload.toString());
  if (serviceRecordId) {
    formData.append("service_record_id", serviceRecordId);
  }

  const response = await fetch(`${API_URL}/api/analyze-image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Failed to analyze image");
  return response.json();
};

// --- 2. TYPES ---
interface AnalysisResult {
  scratches?: number;
  dents?: number;
  cracks?: number;
  imageUrl?: string;
  beforeImage?: string;
  annotatedImage?: string;
  annotatedImageUrl?: string;
  brakeStatus?: "Good" | "Bad";
}

type Block = "front" | "left" | "right" | "brake";

interface BlockState {
  beforeImage: string | null;
  afterImage: string | null;
  loading: boolean;
  analysisResult: AnalysisResult;
}

interface LiveFeedProps {
  title?: string;
  showUpload?: boolean;
  serviceRecordId?: string;
  onAnalysisComplete?: (block: Block, result: AnalysisResult) => void;
}

// --- 3. MAIN COMPONENT ---
export function LiveFeed({ showUpload = true, serviceRecordId, onAnalysisComplete }: LiveFeedProps) {

  // --- VIDEO SOURCE SELECTOR ---
  const [videoSource, setVideoSource] = useState<'pi' | 'webcam' | 'rpi' | 'none'>('none');

  // --- WEBCAM DEVICE SELECTION (ROBUST LOGIC) ---
  const [availableWebcams, setAvailableWebcams] = useState<MediaDeviceInfo[]>([]);

  // --- RPI CAMERA URL CONFIGURATION ---
  // Store list of available RPI cameras
  interface RpiCamera {
    id: string;
    name: string;
    url: string;
  }

  const [availableRpiCameras, setAvailableRpiCameras] = useState<RpiCamera[]>([]);
  const [selectedRpiCameras, setSelectedRpiCameras] = useState<Record<Block, string>>({
    front: '',
    left: '',
    right: '',
    brake: ''
  });
  const [showRpiConfig, setShowRpiConfig] = useState(false);
  const [newRpiName, setNewRpiName] = useState('');
  const [newRpiUrl, setNewRpiUrl] = useState('');

  // --- PER-STATION WEBCAM STATE ---
  interface StationWebcamState {
    stream: MediaStream | null;
    videoRef: React.RefObject<HTMLVideoElement>;
    selectedDeviceId: string;
    loading: boolean;
    error: string | null;
  }

  const frontWebcamRef = useRef<HTMLVideoElement>(null);
  const leftWebcamRef = useRef<HTMLVideoElement>(null);
  const rightWebcamRef = useRef<HTMLVideoElement>(null);
  const brakeWebcamRef = useRef<HTMLVideoElement>(null);

  const [stationWebcams, setStationWebcams] = useState<Record<Block, StationWebcamState>>({
    front: { stream: null, videoRef: frontWebcamRef, selectedDeviceId: '', loading: false, error: null },
    left: { stream: null, videoRef: leftWebcamRef, selectedDeviceId: '', loading: false, error: null },
    right: { stream: null, videoRef: rightWebcamRef, selectedDeviceId: '', loading: false, error: null },
    brake: { stream: null, videoRef: brakeWebcamRef, selectedDeviceId: '', loading: false, error: null },
  });

  // Enumerate available webcams with robust permission handling
  const initWebcams = async () => {
    try {
      console.log("Requesting camera permission...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      // Stop the initial test stream immediately
      stream.getTracks().forEach(t => t.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableWebcams(videoDevices);

      // Auto-select first camera for all stations if none selected
      if (videoDevices.length > 0) {
        setStationWebcams(prev => ({
          front: { ...prev.front, selectedDeviceId: prev.front.selectedDeviceId || videoDevices[0]?.deviceId || '' },
          left: { ...prev.left, selectedDeviceId: prev.left.selectedDeviceId || videoDevices[1]?.deviceId || videoDevices[0]?.deviceId || '' },
          right: { ...prev.right, selectedDeviceId: prev.right.selectedDeviceId || videoDevices[2]?.deviceId || videoDevices[0]?.deviceId || '' },
          brake: { ...prev.brake, selectedDeviceId: prev.brake.selectedDeviceId || videoDevices[3]?.deviceId || videoDevices[0]?.deviceId || '' },
        }));
      }
    } catch (err: any) {
      console.error("Failed to enumerate devices:", err);
    }
  };

  // --- LOGIC: PI FEED (MULTI-CAMERA) ---
  // Store per-station feeds for multi-camera RPI mode
  const [stationPiFeeds, setStationPiFeeds] = useState<Record<Block, string | null>>({
    front: null,
    left: null,
    right: null,
    brake: null
  });

  // Track connection status for each station
  const [stationConnectionStatus, setStationConnectionStatus] = useState<Record<Block, {
    connected: boolean;
    lastUpdate: number | null;
  }>>({
    front: { connected: false, lastUpdate: null },
    left: { connected: false, lastUpdate: null },
    right: { connected: false, lastUpdate: null },
    brake: { connected: false, lastUpdate: null }
  });

  // Legacy single-camera Pi feed (kept for backward compatibility)
  const [piImage, setPiImage] = useState<string | null>(null);
  const [piRawImage, setPiRawImage] = useState<string | null>(null); // Store raw image without boxes
  const [piStats, setPiStats] = useState({ dents: 0, scratches: 0, cracks: 0 });
  const [piStatus, setPiStatus] = useState("Waiting for connection...");
  const [activePiCamera, setActivePiCamera] = useState<number>(0);

  // --- AUTO-CAPTURE STATE ---
  const [autoCapturing, setAutoCapturing] = useState(false);
  const [currentAutoStation, setCurrentAutoStation] = useState<Block | null>(null);
  const autoCaptureTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Start webcam for a specific station
  const startStationWebcam = async (station: Block, deviceId?: string) => {
    setStationWebcams(prev => ({
      ...prev,
      [station]: { ...prev[station], loading: true, error: null }
    }));

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : true
      };

      console.log(`Starting webcam for ${station} with constraints:`, constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log(`✅ Webcam stream obtained for ${station}:`, stream.getVideoTracks().map(t => t.label));

      setStationWebcams(prev => ({
        ...prev,
        [station]: { ...prev[station], stream, loading: false }
      }));

      // Attach stream to video element
      const videoRef = stationWebcams[station].videoRef;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.error(`Error playing video for ${station}:`, err);
          setStationWebcams(prev => ({
            ...prev,
            [station]: { ...prev[station], error: "Failed to play video", loading: false }
          }));
        });
      }

    } catch (err: any) {
      const errorMsg = err.name === 'NotReadableError'
        ? "Camera is in use by another app. Please close other apps using the camera."
        : err.name === 'NotAllowedError'
          ? "Camera permission denied. Please allow camera access."
          : `Failed to access webcam: ${err.message}`;

      setStationWebcams(prev => ({
        ...prev,
        [station]: { ...prev[station], error: errorMsg, loading: false }
      }));
      console.error(`❌ Webcam error for ${station}:`, err);
    }
  };

  const stopStationWebcam = (station: Block) => {
    const stationState = stationWebcams[station];
    if (stationState.stream) {
      console.log(`🛑 Stopping webcam stream for ${station}...`);
      stationState.stream.getTracks().forEach(track => {
        track.stop();
        console.log("Track stopped:", track.label);
      });
    }
    if (stationState.videoRef.current) {
      stationState.videoRef.current.srcObject = null;
    }
    setStationWebcams(prev => ({
      ...prev,
      [station]: { ...prev[station], stream: null, loading: false, error: null }
    }));
  };

  // Effect to attach streams to video elements whenever they change
  useEffect(() => {
    blocksList.forEach(block => {
      const stationState = stationWebcams[block];
      if (stationState.stream && stationState.videoRef.current) {
        console.log(`🔗 Attaching stream to video element for ${block}`);
        stationState.videoRef.current.srcObject = stationState.stream;
        stationState.videoRef.current.play().catch(err => {
          console.error(`Error playing video for ${block}:`, err);
        });
      }
    });
  }, [stationWebcams]);

  // Start/stop webcams when video source changes
  useEffect(() => {
    if (videoSource === 'webcam') {
      initWebcams().then(() => {
        setTimeout(() => {
          blocksList.forEach(block => {
            const deviceId = stationWebcams[block].selectedDeviceId;
            if (deviceId) {
              startStationWebcam(block, deviceId);
            } else {
              startStationWebcam(block);
            }
          });
        }, 100);
      });
    } else {
      // Stop all webcams when switching away from webcam mode
      blocksList.forEach(block => stopStationWebcam(block));
    }
    return () => {
      blocksList.forEach(block => stopStationWebcam(block));
    };
  }, [videoSource]);

  // Switch station webcam when selection changes
  const handleStationWebcamChange = (station: Block, deviceId: string) => {
    setStationWebcams(prev => ({
      ...prev,
      [station]: { ...prev[station], selectedDeviceId: deviceId }
    }));

    if (videoSource === 'webcam') {
      stopStationWebcam(station);
      setTimeout(() => {
        startStationWebcam(station, deviceId);
      }, 300);
    }
  };

  // Load RPI camera URLs from backend
  useEffect(() => {
    const loadRpiCameras = async () => {
      try {
        const response = await fetch(`${API_URL}/api/rpi-cameras`);
        if (response.ok) {
          const data = await response.json();
          if (data.cameras) {
            setAvailableRpiCameras(data.cameras);
            console.log('✅ RPI cameras loaded:', data.cameras);
          }
        }
      } catch (err) {
        console.error('Failed to load RPI cameras:', err);
      }
    };
    loadRpiCameras();
  }, []);

  // Add new RPI camera to list
  const addRpiCamera = async () => {
    if (!newRpiName.trim() || !newRpiUrl.trim()) {
      alert('Please enter both camera name and URL');
      return;
    }

    const newCamera: RpiCamera = {
      id: `rpi_${Date.now()}`,
      name: newRpiName,
      url: newRpiUrl
    };

    const updatedCameras = [...availableRpiCameras, newCamera];
    setAvailableRpiCameras(updatedCameras);

    // Save to backend
    try {
      await fetch('http://127.0.0.1:8000/api/rpi-cameras/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameras: updatedCameras })
      });
      setNewRpiName('');
      setNewRpiUrl('');
      alert('✅ RPI camera added successfully!');
    } catch (err) {
      alert('❌ Error adding RPI camera');
      console.error(err);
    }
  };

  // Remove RPI camera from list
  const removeRpiCamera = async (cameraId: string) => {
    const updatedCameras = availableRpiCameras.filter(cam => cam.id !== cameraId);
    setAvailableRpiCameras(updatedCameras);

    // Clear any station selections using this camera
    setSelectedRpiCameras(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (updated[key as Block] === cameraId) {
          updated[key as Block] = '';
        }
      });
      return updated;
    });

    // Save to backend
    try {
      await fetch('http://127.0.0.1:8000/api/rpi-cameras/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameras: updatedCameras })
      });
    } catch (err) {
      console.error('Error removing RPI camera:', err);
    }
  };

  // Helper to switch Pi Camera
  const switchPiCamera = async (index: number) => {
    setActivePiCamera(index);
    try {
      await fetch(`${API_URL}/api/set-active-camera/${index}`, { method: "POST" });
      setPiStatus(`Switching to Cam ${index}...`);
    } catch (err) { console.error(err); }
  };


  const handlePiCameraSwitch = (e: ChangeEvent<HTMLSelectElement>) => {
    switchPiCamera(parseInt(e.target.value));
  };


  // Polling Loop for Pi Feed
  useEffect(() => {
    if (videoSource !== 'pi') return;

    // Poll all 4 stations independently
    const timer = setInterval(async () => {
      try {
        // Fetch feeds for all stations in parallel
        const stations: Block[] = ['front', 'left', 'right', 'brake'];
        const feedPromises = stations.map(async (station) => {
          try {
            const response = await fetch(`${API_URL}/api/station-feed/${station}`);
            const data = await response.json();
            if (data.annotatedImage) {
              return { station, image: `data:image/jpeg;base64,${data.annotatedImage}`, timestamp: data.timestamp };
            }
            return { station, image: null, timestamp: null };
          } catch (err) {
            console.error(`Failed to fetch ${station} feed:`, err);
            return { station, image: null, timestamp: null };
          }
        });

        const results = await Promise.all(feedPromises);
        const newFeeds: Record<Block, string | null> = {
          front: null,
          left: null,
          right: null,
          brake: null
        };

        const newConnectionStatus: Record<Block, { connected: boolean; lastUpdate: number | null }> = {
          front: { connected: false, lastUpdate: null },
          left: { connected: false, lastUpdate: null },
          right: { connected: false, lastUpdate: null },
          brake: { connected: false, lastUpdate: null }
        };

        const currentTime = Date.now() / 1000; // Current time in seconds

        results.forEach(({ station, image, timestamp }) => {
          newFeeds[station] = image;

          // Consider connected if we received data within last 3 seconds
          if (timestamp && (currentTime - timestamp) < 3) {
            newConnectionStatus[station] = {
              connected: true,
              lastUpdate: timestamp
            };
          }
        });

        setStationPiFeeds(newFeeds);
        setStationConnectionStatus(newConnectionStatus);

        // Update status if at least one feed is active
        const activeFeedCount = Object.values(newConnectionStatus).filter(s => s.connected).length;
        if (activeFeedCount > 0) {
          setPiStatus(`System Active • ${activeFeedCount}/4 cameras`);
        } else {
          setPiStatus("Waiting for RPI feeds...");
        }

        // Also update legacy single feed for backward compatibility with main display
        const response = await fetch(`${API_URL}/api/latest-detection`);
        const data = await response.json();
        if (data.annotatedImage) {
          setPiImage(`data:image/jpeg;base64,${data.annotatedImage}`);
          if (data.cleanImage) {
            setPiRawImage(`data:image/jpeg;base64,${data.cleanImage}`);
          }
          setPiStats({ dents: data.dentCount, scratches: data.scratchCount, cracks: data.crackCount });
        }
      } catch (err) {
        setPiStatus("Backend Offline");
      }
    }, 500);
    return () => clearInterval(timer);
  }, [videoSource]);


  // --- LOGIC: MANUAL INSPECTION ---
  const blocksList: Block[] = ["front", "left", "right", "brake"];
  const blockIds: Record<Block, number> = { front: 0, left: 1, right: 2, brake: 3 };

  const [blocks, setBlocks] = useState<Record<Block, BlockState>>({
    front: { beforeImage: null, afterImage: null, loading: false, analysisResult: {} },
    left: { beforeImage: null, afterImage: null, loading: false, analysisResult: {} },
    right: { beforeImage: null, afterImage: null, loading: false, analysisResult: {} },
    brake: { beforeImage: null, afterImage: null, loading: false, analysisResult: {} },
  });

  const captureFromFeed = async (block: Block) => {
    let file: File;
    let sourceImageUrl: string;

    if (videoSource === 'pi') {
      // Use station-specific feed if available, otherwise fall back to shared feed
      const stationFeed = stationPiFeeds[block];
      const sourceImage = stationFeed || piRawImage || piImage;
      if (!sourceImage) return alert(`No Pi feed available for ${block} station`);

      const res = await fetch(sourceImage);
      const blob = await res.blob();
      file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      sourceImageUrl = sourceImage;
    } else if (videoSource === 'rpi') {
      // Fetch frame from RPI camera via backend endpoint
      const selectedCameraId = selectedRpiCameras[block];
      if (!selectedCameraId) {
        return alert(`No RPI camera selected for ${block} station`);
      }

      const selectedCamera = availableRpiCameras.find(cam => cam.id === selectedCameraId);
      if (!selectedCamera) {
        return alert(`RPI camera not found for ${block} station`);
      }

      try {
        // Fetch directly from camera URL (snapshot endpoint)
        const snapshotUrl = selectedCamera.url.replace('/stream', '/snapshot');
        const response = await fetch(snapshotUrl);

        if (!response.ok) {
          return alert(`Failed to capture from RPI camera: HTTP ${response.status}`);
        }

        const blob = await response.blob();
        file = new File([blob], "rpi-capture.jpg", { type: "image/jpeg" });

        // Convert to data URL for display
        const reader = new FileReader();
        sourceImageUrl = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        return alert(`Failed to fetch RPI camera frame: ${err}`);
      }
    } else {
      // Capture from this block's specific webcam
      const stationState = stationWebcams[block];
      if (!stationState.videoRef.current || !stationState.stream) {
        return alert(`No webcam stream available for ${block} station`);
      }

      const canvas = document.createElement('canvas');
      const video = stationState.videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return alert("Failed to create canvas context");

      ctx.drawImage(video, 0, 0);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.95);
      });

      file = new File([blob], "webcam-capture.jpg", { type: "image/jpeg" });
      sourceImageUrl = canvas.toDataURL('image/jpeg', 0.95);
    }

    setBlocks(p => ({ ...p, [block]: { ...p[block], loading: true, beforeImage: sourceImageUrl } }));

    try {
      const targetId = blockIds[block];
      // Always save to database (works from any device/URL)
      const resData = await analyzeImageFile(file, targetId, serviceRecordId, true);

      const annotatedUrl = `data:image/jpeg;base64,${resData.annotatedImage}`;
      const hasDefects = (resData.scratchCount + resData.dentCount + resData.crackCount) > 0;
      const brakeStatus = hasDefects ? "Bad" : "Good";

      setBlocks(p => ({
        ...p, [block]: {
          ...p[block], loading: false, afterImage: annotatedUrl,
          analysisResult: {
            scratches: resData.scratchCount,
            dents: resData.dentCount,
            cracks: resData.crackCount,
            brakeStatus: brakeStatus
          }
        }
      }));

      if (onAnalysisComplete) {
        onAnalysisComplete(block, {
          scratches: resData.scratchCount,
          dents: resData.dentCount,
          cracks: resData.crackCount,
          imageUrl: resData.imageUrl,
          beforeImage: sourceImageUrl,
          annotatedImage: annotatedUrl,
          annotatedImageUrl: resData.annotatedImageUrl,
          brakeStatus: brakeStatus
        });
      }
    } catch (e) {
      setBlocks(p => ({ ...p, [block]: { ...p[block], loading: false } }));
    }
  };

  const resetBlock = (block: Block) => {
    setBlocks(prev => ({
      ...prev,
      [block]: { beforeImage: null, afterImage: null, loading: false, analysisResult: {} }
    }));
  };

  // --- AUTO-CAPTURE LOGIC ---
  const startAutoCapture = () => {
    if (videoSource === 'none') {
      alert('Please select a video source first (Webcam or RPi Feed)');
      return;
    }
    if (autoCapturing) return;

    setAutoCapturing(true);
    const stationOrder: Block[] = ['front', 'left', 'right', 'brake'];
    let currentIndex = 0;
    setCurrentAutoStation(stationOrder[0]);

    // For RPi Feed with multi-camera script: All cameras already streaming,
    // just capture from each station sequentially
    autoCaptureTimerRef.current = setInterval(() => {
      if (currentIndex < stationOrder.length) {
        const station = stationOrder[currentIndex];
        setCurrentAutoStation(station);
        captureFromFeed(station);
        currentIndex++;
      } else {
        clearInterval(autoCaptureTimerRef.current!);
        autoCaptureTimerRef.current = null;
        setAutoCapturing(false);
        setCurrentAutoStation(null);
      }
    }, 2000);
  };

  // Stop auto-capture when video source changes
  useEffect(() => {
    if (videoSource === 'none' && autoCaptureTimerRef.current) {
      clearInterval(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
      setAutoCapturing(false);
      setCurrentAutoStation(null);
    }
  }, [videoSource]);


  // --- RENDER UI ---
  return (
    <div className="space-y-8">

      {/* 1. PREMIUM MASTER CONTROL / LIVE MONITOR */}
      <div className="glass-card bg-gradient-to-br from-slate-950/90 to-blue-950/90 rounded-3xl shadow-2xl overflow-hidden border-2 border-white/20 relative">
        <div className="scan-line" />

        <div className="bg-black/40 backdrop-blur-2xl px-8 py-6 flex flex-col md:flex-row justify-between items-center border-b border-white/20 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="relative bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-3 rounded-2xl shadow-xl"
              style={{ boxShadow: '0 0 30px rgba(34, 211, 238, 0.5)' }}>
              <Activity className="text-white w-6 h-6 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 tracking-tight">
                AI LIVE MONITOR
              </h2>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${videoSource === 'pi'
                  ? (piStatus.includes("Active") ? "bg-green-400" : "bg-red-400")
                  : videoSource === 'webcam'
                    ? "bg-green-400"
                    : "bg-red-400"
                  }`}
                  style={(videoSource === 'pi' && piStatus.includes("Active")) || videoSource === 'webcam' ? {
                    boxShadow: '0 0 10px rgba(74, 222, 128, 0.8)',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  } : {}}></span>
                <p className="text-xs text-cyan-200/80 font-bold tracking-widest uppercase">
                  {videoSource === 'none'
                    ? 'No Feed Selected'
                    : videoSource === 'pi'
                      ? piStatus
                      : 'Webcam Mode Active'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 md:mt-0 relative z-10 flex-wrap justify-end">
            {/* VIDEO SOURCE SELECTOR */}
            <div className="flex items-center bg-gradient-to-r from-purple-800/80 to-pink-900/80 backdrop-blur-xl rounded-2xl px-3 py-2 border-2 border-purple-500/30 shadow-lg">
              <Camera className="w-4 h-4 mr-2 text-purple-300" />
              <select
                value={videoSource}
                onChange={(e) => setVideoSource(e.target.value as 'pi' | 'webcam' | 'none')}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option className="text-white bg-slate-800" value="none">No Feed</option>
                <option className="text-white bg-slate-800" value="pi">RPi Feed</option>
                <option className="text-white bg-slate-800" value="webcam">Webcam</option>
              </select>
            </div>



            {/* Auto-Capture Button */}
            {videoSource !== 'none' && (
              <button
                onClick={startAutoCapture}
                disabled={autoCapturing}
                className={`flex items-center gap-2 backdrop-blur-xl rounded-2xl px-3 py-2 border-2 shadow-lg text-white text-xs font-bold transition-all ${autoCapturing
                  ? 'bg-gradient-to-r from-gray-600/80 to-gray-700/80 border-gray-500/30 cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-green-600/80 to-green-700/80 border-green-500/30 hover:from-green-700/80 hover:to-green-800/80'
                  }`}
              >
                <Camera className="w-3 h-3" />
                {autoCapturing
                  ? `CAPTURING ${blocksList.indexOf(currentAutoStation!) + 1}/4...`
                  : 'AUTO CAPTURE'}
              </button>
            )}

            {/* Clear Button */}
            {videoSource !== 'none' && (
              <button
                onClick={() => {
                  if (autoCaptureTimerRef.current) {
                    clearInterval(autoCaptureTimerRef.current);
                    autoCaptureTimerRef.current = null;
                  }
                  setAutoCapturing(false);
                  setCurrentAutoStation(null);
                  setVideoSource('none');
                  setPiImage(null);
                  setPiRawImage(null);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600/80 to-red-700/80 backdrop-blur-xl rounded-2xl px-3 py-2 border-2 border-red-500/30 shadow-lg text-white text-xs font-bold hover:from-red-700/80 hover:to-red-800/80 transition-all"
              >
                <X className="w-3 h-3" />
                CLEAR
              </button>
            )}





            {/* Pi Camera Selector */}
            {videoSource === 'pi' && (
              <div className="flex items-center bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl px-3 py-2 border-2 border-cyan-500/30 shadow-lg">
                <RefreshCw className="w-4 h-4 mr-2 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
                <select value={activePiCamera} onChange={handlePiCameraSwitch}
                  className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer">
                  <option className="text-white bg-slate-800" value={0}>Cam 0</option>
                  <option className="text-white bg-slate-800" value={1}>Cam 1</option>
                  <option className="text-white bg-slate-800" value={2}>Cam 2</option>
                  <option className="text-white bg-slate-800" value={3}>Cam 3</option>
                </select>
              </div>
            )}

            {/* PREMIUM STATS DISPLAY - PI ONLY */}
            {videoSource === 'pi' && (
              <div className="flex gap-4 text-white ml-2">
                <div className="text-center relative">
                  <span className="block text-xl font-black neon-text tabular-nums" style={{ color: '#ef4444', textShadow: '0 0 15px rgba(239, 68, 68, 0.8)' }}>
                    {piStats.dents}
                  </span>
                  <span className="text-[9px] text-red-300/70 tracking-widest font-bold uppercase">Dents</span>
                </div>
                <div className="text-center relative">
                  <span className="block text-xl font-black neon-text tabular-nums" style={{ color: '#fbbf24', textShadow: '0 0 15px rgba(251, 191, 36, 0.8)' }}>
                    {piStats.scratches}
                  </span>
                  <span className="text-[9px] text-yellow-300/70 tracking-widest font-bold uppercase">Scratches</span>
                </div>
                <div className="text-center relative">
                  <span className="block text-xl font-black neon-text tabular-nums" style={{ color: '#a855f7', textShadow: '0 0 15px rgba(168, 85, 247, 0.8)' }}>
                    {piStats.cracks}
                  </span>
                  <span className="text-[9px] text-purple-300/70 tracking-widest font-bold uppercase">Marks</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Premium Video Display with Holographic Border - Pi Feed Only */}
        {videoSource === 'pi' && (
          <div className="relative w-full h-[450px] bg-black/90 flex items-center justify-center border-t-2 border-cyan-500/20 overflow-hidden">
            {/* Corner indicators */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60 animate-pulse" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400/60 animate-pulse" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/60 animate-pulse" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400/60 animate-pulse" />

            {/* Scan grid overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(34, 211, 238, 0.2) 10px, rgba(34, 211, 238, 0.2) 11px)',
              }}
            />

            {/* Pi Feed Video Display */}
            {piImage ? (
              <img src={piImage} className="h-full object-contain relative z-10 shadow-2xl"
                style={{ boxShadow: '0 0 50px rgba(34, 211, 238, 0.3)' }} />
            ) : (
              <div className="text-cyan-400/50 text-2xl font-black tracking-widest uppercase flex flex-col items-center gap-4">
                <Activity className="w-16 h-16 animate-pulse" />
                NO SIGNAL
              </div>
            )}
          </div>
        )}
      </div>

      {/* RPI CONFIGURATION PANEL */}
      {showRpiConfig && videoSource === 'rpi' && (
        <div className="glass-card bg-gradient-to-br from-blue-950/90 to-slate-950/90 rounded-3xl shadow-2xl overflow-hidden border-2 border-blue-500/20 p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            Manage RPI Cameras
          </h3>
          <p className="text-sm text-slate-300 mb-6">
            Add Raspberry Pi cameras to your list. Then select which camera to use for each station below.
          </p>

          {/* Add New Camera Form */}
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-bold text-white mb-3">Add New Camera</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={newRpiName}
                onChange={(e) => setNewRpiName(e.target.value)}
                placeholder="Camera Name (e.g., Front Camera)"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                value={newRpiUrl}
                onChange={(e) => setNewRpiUrl(e.target.value)}
                placeholder="http://192.168.1.100:8080/stream"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={addRpiCamera}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors"
            >
              Add Camera
            </button>
          </div>

          {/* Camera List */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3">Available Cameras ({availableRpiCameras.length})</h4>
            {availableRpiCameras.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No cameras added yet. Add one above to get started.</p>
            ) : (
              <div className="space-y-2">
                {availableRpiCameras.map((camera) => (
                  <div key={camera.id} className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{camera.name}</p>
                      <p className="text-slate-400 text-xs truncate">{camera.url}</p>
                    </div>
                    <button
                      onClick={() => removeRpiCamera(camera.id)}
                      className="ml-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowRpiConfig(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 2. INSPECTION STATIONS */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Camera className="w-6 h-6 text-blue-600" />
          Manual Inspection Stations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blocksList.map((block) => {
            const state = blocks[block];
            const stationWebcam = stationWebcams[block];
            const selectedRpiCamera = availableRpiCameras.find(cam => cam.id === selectedRpiCameras[block]);
            // For RPi Feed: Each station just shows its camera, no switching needed
            const isLive = (videoSource === 'pi') || (videoSource === 'webcam' && stationWebcam.stream) || (videoSource === 'rpi' && selectedRpiCamera);
            const isCurrentAutoStation = autoCapturing && currentAutoStation === block;

            return (
              <div key={block} className={`bg-white rounded-lg shadow-md overflow-hidden border transition-all duration-300 ${isCurrentAutoStation
                ? 'border-green-500 ring-4 ring-green-300 shadow-lg shadow-green-500/50'
                : isLive
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-slate-200'
                }`}>

                {/* Card Header */}
                <div className={`px-4 py-3 border-b border-slate-200 flex justify-between items-center ${isCurrentAutoStation ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-sm">{block} STATION</span>
                    {isCurrentAutoStation && (
                      <span className="text-xs font-bold text-green-600 bg-green-200 px-2 py-1 rounded animate-pulse">
                        CAPTURING NOW...
                      </span>
                    )}
                    {/* RPI Connection Status Indicator */}
                    {videoSource === 'pi' && (
                      <div className="flex items-center gap-1">
                        {stationConnectionStatus[block].connected ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                              style={{ boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)' }} />
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                              RPI CONNECTED
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                              WAITING...
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {(state.beforeImage || state.afterImage || state.loading) && (
                      <button onClick={() => resetBlock(block)} className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-bold">
                        <X className="w-4 h-4" /> CLEAR
                      </button>
                    )}
                    {/* Webcam Selector for this station */}
                    {videoSource === 'webcam' && (
                      <div className="flex items-center bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-lg px-2 py-1 border border-cyan-500/30 shadow-sm max-w-[140px]">
                        <Camera className="w-3 h-3 mr-1 text-cyan-400 shrink-0" />
                        <select
                          value={stationWebcam.selectedDeviceId}
                          onChange={(e) => handleStationWebcamChange(block, e.target.value)}
                          className="bg-transparent text-white text-[10px] font-bold focus:outline-none cursor-pointer w-full truncate"
                        >
                          {availableWebcams.length === 0 && <option value="">Searching...</option>}
                          {availableWebcams.map((device, index) => (
                            <option
                              key={device.deviceId}
                              className="text-white bg-slate-800"
                              value={device.deviceId}
                            >
                              {device.label || `Camera ${index + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {/* RPi Feed Camera Selector (show which camera this station uses) */}
                    {videoSource === 'pi' && (
                      <div className="flex items-center bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-lg px-2 py-1 border border-cyan-500/30 shadow-sm max-w-[140px]">
                        <Camera className="w-3 h-3 mr-1 text-cyan-400 shrink-0" />
                        <span className="text-white text-[10px] font-bold">
                          {block === 'front' && 'Front (Cam 0)'}
                          {block === 'left' && 'Left (Cam 1)'}
                          {block === 'right' && 'Right (Cam 2)'}
                          {block === 'brake' && 'Brake (Cam 3)'}
                        </span>
                      </div>
                    )}
                    {/* RPI Camera Selector for this station (MJPEG mode) */}
                    {videoSource === 'rpi' && (
                      <div className="flex items-center bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-lg px-2 py-1 border border-cyan-500/30 shadow-sm max-w-[140px]">
                        <Camera className="w-3 h-3 mr-1 text-cyan-400 shrink-0" />
                        <select
                          value={selectedRpiCameras[block]}
                          onChange={(e) => setSelectedRpiCameras({ ...selectedRpiCameras, [block]: e.target.value })}
                          className="bg-transparent text-white text-[10px] font-bold focus:outline-none cursor-pointer w-full truncate"
                        >
                          <option value="">Select RPI Cam...</option>
                          {availableRpiCameras.map((camera) => (
                            <option
                              key={camera.id}
                              className="text-white bg-slate-800"
                              value={camera.id}
                            >
                              {camera.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="relative bg-slate-900 h-[280px] flex items-center justify-center group">
                  {state.afterImage ? (
                    <img src={state.afterImage} className="h-full w-full object-contain" />
                  ) : isLive ? (
                    videoSource === 'pi' ? (
                      // Show station-specific RPI feed
                      stationPiFeeds[block] ? (
                        <img src={stationPiFeeds[block]!} className="h-full w-full object-contain" />
                      ) : (
                        <div className="text-cyan-400/50 text-sm font-bold uppercase flex items-center justify-center">
                          <Activity className="w-8 h-8 animate-pulse mr-2" />
                          Waiting for {block} feed...
                        </div>
                      )
                    ) : videoSource === 'webcam' && stationWebcam.stream ? (
                      // Show this station's own webcam video feed
                      <>
                        <video
                          ref={stationWebcam.videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="h-full w-full object-contain"
                        />
                        {stationWebcam.loading && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 text-cyan-400/50 text-xs font-bold tracking-widest uppercase gap-2">
                            <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                            INITIALIZING...
                          </div>
                        )}
                      </>
                    ) : videoSource === 'rpi' && selectedRpiCamera ? (
                      // Show RPI MJPEG stream for this station
                      <img
                        src={selectedRpiCamera.url}
                        alt={`RPI Camera ${block}`}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          console.error(`Failed to load RPI stream for ${block}`);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-cyan-400/50 text-sm font-bold uppercase flex items-center justify-center">
                        <Activity className="w-8 h-8 animate-pulse mr-2" />
                        {videoSource === 'rpi' ? 'RPI Stream Loading...' : 'Loading camera...'}
                      </div>
                    )
                  ) : (
                    <div className="text-center">
                      <p className="text-slate-600 text-xs uppercase mb-2">No Active Feed</p>
                      <p className="text-slate-500 text-xs mb-3">Select a video source above</p>
                      {stationWebcam.error && (
                        <p className="text-red-500 text-xs">{stationWebcam.error}</p>
                      )}
                    </div>
                  )}

                  {state.loading && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-10">
                      <RefreshCw className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                      <span className="text-sm font-mono animate-pulse">ANALYZING...</span>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-white">
                  {!state.afterImage ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => captureFromFeed(block)}
                        disabled={!isLive}
                        className={`flex-1 py-2 rounded text-sm font-bold transition-colors flex items-center justify-center gap-2
                                ${isLive ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                        <Camera className="w-4 h-4" /> CAPTURE FRAME
                      </button>

                      {showUpload && (
                        <label className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-300">
                          <Upload className="w-4 h-4" /> UPLOAD FILE
                          <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const reader = new FileReader();
                            reader.onload = async (event) => {
                              const beforeImageUrl = event.target?.result as string;

                              setBlocks(p => ({ ...p, [block]: { ...p[block], loading: true, beforeImage: beforeImageUrl } }));
                              try {
                                const targetId = blockIds[block];
                                // Always save to database (works from any device/URL)
                                const res = await analyzeImageFile(file, targetId, serviceRecordId, true);

                                if (!res.annotatedImage) {
                                  console.error("Analysis failed:", res);
                                  throw new Error("No annotated image returned");
                                }

                                const annotatedUrl = `data:image/jpeg;base64,${res.annotatedImage}`;
                                const hasDefects = (res.scratchCount + res.dentCount + res.crackCount) > 0;
                                const brakeStatus = hasDefects ? "Bad" : "Good";

                                setBlocks(p => ({
                                  ...p, [block]: {
                                    ...p[block], loading: false, afterImage: annotatedUrl,
                                    analysisResult: {
                                      scratches: res.scratchCount,
                                      dents: res.dentCount,
                                      cracks: res.crackCount,
                                      brakeStatus: brakeStatus
                                    }
                                  }
                                }));

                                if (onAnalysisComplete) onAnalysisComplete(block, {
                                  scratches: res.scratchCount,
                                  dents: res.dentCount,
                                  cracks: res.crackCount,
                                  imageUrl: res.imageUrl,
                                  beforeImage: beforeImageUrl,
                                  annotatedImage: annotatedUrl,
                                  annotatedImageUrl: res.annotatedImageUrl,
                                  brakeStatus: brakeStatus
                                });
                              } catch (err) {
                                alert("Analysis Failed");
                                setBlocks(p => ({ ...p, [block]: { ...p[block], loading: false } }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }} />
                        </label>
                      )}
                    </div>
                  ) : (
                    /* RESULTS DISPLAY */
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {block === 'brake' && state.analysisResult.brakeStatus ? (
                        /* BRAKE STATUS DISPLAY - SIMPLE */
                        <div className="flex justify-center">
                          <div className={`px-12 py-4 rounded-lg border-2 text-center ${state.analysisResult.brakeStatus === 'Bad'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-green-50 border-green-200'
                            }`}>
                            <div className="text-3xl font-bold">
                              <span className={
                                state.analysisResult.brakeStatus === 'Bad' ? 'text-red-600' : 'text-green-600'
                              }>
                                {state.analysisResult.brakeStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* REGULAR DAMAGE DISPLAY */
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-red-50 border border-red-100 p-2 rounded">
                            <span className="block text-lg font-bold text-red-600 leading-none">{state.analysisResult.dents || 0}</span>
                            <span className="text-[10px] text-red-400 font-bold uppercase">Dents</span>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-100 p-2 rounded">
                            <span className="block text-lg font-bold text-yellow-600 leading-none">{state.analysisResult.scratches || 0}</span>
                            <span className="text-[10px] text-yellow-500 font-bold uppercase">Scratch</span>
                          </div>
                          <div className="bg-purple-50 border border-purple-100 p-2 rounded">
                            <span className="block text-lg font-bold text-purple-600 leading-none">{state.analysisResult.cracks || 0}</span>
                            <span className="text-[10px] text-purple-400 font-bold uppercase">Marks</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}