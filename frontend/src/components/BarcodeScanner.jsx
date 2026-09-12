import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Scan, AlertCircle, Loader2, RefreshCw, SwitchCamera, Search } from 'lucide-react';
import { fetchProductByBarcode } from '../services/openFoodFacts';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ isOpen, onClose, onDetected }) => {
    const [loading, setLoading] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [error, setError] = useState(null);
    const [manualCode, setManualCode] = useState('');
    const [cameras, setCameras] = useState([]);
    const [selectedCameraIndex, setSelectedCameraIndex] = useState(0);

    const scannerRef = useRef(null);
    const isScanningRef = useRef(false);
    const isProcessingRef = useRef(false);

    // Process a detected barcode
    const handleBarcodeCode = async (rawCode) => {
        if (isProcessingRef.current || loading) return;
        const code = String(rawCode || '').trim();
        if (!code) return;

        isProcessingRef.current = true;
        setLoading(true);

        try {
            if (navigator.vibrate) {
                navigator.vibrate(100);
            }
        } catch {
            // Ignore vibration errors
        }

        try {
            const productData = await fetchProductByBarcode(code);
            if (productData.found) {
                toast.success(`Found: ${productData.name} (${productData.calories} kcal)`);
            } else {
                toast('Barcode detected! Add nutritional details to save.', { icon: '🏷️' });
            }
            onDetected(productData);
            onClose();
        } catch (err) {
            toast.error(err.message || 'Product lookup failed');
            setLoading(false);
            isProcessingRef.current = false;
        }
    };

    // Stop scanner safely
    const stopScanner = async () => {
        if (scannerRef.current && isScanningRef.current) {
            try {
                await scannerRef.current.stop();
            } catch (err) {
                console.warn('Scanner stop error:', err);
            }
            try {
                scannerRef.current.clear();
            } catch (err) {
                console.warn('Scanner clear error:', err);
            }
            isScanningRef.current = false;
        }
    };

    // Start scanner with fallback strategies
    const startScanner = async (cameraIndex = 0) => {
        setError(null);
        setCameraReady(false);
        await stopScanner();

        const readerElement = document.getElementById('barcode-reader');
        if (!readerElement) return;

        try {
            const html5QrCode = new Html5Qrcode('barcode-reader');
            scannerRef.current = html5QrCode;

            // Fetch available video devices
            let availableDevices = cameras;
            if (availableDevices.length === 0) {
                try {
                    availableDevices = await Html5Qrcode.getCameras();
                    setCameras(availableDevices || []);
                } catch {
                    // Ignore getCameras error, will use facingMode
                }
            }

            const config = {
                fps: 15,
                qrbox: { width: 260, height: 180 },
                aspectRatio: 1.333333,
            };

            const qrCodeSuccessCallback = (decodedText) => {
                handleBarcodeCode(decodedText);
            };

            // Attempt 1: If specific camera selected
            if (availableDevices && availableDevices.length > 0 && availableDevices[cameraIndex]?.id) {
                try {
                    await html5QrCode.start(
                        availableDevices[cameraIndex].id,
                        config,
                        qrCodeSuccessCallback,
                        () => {} // silent on frame without barcode
                    );
                    isScanningRef.current = true;
                    setCameraReady(true);
                    return;
                } catch (camErr) {
                    console.warn('Failed with camera device ID, falling back to facingMode...', camErr);
                }
            }

            // Attempt 2: Environment (Back camera)
            try {
                await html5QrCode.start(
                    { facingMode: 'environment' },
                    config,
                    qrCodeSuccessCallback,
                    () => {}
                );
                isScanningRef.current = true;
                setCameraReady(true);
                return;
            } catch (envErr) {
                console.warn('Back camera not available, trying user/front camera...', envErr);
            }

            // Attempt 3: User (Front camera / Desktop webcam)
            await html5QrCode.start(
                { facingMode: 'user' },
                config,
                qrCodeSuccessCallback,
                () => {}
            );
            isScanningRef.current = true;
            setCameraReady(true);

        } catch (err) {
            console.error('Camera initialization failed:', err);
            isScanningRef.current = false;
            setCameraReady(false);
            if (err?.name === 'NotAllowedError' || String(err).includes('NotAllowedError')) {
                setError('Camera permission denied. Please allow camera access in your browser settings.');
            } else if (err?.name === 'NotFoundError' || String(err).includes('NotFoundError')) {
                setError('No camera found on this device. You can still enter barcodes manually below.');
            } else {
                setError('Could not access camera. Please check permissions or enter barcode manually.');
            }
        }
    };

    // Cycle through available cameras if user has multiple (e.g. mobile front/back)
    const switchCamera = async () => {
        if (cameras.length <= 1) return;
        const nextIndex = (selectedCameraIndex + 1) % cameras.length;
        setSelectedCameraIndex(nextIndex);
        await startScanner(nextIndex);
    };

    // Manage lifecycle, body scroll lock, and ESC key listener
    useEffect(() => {
        let timer;
        if (isOpen) {
            isProcessingRef.current = false;
            setLoading(false);
            setManualCode('');

            // Prevent background page from scrolling under modal
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);

            // Delay initialization until portal is fully mounted in DOM
            timer = setTimeout(() => {
                startScanner(selectedCameraIndex);
            }, 250);

            return () => {
                clearTimeout(timer);
                document.body.style.overflow = originalOverflow;
                window.removeEventListener('keydown', handleKeyDown);
                stopScanner();
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            style={{ margin: 0, padding: '16px' }}
        >
            <div
                className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border border-gray-100 dark:border-gray-800 max-h-[90vh] my-auto animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-sm shadow-emerald-500/20">
                            <Scan className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="font-black text-gray-900 dark:text-white text-base sm:text-lg tracking-tight">Smart Food Scanner</h2>
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">OpenFoodFacts Nutrition Database</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                        aria-label="Close Scanner"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
                    
                    {/* Viewfinder Container */}
                    <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-emerald-500/30 shadow-inner flex items-center justify-center min-h-[220px] sm:min-h-[250px]">
                        <div id="barcode-reader" className="w-full h-full min-h-[220px] sm:min-h-[250px]"></div>

                        {/* Scanner Laser Overlay when active */}
                        {cameraReady && !loading && (
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                                <div className="w-64 sm:w-72 h-44 border-2 border-dashed border-emerald-400 rounded-xl relative overflow-hidden bg-emerald-500/5">
                                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-scanner-line" />
                                </div>
                                <span className="mt-3 px-3 py-1 bg-black/60 backdrop-blur-sm text-emerald-300 text-[11px] font-bold rounded-full tracking-wide">
                                    Align barcode inside box
                                </span>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="absolute inset-0 bg-gray-900/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 p-4 text-center">
                                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                                <div>
                                    <p className="text-sm font-black text-white tracking-wide">Fetching Nutritional Data...</p>
                                    <p className="text-xs text-emerald-300 font-medium mt-1">Connecting to OpenFoodFacts Global Index</p>
                                </div>
                            </div>
                        )}

                        {/* Camera Starting State */}
                        {!cameraReady && !error && !loading && (
                            <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-2 text-center p-4">
                                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                                <p className="text-xs text-gray-300 font-bold uppercase tracking-wider">Starting camera...</p>
                                <p className="text-[11px] text-gray-400">Please allow camera permissions if prompted</p>
                            </div>
                        )}

                        {/* Camera Error State */}
                        {error && (
                            <div className="absolute inset-0 bg-gray-900/95 p-6 flex flex-col items-center justify-center gap-3 text-center text-red-400 z-20">
                                <AlertCircle className="w-10 h-10 text-red-400" />
                                <p className="text-xs font-bold text-gray-200 leading-snug max-w-xs">{error}</p>
                                <button
                                    onClick={() => startScanner(selectedCameraIndex)}
                                    className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" /> Retry Camera
                                </button>
                            </div>
                        )}

                        {/* Switch Camera Button (if multiple cameras available) */}
                        {cameras.length > 1 && cameraReady && (
                            <button
                                onClick={switchCamera}
                                className="absolute top-3 right-3 z-20 p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-sm text-xs font-bold flex items-center gap-1.5 transition-all"
                                title="Switch Camera"
                            >
                                <SwitchCamera className="w-4 h-4" />
                                <span className="hidden sm:inline">Flip</span>
                            </button>
                        )}
                    </div>

                    {/* Manual Barcode Search Box */}
                    <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/40 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                                    Manual Barcode Entry
                                </span>
                            </div>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">EAN / UPC</span>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleBarcodeCode(manualCode);
                            }}
                            className="flex gap-2"
                        >
                            <input
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="e.g. 3017620422003"
                                className="flex-1 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-700/60 rounded-xl px-3.5 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            />
                            <button
                                type="submit"
                                disabled={!manualCode.trim() || loading}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 shrink-0"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                <span>Lookup</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-xs uppercase tracking-wider"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Custom Styles for Html5Qrcode video element */}
            <style>{`
                #barcode-reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    border-radius: 12px !important;
                }
                #barcode-reader__scan_region {
                    border: none !important;
                }
                #barcode-reader__dashboard {
                    display: none !important;
                }
                @keyframes scanner-laser {
                    0% { top: 0%; opacity: 0.8; }
                    50% { top: 96%; opacity: 1; }
                    100% { top: 0%; opacity: 0.8; }
                }
                .animate-scanner-line {
                    animation: scanner-laser 2.2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default BarcodeScanner;
