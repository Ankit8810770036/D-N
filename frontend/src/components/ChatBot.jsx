import { useState, useRef, useEffect } from 'react'
import api from '../services/api'
import { getErrorMessage } from '../utils/errors'
import { Sparkles, ArrowRight, CheckCircle2, XCircle, Utensils, Flame, Scale, Check, X, RefreshCw, Camera, Image as ImageIcon, RotateCw, AlertTriangle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const DEFAULT_QUICK_QUESTIONS = [
    "⚡ High-protein Indian meal ideas",
    "🔥 How to hit my daily calorie target?",
    "🥗 Healthy evening snacks under 150 kcal",
    "💧 Tips to improve daily hydration",
    "⚖️ Best habits for healthy weight loss"
]

/**
 * Extracts bot text and dynamic follow-up suggestion chips
 */
function parseBotMessage(text) {
    if (!text || typeof text !== 'string') return { mainText: text || '', suggestions: [] }

    const suggestionIndex = text.search(/(?:Suggestions|Suggested next questions|Next Questions):/i)
    if (suggestionIndex !== -1) {
        const mainText = text.substring(0, suggestionIndex).trim()
        const suggestionsBlock = text.substring(suggestionIndex)
        
        // Extract bullet points
        const lines = suggestionsBlock.split('\n')
        const suggestions = lines
            .filter(l => l.trim().startsWith('•') || l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\./.test(l.trim()))
            .map(l => l.replace(/^[•\-*\d.]+\s*/, '').replace(/\[|\]/g, '').trim())
            .filter(l => l.length > 3 && l.length < 120)

        return { mainText: mainText || text, suggestions }
    }

    return { mainText: text, suggestions: [] }
}

export default function ChatBot() {
    const queryClient = useQueryClient()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { 
            id: 1, 
            type: 'bot', 
            text: 'Namaste! I am **NutriBot**, your Clinical Diet & Nutrition Assistant.\n\nAsk me anything about your diet, macronutrients, calorie targets, or upload a photo of your food for instant calorie estimation!',
            suggestions: DEFAULT_QUICK_QUESTIONS.slice(0, 3)
        },
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null)
    const [loggingFoodId, setLoggingFoodId] = useState(null)
    const endOfMessagesRef = useRef(null)
    const fileInputRef = useRef(null)
    const cameraFallbackInputRef = useRef(null)

    // Camera viewfinder state
    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const [cameraStream, setCameraStream] = useState(null)
    const [facingMode, setFacingMode] = useState('environment') // 'environment' (back) or 'user' (front)
    const [capturedPhoto, setCapturedPhoto] = useState(null)
    const [cameraError, setCameraError] = useState(null)
    const videoRef = useRef(null)

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom()
        } else {
            // Clean up camera stream if chatbot is closed
            stopCamera()
        }
    }, [messages, isOpen])

    // Manage camera stream attachment to video element
    useEffect(() => {
        if (isCameraOpen && cameraStream && videoRef.current) {
            videoRef.current.srcObject = cameraStream
            videoRef.current.play().catch(e => console.warn('Video play interrupted:', e))
        }
    }, [isCameraOpen, cameraStream, capturedPhoto])

    const startCamera = async (mode = facingMode) => {
        setCameraError(null)
        setCapturedPhoto(null)
        setIsCameraOpen(true)

        // Stop any active stream first
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop())
            setCameraStream(null)
        }

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported on this browser.')
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: mode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            })

            setCameraStream(stream)
        } catch (err) {
            console.warn('Live camera access failed:', err)
            setCameraError(err.name === 'NotAllowedError' ? 'Camera permission was denied.' : (err.message || 'Camera is unavailable.'))
        }
    }

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop())
            setCameraStream(null)
        }
        setIsCameraOpen(false)
        setCapturedPhoto(null)
        setCameraError(null)
    }

    const capturePhoto = () => {
        if (!videoRef.current) return
        const video = videoRef.current
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
        const base64 = dataUrl.split(',')[1]
        setCapturedPhoto({
            data: base64,
            mimeType: 'image/jpeg',
            previewUrl: dataUrl,
        })
    }

    const confirmPhoto = () => {
        if (capturedPhoto) {
            setSelectedImage(capturedPhoto)
            toast.success('Food photo attached! 📸')
        }
        stopCamera()
    }

    const retakePhoto = () => {
        setCapturedPhoto(null)
    }

    const toggleFacingMode = () => {
        const nextMode = facingMode === 'environment' ? 'user' : 'environment'
        setFacingMode(nextMode)
        startCamera(nextMode)
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.')
            return
        }

        const reader = new FileReader()
        reader.onload = () => {
            setSelectedImage({
                data: reader.result.split(',')[1],
                mimeType: file.type,
                previewUrl: reader.result
            })
        }
        reader.readAsDataURL(file)
    }

    const sendUserQuery = async (queryText, attachedImage = null) => {
        const textToSend = (queryText || '').trim()
        if ((!textToSend && !attachedImage) || isLoading) return

        setInput('')
        setSelectedImage(null)
        if (fileInputRef.current) fileInputRef.current.value = ''

        const newMessages = [...messages, {
            id: Date.now(),
            type: 'user',
            text: textToSend,
            image: attachedImage?.previewUrl
        }]
        setMessages(newMessages)
        setIsLoading(true)

        try {
            const payload = { message: textToSend }
            if (attachedImage) {
                payload.image = attachedImage.data
                payload.mime_type = attachedImage.mimeType
            }

            const response = await api.post('/chat', payload)
            if (response.data?.reply) {
                const { mainText, suggestions } = parseBotMessage(response.data.reply)
                const detectedFood = response.data?.detected_food || null

                setMessages([...newMessages, { 
                    id: Date.now() + 1, 
                    type: 'bot', 
                    text: mainText,
                    suggestions: suggestions.length > 0 ? suggestions : DEFAULT_QUICK_QUESTIONS.slice(0, 2),
                    detectedFood: detectedFood,
                    foodStatus: detectedFood ? 'pending' : null // 'pending' | 'logging' | 'logged' | 'declined'
                }])
            } else {
                setMessages([...newMessages, { 
                    id: Date.now() + 1, 
                    type: 'bot', 
                    text: 'I received your question. How else may I assist your nutrition plan today?' 
                }])
            }
        } catch (error) {
            console.error('Chat error:', error);
            if (error.response?.status === 403 && error.response?.data?.limit_reached) {
                const isPrem = error.response?.data?.is_premium;
                const limitMsg = error.response?.data?.error || 'Daily AI query limit reached.';
                const actionLink = !isPrem ? '<br/><a href="/subscription" class="text-emerald-600 dark:text-emerald-400 underline font-bold mt-1 inline-block">Upgrade to Premium for 20 daily queries →</a>' : '';
                setMessages([...newMessages, {
                    id: Date.now() + 1,
                    type: 'bot',
                    text: `<b>⚠️ AI Quota Notice</b><br/>${limitMsg}${actionLink}`
                }]);
            } else {
                const errMsg = getErrorMessage(error, 'Unable to connect to NutriBot. Please check your connection.');
                setMessages([...newMessages, { 
                    id: Date.now() + 1, 
                    type: 'bot', 
                    text: `⚠️ ${errMsg}` 
                }]);
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleFoodAction = async (msgId, food, didEat) => {
        if (!food || loggingFoodId) return

        if (!didEat) {
            // User declined logging
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, foodStatus: 'declined' } : m))
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                text: "👍 Understood! I won't log this to your daily intake. Let me know if you need healthy recipe ideas or calorie comparisons for anything else!",
                suggestions: DEFAULT_QUICK_QUESTIONS.slice(0, 2)
            }])
            return
        }

        // User confirmed eating: Log food and adjust meal plan
        setLoggingFoodId(msgId)
        try {
            const res = await api.post('/chat/log-food', {
                food_name: food.name || 'Analyzed Meal',
                calories: food.calories || 250,
                protein: food.protein || 0,
                carbs: food.carbs || 0,
                fat: food.fat || 0,
                portion: food.portion || '1 serving',
                adjust_meal_plan: true
            })

            // Invalidate React Query cache so Dashboard, Planner, Reports, and Tokens reflect updated calories
            queryClient.invalidateQueries({ queryKey: ['mealPlan'] })
            queryClient.invalidateQueries({ queryKey: ['progress'] })
            queryClient.invalidateQueries({ queryKey: ['profile'] })
            queryClient.invalidateQueries({ queryKey: ['summary'] })
            queryClient.invalidateQueries({ queryKey: ['userTokens'] })
            queryClient.invalidateQueries({ queryKey: ['tokens'] })
            queryClient.invalidateQueries({ queryKey: ['groceryList'] })

            toast.success(`Logged ${food.name} (+${food.calories} kcal) & updated your plan!`, {
                icon: '🍽️',
                duration: 2000
            })

            // Update card status
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, foodStatus: 'logged', logResult: res.data } : m))

            // Add bot confirmation message with adjustments
            const compNote = res.data?.compensation_msg ? `\n\n⚖️ **Meal Plan Compensation:** ${res.data.compensation_msg}` : ''
            const remainingBudget = res.data?.remaining_today !== undefined ? `\n🎯 **Remaining Daily Budget:** **${res.data.remaining_today} kcal**` : ''
            
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'bot',
                text: `🎉 **Successfully Logged to Today's Diet!**\n\n• **Item:** ${res.data?.food_name || food.name} (+${res.data?.calories || food.calories} kcal)\n• **Today's Consumed:** ${res.data?.consumed_today || 'Updated'} / ${res.data?.target_calories || 'Target'} kcal${remainingBudget}${compNote}\n\n🪙 *+10 HealthCoins awarded for tracking!*`,
                suggestions: [
                    "📊 Show my remaining calories for today",
                    "🥗 What should I eat for dinner?",
                    "💧 Remind me about my daily water goal"
                ]
            }])
        } catch (error) {
            console.error('Food logging error:', error)
            toast.error(getErrorMessage(error, 'Failed to log food. Please try again.'))
        } finally {
            setLoggingFoodId(null)
        }
    }

    const handleSend = (e) => {
        e.preventDefault()
        sendUserQuery(input, selectedImage)
    }

    const handleSuggestionClick = (question) => {
        sendUserQuery(question)
    }

    return (
        <div className="fixed bottom-20 sm:bottom-6 right-3.5 sm:right-6 z-40 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white/95 dark:bg-gray-850 backdrop-blur-xl border border-white/50 dark:border-gray-700 shadow-2xl rounded-2xl flex flex-col overflow-hidden mb-3 transition-all duration-300 transform origin-bottom-right max-h-[82dvh] sm:max-h-[75dvh]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#1b4332] via-[#2d6a4f] to-[#40916c] p-3.5 sm:p-4 text-white flex justify-between items-center z-10 relative shadow-sm flex-shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
                                🥑
                            </div>
                            <div>
                                <h3 className="font-bold text-sm leading-tight text-white flex items-center gap-1.5">
                                    NutriBot AI
                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-400/30 border border-emerald-300/40 text-emerald-100 font-semibold tracking-wide">CLINICAL AI</span>
                                </h3>
                                <p className="text-[10px] text-emerald-100/90 font-medium">Diet &amp; Nutrition Intelligence</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white focus:outline-none p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            aria-label="Close Chat"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto bg-slate-50/70 dark:bg-gray-900/60 flex flex-col gap-3.5 h-72 sm:h-96">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div
                                    className={`relative max-w-[90%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${msg.type === 'user'
                                        ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-br-sm shadow-md'
                                        : 'bg-white dark:bg-gray-800 text-slate-800 dark:text-gray-100 rounded-bl-sm shadow-sm border border-slate-200/80 dark:border-gray-700'
                                        }`}
                                >
                                    {msg.image && (
                                        <img src={msg.image} alt="uploaded food" className="max-w-full rounded-lg mb-2 shadow-sm max-h-40 object-cover" />
                                    )}
                                    <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                                </div>

                                {/* Food Analysis & Interactive Calorie Logging Card */}
                                {msg.type === 'bot' && msg.detectedFood && (
                                    <div className="mt-2.5 w-full max-w-[95%] bg-white dark:bg-gray-800/90 rounded-2xl p-3 border border-emerald-200/80 dark:border-emerald-800/50 shadow-sm">
                                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-gray-700">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                                    <Utensils className="w-3.5 h-3.5" />
                                                </span>
                                                <div className="truncate">
                                                    <h4 className="text-xs font-bold text-slate-800 dark:text-gray-100 truncate">
                                                        {msg.detectedFood.name}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 dark:text-gray-400 truncate">
                                                        Portion: {msg.detectedFood.portion || '1 serving'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                                <Flame className="w-3 h-3 text-amber-500" />
                                                {msg.detectedFood.calories} kcal
                                            </span>
                                        </div>

                                        {/* Macro breakdown pills */}
                                        <div className="grid grid-cols-3 gap-1.5 py-2">
                                            <div className="bg-slate-50 dark:bg-gray-900/70 p-1.5 rounded-lg text-center border border-slate-100 dark:border-gray-800">
                                                <span className="text-[9px] text-slate-400 block font-medium">Protein</span>
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{msg.detectedFood.protein}g</span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-gray-900/70 p-1.5 rounded-lg text-center border border-slate-100 dark:border-gray-800">
                                                <span className="text-[9px] text-slate-400 block font-medium">Carbs</span>
                                                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">{msg.detectedFood.carbs}g</span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-gray-900/70 p-1.5 rounded-lg text-center border border-slate-100 dark:border-gray-800">
                                                <span className="text-[9px] text-slate-400 block font-medium">Fat</span>
                                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{msg.detectedFood.fat}g</span>
                                            </div>
                                        </div>

                                        {/* Interactive Confirmation Section */}
                                        {msg.foodStatus === 'pending' && (
                                            <div className="mt-1 pt-2 border-t border-dashed border-slate-200 dark:border-gray-700">
                                                <p className="text-[11px] font-semibold text-slate-700 dark:text-gray-200 mb-2 flex items-center gap-1">
                                                    ❓ Did you eat this food today?
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFoodAction(msg.id, msg.detectedFood, true)}
                                                        disabled={loggingFoodId === msg.id}
                                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
                                                    >
                                                        {loggingFoodId === msg.id ? (
                                                            <>
                                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                                                <span>Logging...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Check className="w-3.5 h-3.5" />
                                                                <span>Yes, I ate this! 🍽️</span>
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFoodAction(msg.id, msg.detectedFood, false)}
                                                        disabled={loggingFoodId === msg.id}
                                                        className="bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-300 text-[11px] font-semibold py-1.5 px-3 rounded-xl transition-colors disabled:opacity-50"
                                                    >
                                                        No, just asking
                                                    </button>
                                                </div>
                                                <p className="text-[9px] text-slate-400 dark:text-gray-500 mt-1.5 italic text-center">
                                                    *Automatically balances today's upcoming meals so you stay on target
                                                </p>
                                            </div>
                                        )}

                                        {msg.foodStatus === 'logged' && (
                                            <div className="mt-1 pt-2 border-t border-slate-100 dark:border-gray-700 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                <span>Added to daily calories &amp; meal plan compensated</span>
                                            </div>
                                        )}

                                        {msg.foodStatus === 'declined' && (
                                            <div className="mt-1 pt-2 border-t border-slate-100 dark:border-gray-700 flex items-center gap-1.5 text-slate-400 dark:text-gray-500 text-[11px]">
                                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>Not logged to daily intake</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Dynamic Clickable Suggestions / Prompt Chips */}
                                {msg.type === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                                    <div className="mt-2 flex flex-col gap-1.5 w-full max-w-[95%] pl-1">
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                            <Sparkles className="w-3 h-3 text-amber-500" /> Suggested questions:
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {msg.suggestions.map((sug, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => handleSuggestionClick(sug)}
                                                    disabled={isLoading}
                                                    className="text-left text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between gap-1.5 group"
                                                >
                                                    <span className="line-clamp-2">{sug}</span>
                                                    <ArrowRight className="w-3 h-3 text-emerald-600 dark:text-emerald-400 opacity-60 group-hover:opacity-100 shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-400 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-200/80 dark:border-gray-700 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                                    <span className="text-[11px] text-slate-400 ml-1 font-medium">NutriBot is analyzing food &amp; nutrition...</span>
                                </div>
                            </div>
                        )}
                        <div ref={endOfMessagesRef} />
                    </div>

                    {/* Image Preview Area */}
                    {selectedImage && (
                        <div className="px-3.5 py-2 bg-slate-50 dark:bg-gray-800 border-t border-slate-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <img src={selectedImage.previewUrl} alt="preview" className="h-10 w-10 object-cover rounded-lg shadow-sm border border-slate-200 dark:border-gray-600" />
                                <div>
                                    <span className="text-xs text-slate-700 dark:text-gray-300 font-bold block">Food photo attached</span>
                                    <span className="text-[10px] text-slate-400 dark:text-gray-400">Tap send to estimate nutrition &amp; calories</span>
                                </div>
                            </div>
                            <button type="button" onClick={() => { setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; if (cameraFallbackInputRef.current) cameraFallbackInputRef.current.value = ''; }} className="text-slate-400 dark:text-gray-500 hover:text-rose-500 transition-colors p-1" title="Remove image">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Camera Viewfinder Overlay */}
                    {isCameraOpen && (
                        <div className="absolute inset-0 z-30 bg-slate-950/95 text-white flex flex-col justify-between p-3.5 sm:p-4 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md">
                            {/* Top Bar */}
                            <div className="flex items-center justify-between z-10 pb-1">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                                    <span className="text-xs font-bold tracking-wide">
                                        {capturedPhoto ? 'Review Food Photo 📸' : 'Live Camera Viewfinder'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!capturedPhoto && !cameraError && (
                                        <button
                                            type="button"
                                            onClick={toggleFacingMode}
                                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                            title="Switch Camera (Front/Back)"
                                            aria-label="Switch Camera"
                                        >
                                            <RotateCw className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={stopCamera}
                                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                        title="Close Camera"
                                        aria-label="Close Camera"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Viewfinder / Captured Display */}
                            <div className="relative flex-1 my-2 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10 shadow-inner">
                                {cameraError ? (
                                    <div className="p-4 text-center space-y-3 max-w-xs">
                                        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
                                            📷
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-white mb-1">Camera Notice</h4>
                                            <p className="text-[11px] text-slate-300 leading-relaxed">
                                                {cameraError} You can take a photo using your device camera directly.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                stopCamera();
                                                cameraFallbackInputRef.current?.click();
                                            }}
                                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                                        >
                                            <Camera className="w-4 h-4" />
                                            <span>Open Device Camera</span>
                                        </button>
                                    </div>
                                ) : capturedPhoto ? (
                                    <img
                                        src={capturedPhoto.previewUrl}
                                        alt="Captured plate"
                                        className="w-full h-full object-cover rounded-xl"
                                    />
                                ) : (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                        {/* Viewfinder Target Reticle */}
                                        <div className="absolute inset-4 border-2 border-dashed border-white/30 rounded-2xl pointer-events-none flex flex-col items-center justify-between p-3">
                                            <span className="text-[10px] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white/90 font-medium">
                                                Position food inside frame
                                            </span>
                                            <span className="text-[9px] text-white/60 bg-black/40 px-2 py-0.5 rounded-full">
                                                Tap shutter button to snap
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Bottom Controls */}
                            <div className="pt-1 z-10">
                                {capturedPhoto ? (
                                    <div className="flex items-center gap-2.5 w-full">
                                        <button
                                            type="button"
                                            onClick={retakePhoto}
                                            className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span>Retake</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={confirmPhoto}
                                            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-xs font-bold text-white shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-1.5 transition-all"
                                        >
                                            <Check className="w-4 h-4 stroke-[3]" />
                                            <span>Use Photo</span>
                                        </button>
                                    </div>
                                ) : (
                                    !cameraError && (
                                        <div className="flex items-center justify-between w-full px-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    stopCamera();
                                                    fileInputRef.current?.click();
                                                }}
                                                className="text-xs text-white/70 hover:text-white flex flex-col items-center gap-1 transition-colors px-2 py-1"
                                                title="Choose existing photo from gallery"
                                            >
                                                <ImageIcon className="w-5 h-5 text-emerald-400" />
                                                <span className="text-[10px]">Gallery</span>
                                            </button>

                                            {/* Shutter Button */}
                                            <button
                                                type="button"
                                                onClick={capturePhoto}
                                                className="w-14 h-14 rounded-full p-1 border-4 border-white/90 hover:border-emerald-400 flex items-center justify-center bg-white/20 active:scale-90 transition-all shadow-xl shadow-black/50 group"
                                                title="Take snapshot"
                                                aria-label="Take snapshot"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-white group-hover:bg-emerald-400 transition-colors shadow-inner" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    stopCamera();
                                                    cameraFallbackInputRef.current?.click();
                                                }}
                                                className="text-xs text-white/70 hover:text-white flex flex-col items-center gap-1 transition-colors px-2 py-1"
                                                title="Open native camera app"
                                            >
                                                <Camera className="w-5 h-5 text-teal-300" />
                                                <span className="text-[10px]">Native</span>
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-2 sm:p-2.5 bg-white dark:bg-gray-800 border-t border-slate-100 dark:border-gray-700 flex gap-1 sm:gap-1.5 items-center">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={cameraFallbackInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        
                        {/* Camera Button */}
                        <button
                            type="button"
                            onClick={() => startCamera('environment')}
                            className="text-slate-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-gray-700 focus:outline-none shrink-0"
                            title="Open Camera to snap food photo"
                            aria-label="Open Camera"
                        >
                            <Camera className="w-5 h-5" />
                        </button>

                        {/* Gallery Upload Button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-slate-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-gray-700 focus:outline-none shrink-0"
                            title="Upload food photo from gallery"
                            aria-label="Upload food photo from gallery"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a diet question or snap food photo..."
                            className="flex-1 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-600 text-slate-900 dark:text-white text-xs sm:text-sm rounded-full px-3 py-2 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-gray-500 min-w-0"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || (!input.trim() && !selectedImage)}
                            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none shadow-md shrink-0 focus:outline-none"
                            aria-label="Send query"
                        >
                            <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative w-15 h-15 sm:w-16 sm:h-16 min-w-[58px] min-h-[58px] sm:min-w-[64px] sm:min-h-[64px] rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 ${isOpen
                    ? 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-200 rotate-90 scale-90 hover:bg-slate-200 shadow-md'
                    : 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl shadow-emerald-900/40 ring-2 ring-white/20'
                    }`}
                aria-label="Toggle AI Nutrition Chatbot"
            >
                {/* Active Glowing Dot when closed */}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-[#081c15]"></span>
                    </span>
                )}

                {isOpen ? (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="flex flex-col items-center justify-center">
                        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                )}
            </button>
        </div>
    )
}

