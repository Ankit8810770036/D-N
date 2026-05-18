import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Check, X, Crown, Zap, Shield, Star, Sparkles,
    CreditCard, AlertTriangle, ChevronDown, ChevronUp,
    Infinity, Brain, BarChart3, Flame, Lock
} from 'lucide-react';

// ─── Load Razorpay script dynamically ───────────────────────────────────────
function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (document.getElementById('razorpay-sdk')) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.id  = 'razorpay-sdk';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload  = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

// ─── FAQ data ────────────────────────────────────────────────────────────────
const faqs = [
    {
        q: 'Can I cancel anytime?',
        a: 'Yes. You can downgrade back to the Basic plan at any time from this page. Premium features remain active for the current billing cycle.'
    },
    {
        q: 'Is my payment secure?',
        a: 'All payments are processed securely through Razorpay, a PCI-DSS Level 1 certified payment gateway. We never store your card details.'
    },
    {
        q: 'What payment methods are accepted?',
        a: 'Razorpay supports UPI, Credit/Debit cards (Visa, Mastercard, RuPay), Net Banking, and popular wallets like Paytm.'
    },
    {
        q: 'How does the AI chat work on Premium?',
        a: 'Premium members get unlimited queries to our Gemini-powered AI which provides personalized nutrition advice based on your exact health profile.'
    }
];

