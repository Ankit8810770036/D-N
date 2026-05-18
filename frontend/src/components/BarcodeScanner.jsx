import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Scan, AlertCircle, Loader2 } from 'lucide-react';
import { fetchProductByBarcode } from '../services/openFoodFacts';
import toast from 'react-hot-toast';

const BarcodeScanner = ({ isOpen, onClose, onDetected }) => {
    const [loading, setLoading] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);

    useEffect(() => {
        let html5QrCode;

        if (isOpen) {
            setError(null);
            setCameraReady(false);

            const startScanner = async () => {
                try {
                    html5QrCode = new Html5Qrcode("reader");
                    const config = { fps: 10, qrbox: { width: 250, height: 180 } };

                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        async (decodedText) => {
                            if (loading) return;
                            setLoading(true);
                            try {
                                const productData = await fetchProductByBarcode(decodedText);
                                onDetected(productData);
                                onClose();
                            } catch (error) {
                                toast.error("Product not found");
                                setLoading(false);
                            }
                        }
                    );
                    setCameraReady(true);
                    scannerRef.current = html5QrCode;
                } catch (err) {
                    console.error("Scanner error:", err);
                    setError("Could not access camera. Please ensure permissions are granted.");
                    setLoading(false);
                }
            };

            const timer = setTimeout(startScanner, 500);
            return () => {
                clearTimeout(timer);
                if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().then(() => {
                        html5QrCode.clear();
                    }).catch(err => console.warn("Stop error", err));
                }
            };
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                            <Scan className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-black text-gray-900 uppercase tracking-tight">Food Scanner</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global Label Search</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-6 text-center space-y-6">
                    <div id="reader" className="overflow-hidden rounded-2xl border-2 border-gray-100 bg-gray-50 aspect-video relative flex items-center justify-center min-h-[200px]">
                        {loading && (
                            <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                                <p className="text-sm font-bold text-gray-700 tracking-tight">Identifying Product...</p>
                            </div>
                        )}
                        {!cameraReady && !error && !loading && (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 text-emerald-200 animate-spin" />
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Waking up camera...</p>
                            </div>
                        )}
                        {error && (
                            <div className="p-6 flex flex-col items-center gap-3 text-red-500">
                                <AlertCircle className="w-10 h-10" />
                                <p className="text-xs font-bold leading-tight">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="text-[10px] underline uppercase tracking-widest font-black"
                                >
                                    Try refreshing page
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col gap-4 text-left">
                        <div className="flex items-start gap-3">
                            <Camera className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-emerald-900 uppercase tracking-tight mb-1">Scanning Tips</p>
                                <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
                                    Keep the barcode within the frame. Avoid glare for faster detection.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-emerald-100">
                            <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest mb-2 text-center">Or Enter Barcode Manually</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="8901234567890"
                                    className="flex-1 bg-white border border-emerald-200 rounded-xl px-4 py-2 text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-emerald-200"
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && e.target.value) {
                                            const code = e.target.value;
                                            setLoading(true);
                                            try {
                                                const productData = await fetchProductByBarcode(code);
                                                onDetected(productData);
                                                onClose();
                                            } catch (error) {
                                                toast.error("Product not found");
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-white border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-xs shadow-sm"
                    >
                        Close Scanner
                    </button>
                </div>
            </div>

            <style>{`
                #reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    border-radius: 16px !important;
                }
                #reader__scan_region {
                    border: none !important;
                }
            `}</style>
        </div>
    );
};

export default BarcodeScanner;
