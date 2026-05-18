import { useState, useRef, useEffect } from 'react'
import api from '../services/api'

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', text: 'Hi there! I am your Diet & Nutrition Assistant. How can I help you today?' },
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null)
    const endOfMessagesRef = useRef(null)
    const fileInputRef = useRef(null)

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom()
        }
    }, [messages, isOpen])

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

    const handleSend = async (e) => {
        e.preventDefault()
        if ((!input.trim() && !selectedImage) || isLoading) return

        const userMsg = input.trim()
        const attachedImage = selectedImage

        setInput('')
        setSelectedImage(null)
        if (fileInputRef.current) fileInputRef.current.value = ''

        const newMessages = [...messages, {
            id: Date.now(),
            type: 'user',
            text: userMsg,
            image: attachedImage?.previewUrl
        }]
        setMessages(newMessages)
        setIsLoading(true)

        try {
            const payload = { message: userMsg }
            if (attachedImage) {
                payload.image = attachedImage.data
                payload.mime_type = attachedImage.mimeType
            }

            const response = await api.post('/chat', payload)
            if (response.data?.reply) {
                setMessages([...newMessages, { id: Date.now(), type: 'bot', text: response.data.reply }])
            } else {
                setMessages([...newMessages, { id: Date.now(), type: 'bot', text: 'Sorry, I received an unexpected response.' }])
            }
        } catch (error) {
            console.error('Chat error:', error);
            if (error.response?.status === 403 && error.response?.data?.limit_reached) {
                setMessages([...newMessages, {
                    id: Date.now(),
                    type: 'bot',
                    text: `<b>AI Limit Reached!</b><br/>You have used your 5 daily queries. <a href="/subscription" class="text-amber-600 underline font-bold">Upgrade to Premium</a> for unlimited AI nutrition guidance!`
                }]);
            } else {
                setMessages([...newMessages, { id: Date.now(), type: 'bot', text: 'Oops! I am having trouble connecting to the network right now.' }]);
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="w-80 sm:w-96 bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl border border-white/50 dark:border-gray-700 shadow-2xl rounded-2xl flex flex-col overflow-hidden mb-4 transition-all duration-300 transform origin-bottom-right" style={{ maxHeight: 'calc(100vh - 100px)' }}>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#2d6a4f] to-[#40916c] p-4 text-white flex justify-between items-center z-10 relative shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xl">
                                🥑
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm leading-tight">Diet Assistant</h3>
                                <p className="text-xs text-green-100">AI Powered</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:text-green-200 focus:outline-none p-1 rounded-md hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-[#f0fdf7]/30 dark:bg-gray-900/50 flex flex-col gap-3" style={{ height: '400px' }}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`relative max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.type === 'user'
                                        ? 'bg-gradient-to-br from-[#2d6a4f] to-[#40916c] text-white rounded-br-sm shadow-md'
                                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm shadow-sm border border-gray-100 dark:border-gray-600'
                                        }`}
                                >
                                    {/* Small arrow marker pointing towards sender */}
                                    <div className={`absolute top-0 w-3 h-3 ${msg.type === 'user'
                                        ? '-right-1.5 bg-[#40916c] transform rotate-45 opacity-0' // Optional arrow
                                        : '-left-1.5 bg-white dark:bg-gray-700 border-l border-t border-gray-100 dark:border-gray-600 transform -rotate-45'
                                        }`}></div>
                                    {msg.image && (
                                        <img src={msg.image} alt="uploaded" className="max-w-full rounded-md mb-2 shadow-sm" />
                                    )}
                                    <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-600 flex items-center gap-1.5 relative">
                                    <div className="w-1.5 h-1.5 bg-[#40916c]/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-[#40916c]/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-[#40916c]/60 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                        <div ref={endOfMessagesRef} />
                    </div>

                    {/* Image Preview Area */}
                    {selectedImage && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <img src={selectedImage.previewUrl} alt="preview" className="h-10 w-10 object-cover rounded shadow-sm border border-gray-200 dark:border-gray-600" />
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Image attached</span>
                            </div>
                            <button type="button" onClick={() => { setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    )}

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2 items-center">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-gray-400 hover:text-[#2d6a4f] dark:hover:text-green-400 transition-colors p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                            title="Upload an image of your food"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a question or upload food..."
                            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 focus:border-[#2d6a4f] outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 min-w-0"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || (!input.trim() && !selectedImage)}
                            className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#2d6a4f] to-[#1b4332] text-white rounded-full hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none shadow-md shrink-0 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:ring-offset-2"
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
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#2d6a4f]/30 ${isOpen
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rotate-90 scale-90 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-md'
                    : 'bg-gradient-to-br from-[#2d6a4f] via-[#1b4332] to-[#081c15] text-white'
                    }`}
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>
        </div>
    )
}