// ─── Cancel Confirmation Modal ────────────────────────────────────────────────
function CancelModal({ onConfirm, onClose, isLoading }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-scaleIn overflow-y-auto max-h-[90vh]">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Cancel Premium?</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        You'll lose access to AI chat, advanced analytics, specialized diet plans, and all other premium features. Are you sure?
                    </p>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                        >
                            Keep Premium
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
                        >
                            {isLoading ? 'Cancelling...' : 'Yes, Cancel'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Payment Confirmation Modal ───────────────────────────────────────────────
function PaymentModal({ user, onPay, onClose, isLoading }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-3xl shadow-2xl max-w-md w-full overflow-y-auto max-h-[90vh] animate-scaleIn">
                {/* Header */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 text-white text-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">Upgrade to Premium</h3>
                    <p className="text-white/80 mt-1">Unlock your full health potential</p>
                </div>

                {/* Body */}
                <div className="p-8">
                    {/* Price breakdown */}
                    <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-5 mb-6 border border-amber-100 dark:border-amber-500/20">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-600 dark:text-gray-400">Premium Plan (1 month)</span>
                            <span className="font-bold text-gray-900 dark:text-white">₹499</span>
                        </div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-600 dark:text-gray-400">GST (18%)</span>
                            <span className="font-bold text-gray-900 dark:text-white">₹89.82</span>
                        </div>
                        <div className="border-t border-amber-200 dark:border-amber-500/30 pt-3 flex justify-between items-center">
                            <span className="font-bold text-gray-900 dark:text-white">Total</span>
                            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">₹499</span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">* GST included in the listed price</p>
                    </div>

                    {/* What you get */}
                    <ul className="space-y-2 mb-6">
                        {['Unlimited AI Chat Bot', 'Advanced Macro Tracking', 'Keto & Paleo Plans', 'Priority Support', 'Ad-free Experience'].map(f => (
                            <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                {f}
                            </li>
                        ))}
                    </ul>

                    {/* Security note */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-6">
                        <Shield className="w-4 h-4" />
                        <span>Secured by Razorpay · PCI-DSS Level 1 certified</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            id="pay-now-btn"
                            onClick={onPay}
                            disabled={isLoading}
                            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing…
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-4 h-4" />
                                    Pay ₹499
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${open ? 'border-amber-300 bg-amber-50 dark:border-amber-500/50 dark:bg-amber-500/10' : 'border-gray-100 bg-white dark:border-gray-700/50 dark:bg-gray-800/60'}`}
        >
            <button
                onClick={() => setOpen(!open)}
                className="w-full p-5 flex items-center justify-between text-left font-semibold text-gray-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
                {q}
                {open ? <ChevronUp className="w-4 h-4 text-amber-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </button>
            {open && (
                <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {a}
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const Subscription = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isPremium = user?.plan_type === 'premium';

    const [showPayModal, setShowPayModal]     = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [payLoading, setPayLoading]         = useState(false);

    // ── Cancel / Downgrade ──────────────────────────────────────────────────
    const downgradeMutation = useMutation({
        mutationFn: () => api.post('/unsubscribe').then(r => r.data),
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries(['auth_user']);
            setShowCancelModal(false);
            window.location.reload();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to cancel subscription');
            setShowCancelModal(false);
        }
    });

    // ── Verify Payment (Step 2) ──────────────────────────────────────────────
    const verifyMutation = useMutation({
        mutationFn: (payload) => api.post('/payment/verify', payload).then(r => r.data),
        onSuccess: (data) => {
            toast.success(data.message, { duration: 5000 });
            queryClient.invalidateQueries(['auth_user']);
            setShowPayModal(false);
            window.location.reload();
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Payment verification failed. Please contact support.');
        }
    });

    // ── Initiate Payment (Step 1) ─────────────────────────────────────────────
    const handlePay = async () => {
        setPayLoading(true);
        try {
            // 1. Load SDK
            const sdkLoaded = await loadRazorpayScript();
            if (!sdkLoaded) {
                toast.error('Could not load payment gateway. Please check your internet connection.');
                setPayLoading(false);
                return;
            }

            // 2. Create order on server
            const { data } = await api.post('/payment/create-order');

            // 3. Open Razorpay modal
            const options = {
                key:         data.key_id,
                amount:      data.amount,
                currency:    data.currency,
                name:        'Diet & Nutrition Planner',
                description: 'Premium Plan — Monthly Subscription',
                order_id:    data.order_id,
                prefill: {
                    name:  data.user_name,
                    email: data.user_email,
                },
                theme: { color: '#f59e0b' },
                modal: {
                    ondismiss: () => {
                        setPayLoading(false);
                    }
                },
                handler: async (response) => {
                    // 4. Verify payment signature on server
                    await verifyMutation.mutateAsync({
                        razorpay_order_id:   response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature:  response.razorpay_signature,
                    });
                    setPayLoading(false);
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (resp) => {
                toast.error(`Payment failed: ${resp.error.description}`);
                setPayLoading(false);
            });
            rzp.open();
            setShowPayModal(false);

        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not initiate payment. Please try again.');
            setPayLoading(false);
        }
    };

    // ─── Feature lists ──────────────────────────────────────────────────────
    const basicFeatures = [
        { text: 'Standard Meal Plans',       icon: <Zap className="w-4 h-4" />,         included: true  },
        { text: 'Weight & Calories Tracking', icon: <BarChart3 className="w-4 h-4" />,   included: true  },
        { text: 'Global Food Database',       icon: <Check className="w-4 h-4" />,        included: true  },
        { text: 'AI Chat (5 queries/day)',    icon: <Brain className="w-4 h-4" />,        included: true  },
        { text: 'Custom Food Creation',       icon: <X className="w-4 h-4" />,            included: false },
        { text: 'Advanced Macro History',     icon: <X className="w-4 h-4" />,            included: false },
        { text: 'Specialized Diet Plans',     icon: <X className="w-4 h-4" />,            included: false },
        { text: 'Priority AI Support',        icon: <X className="w-4 h-4" />,            included: false },
    ];

    const premiumFeatures = [
        { text: 'Everything in Basic',        icon: <Check className="w-4 h-4" />,        included: true  },
        { text: 'Unlimited AI Chat Bot',      icon: <Infinity className="w-4 h-4" />,     included: true  },
        { text: 'Keto & Paleo Plans',         icon: <Flame className="w-4 h-4" />,        included: true  },
        { text: 'Advanced Macro Tracking',    icon: <BarChart3 className="w-4 h-4" />,   included: true  },
        { text: 'Create Custom Foods',        icon: <Sparkles className="w-4 h-4" />,     included: true  },
        { text: 'Detailed Progress Reports',  icon: <Check className="w-4 h-4" />,        included: true  },
        { text: 'Priority Response Times',    icon: <Zap className="w-4 h-4" />,          included: true  },
        { text: 'Ad-free Experience',         icon: <Shield className="w-4 h-4" />,       included: true  },
    ];

    return (
        <>
            {/* ── Modals ── */}
            {showPayModal && (
                <PaymentModal
                    user={user}
                    onPay={handlePay}
                    onClose={() => setShowPayModal(false)}
                    isLoading={payLoading || verifyMutation.isPending}
                />
            )}
            {showCancelModal && (
                <CancelModal
                    onConfirm={() => downgradeMutation.mutate()}
                    onClose={() => setShowCancelModal(false)}
                    isLoading={downgradeMutation.isPending}
                />
            )}

            <div className="space-y-6 max-w-6xl mx-auto py-8">

                    {/* ── Hero ── */}
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold mb-6">
                            <Star className="w-4 h-4 fill-amber-400" />
                            Trusted by 10,000+ users worldwide
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                            Choose Your Path{' '}
                            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                                to Health
                            </span>
                        </h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                            Unlock elite features, specialized plans, and unlimited AI guidance to reach your fitness goals faster than ever.
                        </p>
                    </div>

                    {/* ── Current Plan Banner (if premium) ── */}
                    {isPremium && (
                        <div className="mb-10 p-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-amber-700 dark:text-amber-300 font-bold">You're on Premium 🎉</p>
                                    {user?.subscribed_at && (
                                        <p className="text-amber-600/80 dark:text-amber-400/70 text-sm">
                                            Active since {new Date(user.subscribed_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    )}
                                    {user?.subscription_expires_at && (
                                        <p className="text-amber-600/80 dark:text-amber-400/70 text-sm">
                                            Renews on {new Date(user.subscription_expires_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                id="cancel-subscription-btn"
                                onClick={() => setShowCancelModal(true)}
                                className="text-sm text-red-400 hover:text-red-300 font-medium border border-red-500/30 hover:border-red-500/60 px-4 py-2 rounded-xl transition-all"
                            >
                                Cancel Subscription
                            </button>
                        </div>
                    )}

                    {/* ── Plan Cards ── */}
                    <div className="grid md:grid-cols-2 gap-6 lg:gap-10 items-start mb-20">

                        {/* Basic Plan */}
                        <div className={`relative rounded-3xl border p-8 transition-all duration-300 ${isPremium ? 'border-gray-200 bg-white/50 dark:border-gray-700 dark:bg-gray-800/50 opacity-75' : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800/80 dark:hover:border-gray-600'}`}>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Basic</h2>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Essential tools to get started</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-emerald-400" />
                                </div>
                            </div>

                            <div className="mb-8">
                                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">Free</span>
                                <span className="text-gray-400 dark:text-gray-500 ml-2">forever</span>
                            </div>

                            <ul className="space-y-3 mb-10">
                                {basicFeatures.map((f, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${f.included ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                                            {f.included ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                        </div>
                                        <span className={`text-sm ${f.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>{f.text}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className={`w-full py-4 rounded-2xl text-center font-bold text-sm ${!isPremium ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-gray-700 dark:text-gray-400 dark:border-transparent cursor-default' : 'bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-500 cursor-default'}`}>
                                {!isPremium ? '✓ Current Plan' : 'Basic Plan'}
                            </div>
                        </div>

                        {/* Premium Plan */}
                        <div className="relative rounded-3xl border-2 border-amber-300 bg-white dark:border-amber-500/50 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 p-8 shadow-2xl shadow-amber-500/10 hover:shadow-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/80 transition-all duration-300">
                            {/* Recommended badge */}
                            <div className="absolute -top-4 right-8 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg tracking-wide">
                                MOST POPULAR
                            </div>

                            {/* Animated shimmer border effect */}
                            <div className="absolute inset-0 rounded-3xl opacity-20" style={{ background: 'linear-gradient(135deg, transparent 40%, rgba(251,191,36,0.15) 50%, transparent 60%)' }} />

                            <div className="relative">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Premium</h2>
                                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Advanced tools for serious results</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                        <Crown className="w-6 h-6 text-amber-400" />
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">₹499</span>
                                    <span className="text-gray-500 dark:text-gray-400 ml-2">/month</span>
                                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-100 dark:border-transparent">
                                        <Sparkles className="w-3 h-3" />
                                        Cancel anytime
                                    </div>
                                </div>

                                <ul className="space-y-3 mb-10">
                                    {premiumFeatures.map((f, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                                {f.icon || <Check className="w-3 h-3" />}
                                            </div>
                                            <span className="text-sm text-gray-700 dark:text-gray-200">{f.text}</span>
                                        </li>
                                    ))}
                                </ul>

                                {isPremium ? (
                                    <div className="w-full py-4 rounded-2xl text-center font-bold text-sm bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30 cursor-default">
                                        ✓ Your Current Plan
                                    </div>
                                ) : (
                                    <button
                                        id="upgrade-premium-btn"
                                        onClick={() => setShowPayModal(true)}
                                        className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Crown className="w-5 h-5" />
                                        Upgrade to Premium
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Trust Badges ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
                        {[
                            { icon: <Shield className="w-6 h-6 text-blue-400" />,   label: 'Secure Payment',    sub: 'PCI-DSS Certified' },
                            { icon: <Lock className="w-6 h-6 text-emerald-400" />,  label: 'Data Encrypted',    sub: '256-bit SSL' },
                            { icon: <Zap className="w-6 h-6 text-amber-400" />,     label: 'Instant Activation',sub: 'Access in seconds' },
                            { icon: <Star className="w-6 h-6 text-rose-400 fill-rose-400" />, label: '4.9★ Rated', sub: '10k+ happy users' },
                        ].map((b, i) => (
                            <div key={i} className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-gray-100 dark:bg-gray-800/60 dark:border-gray-700/50 shadow-sm">
                                <div className="mb-3">{b.icon}</div>
                                <p className="text-gray-900 dark:text-white font-semibold text-sm">{b.label}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{b.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── FAQ ── */}
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">Frequently Asked Questions</h2>
                        <div className="max-w-2xl mx-auto space-y-3">
                            {faqs.map((faq, i) => (
                                <FaqItem key={i} q={faq.q} a={faq.a} />
                            ))}
                        </div>
                    </div>
                </div>

            {/* ── Animations ── */}
            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.92); }
                    to   { opacity: 1; transform: scale(1);    }
                }
                .animate-scaleIn { animation: scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both; }
            `}</style>
        </>
    );
};

export default Subscription;
