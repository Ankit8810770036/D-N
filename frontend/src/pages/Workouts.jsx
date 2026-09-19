import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import {
    Dumbbell, Flame, Clock, Trophy, CheckCircle2,
    Play, Pause, X, Check, Search, ChevronRight, Volume2, VolumeX,
    Sparkles, ArrowRight, Activity, BookOpen, BarChart3, Plus,
    RotateCcw, ShieldCheck, HeartPulse, Zap, Trash2, Edit3,
    SlidersHorizontal, Layers, PlusCircle, BookmarkCheck
} from 'lucide-react';
import useDebounce from '../hooks/useDebounce';

// ─── Native Web Audio Tone Generator ─────────────────────────────────────────
function playTimerBeep(freq = 520, duration = 0.12, type = 'sine') {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (_) {}
}

// ─── Cloudinary CDN Asset Base ───────────────────────────────────────────────
const CDN_WORKOUTS = 'https://res.cloudinary.com/dtmny71xd/image/upload/f_auto,q_auto/diet-planner/workouts';

// ─── Master Workout Routines ────────────────────────────────────────────────
const ROUTINES = [
    {
        id: 'hiit-fat-burn',
        title: 'High-Intensity Home Fat Burner',
        category: 'Fat Loss',
        level: 'Intermediate',
        duration: '22 mins',
        calories: 230,
        coverImage: `${CDN_WORKOUTS}/jumping_jacks.jpg`,
        goalMatch: 'lose',
        badge: '🔥 Fat Loss',
        icon: '🔥',
        description: 'High-metabolic bodyweight circuit designed to maximize calorie expenditure, elevate heart rate, and build endurance.',
        exercises: [
            { name: 'Jumping Jacks', sets: '3 sets', target: '45 secs', muscle: 'Full Body Cardio', image: `${CDN_WORKOUTS}/jumping_jacks.jpg`, tip: 'Keep a steady cadence and land softly on the balls of your feet.' },
            { name: 'Bodyweight Squats', sets: '3 sets', target: '15 reps', muscle: 'Quads & Glutes', image: `${CDN_WORKOUTS}/squats.jpg`, tip: 'Keep chest tall, push hips back, and drive through heels.' },
            { name: 'Mountain Climbers', sets: '3 sets', target: '30 secs', muscle: 'Core & Shoulders', image: `${CDN_WORKOUTS}/mountain_climbers.jpg`, tip: 'Maintain a flat back in high plank without letting hips pike.' },
            { name: 'High Knees Sprint', sets: '3 sets', target: '30 secs', muscle: 'Calves & Cardio', image: `${CDN_WORKOUTS}/high_knees.jpg`, tip: 'Drive knees up to hip level with rhythmic arm swings.' },
            { name: 'Elbow Plank Hold', sets: '3 sets', target: '45 secs', muscle: 'Abdominal Wall', image: `${CDN_WORKOUTS}/plank.jpg`, tip: 'Engage glutes and brace core tight throughout the hold.' },
            { name: 'Cobra to Child’s Pose', sets: '1 set', target: '2 mins', muscle: 'Spine Recovery', image: `${CDN_WORKOUTS}/cobra_pose.jpg`, tip: 'Deep belly breathing while gently stretching hamstrings and back.' }
        ]
    },
    {
        id: 'full-body-strength',
        title: 'Full Body Muscle & Strength Split',
        category: 'Strength',
        level: 'All Levels',
        duration: '30 mins',
        calories: 275,
        coverImage: `${CDN_WORKOUTS}/push_ups.jpg`,
        goalMatch: 'gain',
        badge: '💪 Muscle Building',
        icon: '💪',
        description: 'Balanced compound resistance movements targeting chest, upper back, and legs for tone, strength, and posture.',
        exercises: [
            { name: 'Standard Push-Ups', sets: '3 sets', target: '12 reps', muscle: 'Chest & Triceps', image: `${CDN_WORKOUTS}/push_ups.jpg`, tip: 'Keep elbows tucked at a 45-degree angle to protect shoulders.' },
            { name: 'Dumbbell / Backpack Rows', sets: '3 sets', target: '12 reps', muscle: 'Latissimus & Upper Back', image: `${CDN_WORKOUTS}/dumbbell_rows.jpg`, tip: 'Squeeze shoulder blades together at the peak of each row.' },
            { name: 'Goblet Squats', sets: '3 sets', target: '12 reps', muscle: 'Quads & Glutes', image: `${CDN_WORKOUTS}/squats.jpg`, tip: 'Hold weight at chest level and squat with knees tracking toes.' },
            { name: 'Glute Bridges', sets: '3 sets', target: '15 reps', muscle: 'Glutes & Hamstrings', image: `${CDN_WORKOUTS}/glute_bridge.jpg`, tip: 'Pause and squeeze glutes at top elevation for 2 full seconds.' },
            { name: 'Dead Bug Stability', sets: '3 sets', target: '12 reps/side', muscle: 'Deep Core', image: `${CDN_WORKOUTS}/dead_bug.jpg`, tip: 'Press lower spine firmly into the floor throughout.' }
        ]
    },
    {
        id: 'express-abs',
        title: 'Express 12-Min Core & Abs Shred',
        category: 'Core',
        level: 'All Levels',
        duration: '12 mins',
        calories: 140,
        coverImage: `${CDN_WORKOUTS}/bicycle_crunches.jpg`,
        goalMatch: 'maintain',
        badge: '⚡ Core Shred',
        icon: '⚡',
        description: 'Targeted isometric and rotational abdominal conditioning to sculpt the waistline and support spinal stability.',
        exercises: [
            { name: 'Bicycle Crunches', sets: '3 sets', target: '20 reps', muscle: 'Obliques & Abs', image: `${CDN_WORKOUTS}/bicycle_crunches.jpg`, tip: 'Smooth controlled rotation — touch elbow to opposite knee.' },
            { name: 'Russian Twists', sets: '3 sets', target: '24 twists', muscle: 'Rotational Core', image: `${CDN_WORKOUTS}/russian_twists.jpg`, tip: 'Rotate your entire ribcage side-to-side, not just arms.' },
            { name: 'Reverse Crunches', sets: '3 sets', target: '12 reps', muscle: 'Lower Abdominals', image: `${CDN_WORKOUTS}/reverse_crunch.jpg`, tip: 'Curl pelvis towards ribcage without using momentum.' },
            { name: 'Side Plank Holds', sets: '2 sets/side', target: '30 secs', muscle: 'Lateral Obliques', image: `${CDN_WORKOUTS}/side_plank.jpg`, tip: 'Form a rigid straight line from ankles to shoulders.' },
            { name: 'Elbow Plank Hold', sets: '3 sets', target: '45 secs', muscle: 'Entire Core', image: `${CDN_WORKOUTS}/plank.jpg`, tip: 'Tuck chin and press forearms into mat with tight abs.' }
        ]
    },
    {
        id: 'yoga-mobility',
        title: 'Morning Yoga Flow & Joint Recovery',
        category: 'Yoga',
        level: 'Beginner Friendly',
        duration: '18 mins',
        calories: 115,
        coverImage: `${CDN_WORKOUTS}/surya_namaskar.jpg`,
        goalMatch: 'maintain',
        badge: '🧘 Mobility & Calm',
        icon: '🧘',
        description: 'Mindful stretching sequence to release joint stiffness, open hips, improve posture, and ease lower back tension.',
        exercises: [
            { name: 'Surya Namaskar (Sun Salutations)', sets: '4 rounds', target: '4 mins', muscle: 'Full Body Mobility', image: `${CDN_WORKOUTS}/surya_namaskar.jpg`, tip: 'Inhale on back extensions, exhale on forward folds with slow breath.' },
            { name: 'Downward-Facing Dog', sets: '3 holds', target: '45 secs', muscle: 'Spine & Hamstrings', image: `${CDN_WORKOUTS}/downward_dog.jpg`, tip: 'Push floor away with palms and draw shoulder blades back.' },
            { name: 'Cobra to Child’s Pose', sets: '3 sets', target: '1 min', muscle: 'Lower Back & Hips', image: `${CDN_WORKOUTS}/cobra_pose.jpg`, tip: 'Gentle spinal decompression, never force the arch.' },
            { name: 'Warrior II Pose', sets: '2 sets/side', target: '30 secs', muscle: 'Hips & Quads', image: `${CDN_WORKOUTS}/warrior_pose.jpg`, tip: 'Front knee over ankle, arms parallel to ground, soft gaze.' },
            { name: 'Tree Pose Balance', sets: '2 sets/side', target: '45 secs', muscle: 'Ankles & Balance', image: `${CDN_WORKOUTS}/tree_pose.jpg`, tip: 'Find a steady focal point in front of you and breathe evenly.' }
        ]
    },
    {
        id: 'gentle-joint',
        title: 'Low-Impact Knee & Joint Care',
        category: 'Recovery',
        level: 'Beginner / Seniors',
        duration: '16 mins',
        calories: 105,
        coverImage: `${CDN_WORKOUTS}/bird_dog.jpg`,
        goalMatch: 'maintain',
        badge: '🌿 Gentle & Joint-Safe',
        icon: '🌿',
        description: 'Zero jumping, low-stress cardio and mobility suitable for all body weights, joint protection, and seniors.',
        exercises: [
            { name: 'Bird Dog Extensions', sets: '3 sets', target: '10 reps/side', muscle: 'Lower Back & Core', image: `${CDN_WORKOUTS}/bird_dog.jpg`, tip: 'Extend opposite arm and leg straight out without twisting hips.' },
            { name: 'Glute Bridges', sets: '3 sets', target: '12 reps', muscle: 'Glutes & Pelvic Floor', image: `${CDN_WORKOUTS}/glute_bridge.jpg`, tip: 'Drive through heels, squeeze glutes at the peak.' },
            { name: 'Elbow Plank Hold', sets: '3 sets', target: '30 secs', muscle: 'Core Stability', image: `${CDN_WORKOUTS}/plank.jpg`, tip: 'Maintain a neutral spine from head to heels.' },
            { name: 'Cobra to Child’s Pose', sets: '3 sets', target: '1 min', muscle: 'Spine & Hips', image: `${CDN_WORKOUTS}/cobra_pose.jpg`, tip: 'Gentle spinal decompression, never force the arch.' }
        ]
    }
];

// ─── Master Exercise Encyclopedia Library ───────────────────────────────────
const EXERCISE_LIBRARY = [
    { name: 'Jumping Jacks', category: 'Cardio', muscle: 'Cardio & Full Body', burnRate: '8–10 kcal/min', image: `${CDN_WORKOUTS}/jumping_jacks.jpg`, instructions: 'Stand tall with feet together, jump while spreading legs and clapping hands overhead, then return smoothly.', tip: 'Keep a steady rhythm and land softly on the balls of your feet.' },
    { name: 'Bodyweight Squats', category: 'Legs', muscle: 'Quads & Glutes', burnRate: '7–9 kcal/min', image: `${CDN_WORKOUTS}/squats.jpg`, instructions: 'Feet shoulder-width apart, sit hips back as if into a chair until thighs are parallel to ground, push through heels to stand.', tip: 'Keep your chest tall and knees tracking over your toes.' },
    { name: 'Standard Push-Ups', category: 'Chest', muscle: 'Chest & Triceps', burnRate: '6–8 kcal/min', image: `${CDN_WORKOUTS}/push_ups.jpg`, instructions: 'Hands slightly wider than shoulders, lower chest until 2 inches above floor with tight core, press back up.', tip: 'Keep elbows at a 45-degree angle to protect your shoulders.' },
    { name: 'Mountain Climbers', category: 'Core', muscle: 'Abdominals & Cardio', burnRate: '9–11 kcal/min', image: `${CDN_WORKOUTS}/mountain_climbers.jpg`, instructions: 'Start in top push-up plank, rapidly alternate driving knees towards chest in a running motion without piking hips.', tip: 'Maintain a flat plank back without letting hips pike up.' },
    { name: 'Elbow Plank Hold', category: 'Core', muscle: 'Core & Abdominals', burnRate: '4–5 kcal/min', image: `${CDN_WORKOUTS}/plank.jpg`, instructions: 'Rest on forearms and toes, keep body in a rigid straight line from crown of head to heels without sagging.', tip: 'Engage glutes and brace your abs like preparing for a punch.' },
    { name: 'Glute Bridges', category: 'Legs', muscle: 'Glutes & Hamstrings', burnRate: '5–6 kcal/min', image: `${CDN_WORKOUTS}/glute_bridge.jpg`, instructions: 'Lie on back with knees bent and feet flat, lift hips toward ceiling by squeezing glutes, hold at top for 2 seconds.', tip: 'Drive through heels and avoid arching your lower back.' },
    { name: 'Bicycle Crunches', category: 'Core', muscle: 'Obliques & Upper Abs', burnRate: '6–8 kcal/min', image: `${CDN_WORKOUTS}/bicycle_crunches.jpg`, instructions: 'Lie back, alternate touching opposite elbow to knee while extending other leg out straight at 45 degrees.', tip: 'Slow and controlled rotation — elbow to opposite knee.' },
    { name: 'Dumbbell Rows', category: 'Back', muscle: 'Latissimus & Upper Back', burnRate: '6–8 kcal/min', image: `${CDN_WORKOUTS}/dumbbell_rows.jpg`, instructions: 'Hinge at hips with flat back, pull weights toward hip creases while squeezing upper back muscles.', tip: 'Squeeze shoulder blades together at the top of each pull.' },
    { name: 'Russian Twists', category: 'Core', muscle: 'Rotational Core', burnRate: '6–7 kcal/min', image: `${CDN_WORKOUTS}/russian_twists.jpg`, instructions: 'Sit leaning back slightly with feet lifted or resting lightly on heels, rotate torso side-to-side.', tip: 'Rotate your entire ribcage, not just your arms.' },
    { name: 'Walking Lunges', category: 'Legs', muscle: 'Glutes & Quads', burnRate: '7–9 kcal/min', image: `${CDN_WORKOUTS}/walking_lunges.jpg`, instructions: 'Step forward and lower back knee toward floor, push through front heel to step directly into next lunge.', tip: 'Keep front knee stacked directly over ankle.' },
    { name: 'High Knees Sprint', category: 'Cardio', muscle: 'Calves & Hip Flexors', burnRate: '10–12 kcal/min', image: `${CDN_WORKOUTS}/high_knees.jpg`, instructions: 'Jog in place driving knees up to hip level with rapid cadence and energetic arm swings.', tip: 'Drive knees up to waist height with energetic arm swings.' },
    { name: 'Bird Dog Extensions', category: 'Back', muscle: 'Lower Back & Core', burnRate: '3–4 kcal/min', image: `${CDN_WORKOUTS}/bird_dog.jpg`, instructions: 'On hands and knees, reach right arm forward and left leg back simultaneously, hold 2 seconds, switch sides.', tip: 'Extend opposite arm and leg straight out without twisting hips.' },
    { name: 'Side Plank Holds', category: 'Core', muscle: 'Obliques & Lateral Chain', burnRate: '5–6 kcal/min', image: `${CDN_WORKOUTS}/side_plank.jpg`, instructions: 'Lie on side, prop up on forearm, elevate hips forming a straight line from shoulder to ankles.', tip: 'Stack shoulders and hips vertically without rotating forward.' },
    { name: 'Reverse Crunches', category: 'Core', muscle: 'Lower Abdominals', burnRate: '5–6 kcal/min', image: `${CDN_WORKOUTS}/reverse_crunch.jpg`, instructions: 'Lie on back, curl hips and knees toward chest lifting tailbone slightly off floor, lower with control.', tip: 'Initiate the movement from your pelvic tuck, not momentum.' },
    { name: 'Dead Bug Stability', category: 'Core', muscle: 'Deep Transverse Core', burnRate: '4–5 kcal/min', image: `${CDN_WORKOUTS}/dead_bug.jpg`, instructions: 'On back, extend opposite arm and leg straight out while pressing lower spine firmly into floor.', tip: 'Press your lower back firmly into the floor throughout.' },
    { name: 'Surya Namaskar Flow', category: 'Yoga', muscle: 'Full Body Mobility', burnRate: '6–8 kcal/min', image: `${CDN_WORKOUTS}/surya_namaskar.jpg`, instructions: 'Classic 12-step flowing sequence synchronizing breath with gentle back extensions, lunges, and forward folds.', tip: 'Inhale on back extensions, exhale on forward folds with rhythmic breathing.' },
    { name: 'Downward-Facing Dog', category: 'Yoga', muscle: 'Spine & Hamstrings', burnRate: '4–5 kcal/min', image: `${CDN_WORKOUTS}/downward_dog.jpg`, instructions: 'Form an inverted V-shape, pressing palms into floor, extending spine, and reaching heels toward the mat.', tip: 'Push floor away with hands and draw shoulder blades back.' },
    { name: 'Cobra to Child’s Pose', category: 'Yoga', muscle: 'Spine & Hip Flexors', burnRate: '4–5 kcal/min', image: `${CDN_WORKOUTS}/cobra_pose.jpg`, instructions: 'Lie prone, gently lift chest into cobra, then shift hips back onto heels into child’s pose.', tip: 'Gentle spinal decompression, never force the arch.' },
    { name: 'Warrior II Pose', category: 'Yoga', muscle: 'Hips & Balance', burnRate: '5–6 kcal/min', image: `${CDN_WORKOUTS}/warrior_pose.jpg`, instructions: 'Deep lunge with front knee over ankle, arms extended parallel to floor, gaze over front fingertips.', tip: 'Front knee directly over ankle, gaze softly over front fingertips.' },
    { name: 'Tree Pose Balance', category: 'Yoga', muscle: 'Ankles & Focus', burnRate: '3–4 kcal/min', image: `${CDN_WORKOUTS}/tree_pose.jpg`, instructions: 'Stand on one leg, place sole of other foot against inner calf or thigh, bring hands into prayer.', tip: 'Find a steady focal point in front of you and breathe evenly.' }
];

const DEFAULT_CUSTOM_ROUTINES = [
    {
        id: 'custom-daily-core',
        title: 'My Daily Core & Mobility Booster',
        category: 'Core',
        level: 'Personalized',
        duration: '14 mins',
        calories: 150,
        coverImage: `${CDN_WORKOUTS}/plank.jpg`,
        badge: '✨ Custom Routine',
        icon: '⚡',
        description: 'A customized quick circuit for core stamina, spinal decompression, and everyday posture support.',
        isCustom: true,
        exercises: [
            { name: 'Jumping Jacks', sets: '2 sets', target: '30 secs', muscle: 'Cardio Warmup', image: `${CDN_WORKOUTS}/jumping_jacks.jpg`, tip: 'Light, springy jumps to warm up the joints.' },
            { name: 'Bodyweight Squats', sets: '3 sets', target: '12 reps', muscle: 'Quads & Glutes', image: `${CDN_WORKOUTS}/squats.jpg`, tip: 'Keep chest high and heels pinned to the floor.' },
            { name: 'Elbow Plank Hold', sets: '3 sets', target: '40 secs', muscle: 'Core Stability', image: `${CDN_WORKOUTS}/plank.jpg`, tip: 'Brace abdominals firmly and breathe steadily.' },
            { name: 'Cobra to Child’s Pose', sets: '2 sets', target: '1 min', muscle: 'Spine Relief', image: `${CDN_WORKOUTS}/cobra_pose.jpg`, tip: 'Relax your lower back and decompress your spine.' }
        ]
    }
];

// ─── Target Duration Parser & Timer Formatter ───────────────────────────────
function parseSeconds(target) {
    if (!target) return 30;
    const s = String(target).toLowerCase();
    if (s.includes('min')) {
        const m = s.match(/(\d+)\s*min/);
        if (m) return parseInt(m[1], 10) * 60;
    }
    if (s.includes('sec')) {
        const m = s.match(/(\d+)\s*sec/);
        if (m) return parseInt(m[1], 10);
    }
    if (s.includes('rep') || s.includes('twist') || s.includes('hold') || s.includes('round')) {
        const m = s.match(/(\d+)/);
        if (m) {
            const v = parseInt(m[1], 10);
            return Math.min(Math.max(Math.round(v * 2.5), 25), 60);
        }
    }
    return 30;
}

function formatClock(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.max(0, seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ─── Interactive Guided Workout Player Modal ────────────────────────────────
function WorkoutPlayerModal({ routine, onClose, onComplete, isLogging }) {
    useBodyScrollLock(true);

    const exercises = routine.exercises || [];
    const [phase, setPhase] = useState('ready'); // 'ready' | 'exercise' | 'rest' | 'finished'
    const [stepIndex, setStepIndex] = useState(0);
    const [exerciseSeconds, setExerciseSeconds] = useState(30);
    const [totalExerciseSeconds, setTotalExerciseSeconds] = useState(30);
    const [restSeconds, setRestSeconds] = useState(15);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const currentEx = exercises[stepIndex] || exercises[0] || {};
    const isLast = stepIndex === exercises.length - 1;
    const nextEx = stepIndex < exercises.length - 1 ? exercises[stepIndex + 1] : null;

    // Preload next exercise image for instant seamless rendering
    useEffect(() => {
        if (nextEx && nextEx.image) {
            const img = new Image();
            img.src = nextEx.image;
        }
    }, [stepIndex, nextEx]);

    // Start Workout Session
    const handleStart = () => {
        const dur = parseSeconds(exercises[0]?.target);
        setStepIndex(0);
        setExerciseSeconds(dur);
        setTotalExerciseSeconds(dur);
        setIsPaused(false);
        setPhase('exercise');
        if (!isMuted) playTimerBeep(580, 0.15, 'sine');
    };

    // Exercise Countdown Timer
    useEffect(() => {
        let timer = null;
        if (phase === 'exercise' && !isPaused && exerciseSeconds > 0) {
            timer = setInterval(() => {
                setExerciseSeconds((prev) => {
                    if (prev <= 4 && prev > 1 && !isMuted) {
                        playTimerBeep(520, 0.08, 'sine');
                    } else if (prev === 1 && !isMuted) {
                        playTimerBeep(880, 0.25, 'triangle');
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (phase === 'exercise' && !isPaused && exerciseSeconds === 0) {
            if (!isLast) {
                // Auto 15s Break
                setRestSeconds(15);
                setIsPaused(false);
                setPhase('rest');
                if (!isMuted) playTimerBeep(650, 0.18, 'sine');
            } else {
                // Finish
                setPhase('finished');
                if (!isMuted) playTimerBeep(880, 0.4, 'triangle');
                onComplete(routine);
            }
        }
        return () => clearInterval(timer);
    }, [phase, isPaused, exerciseSeconds, isLast, isMuted, routine, onComplete]);

    // Rest Countdown Timer
    useEffect(() => {
        let timer = null;
        if (phase === 'rest' && !isPaused && restSeconds > 0) {
            timer = setInterval(() => {
                setRestSeconds((prev) => {
                    if (prev <= 4 && prev > 1 && !isMuted) {
                        playTimerBeep(480, 0.08, 'sine');
                    } else if (prev === 1 && !isMuted) {
                        playTimerBeep(880, 0.3, 'triangle');
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (phase === 'rest' && !isPaused && restSeconds === 0) {
            const nextIdx = stepIndex + 1;
            if (nextIdx < exercises.length) {
                const dur = parseSeconds(exercises[nextIdx].target);
                setStepIndex(nextIdx);
                setExerciseSeconds(dur);
                setTotalExerciseSeconds(dur);
                setIsPaused(false);
                setPhase('exercise');
                if (!isMuted) playTimerBeep(580, 0.15, 'sine');
            }
        }
        return () => clearInterval(timer);
    }, [phase, isPaused, restSeconds, stepIndex, exercises, isMuted]);

    // Skip exercise manually
    const handleSkipExercise = () => {
        if (isLast) {
            setPhase('finished');
            if (!isMuted) playTimerBeep(880, 0.4, 'triangle');
            onComplete(routine);
            return;
        }
        setRestSeconds(15);
        setIsPaused(false);
        setPhase('rest');
        if (!isMuted) playTimerBeep(650, 0.18, 'sine');
    };

    // Skip rest break
    const handleSkipRest = () => {
        const nextIdx = stepIndex + 1;
        if (nextIdx < exercises.length) {
            const dur = parseSeconds(exercises[nextIdx].target);
            setStepIndex(nextIdx);
            setExerciseSeconds(dur);
            setTotalExerciseSeconds(dur);
            setIsPaused(false);
            setPhase('exercise');
            if (!isMuted) playTimerBeep(580, 0.15, 'sine');
        }
    };

    const overallProgress = Math.round(((stepIndex + (phase === 'rest' ? 0.5 : 0)) / exercises.length) * 100);
    const exerciseProgress = totalExerciseSeconds > 0
        ? Math.round(((totalExerciseSeconds - exerciseSeconds) / totalExerciseSeconds) * 100)
        : 0;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overscroll-contain"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="card max-w-xl w-full p-0 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[94vh] border border-slate-200/50 dark:border-white/10 shadow-2xl rounded-2xl sm:rounded-3xl dark:bg-[#0d2118]">
                
                {/* Modal Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-emerald-950/40">
                    <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-green-400 truncate">
                                {routine.title}
                            </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
                            {phase === 'ready' && `${exercises.length} Movements · ~${routine.duration}`}
                            {phase === 'exercise' && `Exercise ${stepIndex + 1} of ${exercises.length}`}
                            {phase === 'rest' && `15s Rest Interval`}
                            {phase === 'finished' && `Workout Completed!`}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                        >
                            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-600 dark:text-green-400" />}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5">
                    <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${phase === 'finished' ? 100 : overallProgress}%` }}
                    />
                </div>

                {/* Content Body */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
                    
                    {/* START SCREEN */}
                    {phase === 'ready' && (
                        <div className="space-y-4 sm:space-y-5 text-center py-1 sm:py-2">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-3xl sm:text-4xl flex items-center justify-center mx-auto shadow-sm">
                                {routine.icon || '🏋️'}
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                    {routine.title}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                                    {routine.description}
                                </p>
                            </div>

                            {/* Summary Metrics */}
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-center">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Movements</span>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">{exercises.length}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Time</span>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">{routine.duration}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Burn</span>
                                    <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-green-400">~{routine.calories} kcal</span>
                                </div>
                            </div>

                            {/* Exercises sequence */}
                            <div className="text-left space-y-1.5">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Workout Lineup:
                                </p>
                                <div className="space-y-1.5 max-h-44 sm:max-h-52 overflow-y-auto pr-1">
                                    {exercises.map((ex, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 font-medium"
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                                                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-green-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-semibold truncate">{ex.name}</span>
                                            </div>
                                            <span className="text-slate-400 text-[11px] font-bold shrink-0">{ex.target}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleStart}
                                className="btn-primary w-full text-xs sm:text-sm py-3 sm:py-3.5 shadow-lg shadow-emerald-500/20"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                <span>Start Workout Now</span>
                            </button>
                        </div>
                    )}

                    {/* ACTIVE EXERCISE SCREEN */}
                    {phase === 'exercise' && (
                        <div className="space-y-3 sm:space-y-4">
                            {/* Edge-to-edge filled exercise demo container */}
                            <div className="w-full h-48 sm:h-64 rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-md">
                                {currentEx.image ? (
                                    <img
                                        key={currentEx.image || currentEx.name || stepIndex}
                                        src={currentEx.image}
                                        alt={currentEx.name}
                                        className="w-full h-full object-cover object-center select-none animate-in fade-in duration-200"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-500 gap-2 p-4">
                                        <Dumbbell className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500/60 animate-pulse" />
                                        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{currentEx.muscle || 'Custom Exercise'}</span>
                                    </div>
                                )}
                                {isPaused && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10">
                                        <span className="px-3.5 py-1.5 rounded-full bg-amber-500 text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-lg">
                                            Workout Paused
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                                        {currentEx.name}
                                    </h3>
                                    <span className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                                        {currentEx.target}
                                    </span>
                                </div>
                                <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate">
                                    {currentEx.sets} · Focus: {currentEx.muscle}
                                </p>
                            </div>

                            {/* Timer Display Box */}
                            <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400">
                                        Remaining Time
                                    </span>
                                    <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-green-400">
                                        {formatClock(exerciseSeconds)}
                                    </span>
                                </div>

                                <div className="w-full bg-slate-200 dark:bg-white/10 h-2 sm:h-2.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-full transition-all duration-1000 ease-linear rounded-full"
                                        style={{ width: `${exerciseProgress}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setExerciseSeconds(p => Math.max(5, p - 10));
                                                setTotalExerciseSeconds(p => Math.max(5, p - 10));
                                            }}
                                            className="px-2.5 py-1 rounded-xl bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-white/10 hover:border-emerald-500 transition-colors"
                                        >
                                            -10s
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setExerciseSeconds(p => p + 10);
                                                setTotalExerciseSeconds(p => p + 10);
                                            }}
                                            className="px-2.5 py-1 rounded-xl bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-white/10 hover:border-emerald-500 transition-colors"
                                        >
                                            +10s
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsPaused(!isPaused)}
                                        className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                            isPaused
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                        }`}
                                    >
                                        {isPaused ? (
                                            <>
                                                <Play className="w-3.5 h-3.5 fill-current" />
                                                <span>Resume</span>
                                            </>
                                        ) : (
                                            <>
                                                <Pause className="w-3.5 h-3.5 fill-current" />
                                                <span>Pause</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {currentEx.tip && (
                                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-white/10 leading-relaxed font-medium">
                                    💡 <strong>Form Cue:</strong> {currentEx.tip}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={handleSkipExercise}
                                className="btn-primary w-full text-xs py-3 sm:py-3.5 shadow-md shadow-emerald-500/10"
                            >
                                {isLast ? (
                                    <>
                                        <Trophy className="w-4 h-4 text-amber-300" />
                                        <span>Finish Workout (+15 🪙)</span>
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Complete Movement (15s Break) →</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* REST BREAK SCREEN */}
                    {phase === 'rest' && (
                        <div className="py-6 flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center animate-pulse">
                                <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                                    {restSeconds}s
                                </span>
                            </div>

                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                                    Rest Interval
                                </span>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Catch your breath and prepare for the next movement.
                                </p>
                            </div>

                            {nextEx && (
                                <div className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center gap-3 text-left">
                                    {nextEx.image ? (
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                                            <img
                                                key={nextEx.image || nextEx.name}
                                                src={nextEx.image}
                                                alt={nextEx.name}
                                                className="w-full h-full object-cover object-center"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                                            <Dumbbell className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-green-400 block">
                                            Up Next · Step {stepIndex + 2} of {exercises.length}
                                        </span>
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                            {nextEx.name}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 truncate">
                                            {nextEx.target} · {nextEx.muscle}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPaused(!isPaused)}
                                    className="btn-secondary py-2.5 px-4 text-xs font-bold"
                                >
                                    {isPaused ? 'Resume' : 'Pause'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSkipRest}
                                    className="btn-primary py-2.5 px-5 text-xs font-bold"
                                >
                                    Skip Rest →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* WORKOUT COMPLETE SCREEN */}
                    {phase === 'finished' && (
                        <div className="py-6 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-green-400 flex items-center justify-center mx-auto shadow-md">
                                <Trophy className="w-8 h-8 text-amber-400" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Workout Completed! 🎉
                                </h3>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                    Outstanding work! You completed the <strong>{routine.title}</strong> routine.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-around text-center">
                                <div>
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">Movements</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{exercises.length}</span>
                                </div>
                                <div className="h-6 w-px bg-emerald-200 dark:bg-emerald-800" />
                                <div>
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">Burned</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">~{routine.calories} kcal</span>
                                </div>
                                <div className="h-6 w-px bg-emerald-200 dark:bg-emerald-800" />
                                <div>
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">Reward</span>
                                    <span className="text-sm font-bold text-amber-500">+15 🪙</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLogging}
                                className="btn-primary w-full text-xs py-3.5 shadow-md shadow-emerald-500/10"
                            >
                                {isLogging ? 'Saving Reward...' : 'Done & Return to Workouts'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Custom Routine Builder & Editor Modal ──────────────────────────────────
function CustomRoutineModal({ isOpen, onClose, onSave, editRoutine = null }) {
    useBodyScrollLock(isOpen);

    const [title, setTitle] = useState(editRoutine?.title || '');
    const [category, setCategory] = useState(editRoutine?.category || 'Strength');
    const [level, setLevel] = useState(editRoutine?.level || 'All Levels');
    const [description, setDescription] = useState(editRoutine?.description || '');
    const [exercises, setExercises] = useState(editRoutine?.exercises || []);

    // Form states for adding an exercise
    const [addMode, setAddMode] = useState('library'); // 'library' | 'manual'
    const [selectedLibraryName, setSelectedLibraryName] = useState(EXERCISE_LIBRARY[0]?.name || '');
    const [manualName, setManualName] = useState('');
    const [manualSets, setManualSets] = useState('3 sets');
    const [manualTarget, setManualTarget] = useState('12 reps');
    const [manualMuscle, setManualMuscle] = useState('Full Body');
    const [manualTip, setManualTip] = useState('');

    useEffect(() => {
        if (editRoutine) {
            setTitle(editRoutine.title || '');
            setCategory(editRoutine.category || 'Strength');
            setLevel(editRoutine.level || 'All Levels');
            setDescription(editRoutine.description || '');
            setExercises(editRoutine.exercises || []);
        } else {
            setTitle('');
            setCategory('Strength');
            setLevel('All Levels');
            setDescription('');
            setExercises([]);
        }
    }, [editRoutine, isOpen]);

    if (!isOpen) return null;

    const handleAddFromLibrary = () => {
        const item = EXERCISE_LIBRARY.find(e => e.name === selectedLibraryName);
        if (!item) return;
        const newEx = {
            name: item.name,
            sets: '3 sets',
            target: item.category === 'Yoga' ? '45 secs' : (item.category === 'Core' ? '30 secs' : '12 reps'),
            muscle: item.muscle,
            image: item.image,
            tip: item.tip
        };
        setExercises([...exercises, newEx]);
    };

    const handleAddManual = (e) => {
        e.preventDefault();
        if (!manualName.trim()) {
            toast.error('Please enter an exercise name');
            return;
        }
        const newEx = {
            name: manualName.trim(),
            sets: manualSets.trim() || '3 sets',
            target: manualTarget.trim() || '12 reps',
            muscle: manualMuscle.trim() || 'Custom Movement',
            image: '',
            tip: manualTip.trim() || 'Focus on smooth, controlled form.'
        };
        setExercises([...exercises, newEx]);
        setManualName('');
        setManualTip('');
    };

    const handleRemoveExercise = (idx) => {
        setExercises(exercises.filter((_, i) => i !== idx));
    };

    const handleMoveExercise = (fromIdx, toIdx) => {
        if (toIdx < 0 || toIdx >= exercises.length) return;
        const updated = [...exercises];
        const [moved] = updated.splice(fromIdx, 1);
        updated.splice(toIdx, 0, moved);
        setExercises(updated);
    };

    // Calculate estimated duration & calories
    const estMinutes = Math.max(5, Math.round(exercises.reduce((acc, ex) => acc + parseSeconds(ex.target) + 15, 0) / 60));
    const estCalories = Math.round(estMinutes * 8.5);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('Please provide a workout title');
            return;
        }
        if (exercises.length === 0) {
            toast.error('Please add at least 1 exercise to this workout');
            return;
        }

        const coverImage = exercises[0]?.image || `${CDN_WORKOUTS}/jumping_jacks.jpg`;

        const routineData = {
            id: editRoutine?.id || `custom-${Date.now()}`,
            title: title.trim(),
            category,
            level,
            duration: `${estMinutes} mins`,
            calories: estCalories,
            coverImage,
            badge: '✨ Custom Routine',
            icon: category === 'Yoga' ? '🧘' : (category === 'Fat Loss' ? '🔥' : (category === 'Core' ? '⚡' : '💪')),
            description: description.trim() || `Personalized ${category} routine tailored for your daily fitness plan.`,
            isCustom: true,
            exercises
        };

        onSave(routineData);
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overscroll-contain"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="card max-w-xl w-full p-0 overflow-hidden flex flex-col max-h-[92vh] border border-slate-200/50 dark:border-white/10 shadow-2xl rounded-2xl sm:rounded-3xl dark:bg-[#0d2118]">
                
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-emerald-950/40">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-green-400 flex items-center justify-center shrink-0">
                            <SlidersHorizontal className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                {editRoutine ? 'Edit Custom Workout' : 'Build Custom Workout'}
                            </h3>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                                Add exercises according to your daily energy and equipment
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5 overscroll-contain">
                    
                    {/* Basic details */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Workout Routine Title *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. My Morning Core & Mobility"
                                className="input-field w-full text-xs"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="input-field w-full text-xs"
                                >
                                    <option value="Fat Loss">🔥 Fat Loss</option>
                                    <option value="Strength">💪 Strength Split</option>
                                    <option value="Core">⚡ Core & Abs</option>
                                    <option value="Yoga">🧘 Yoga & Mobility</option>
                                    <option value="Recovery">🌿 Low Impact / Recovery</option>
                                    <option value="Cardio">🏃 Cardio Blast</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    Difficulty Level
                                </label>
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="input-field w-full text-xs"
                                >
                                    <option value="Beginner Friendly">Beginner Friendly</option>
                                    <option value="All Levels">All Levels</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Short Description / Goal (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. 15-minute quick burn after work"
                                className="input-field w-full text-xs"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Live Routine Stats Banner */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-around text-center text-xs">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-green-400 block">Movements</span>
                            <span className="font-bold text-slate-900 dark:text-white">{exercises.length}</span>
                        </div>
                        <div className="h-6 w-px bg-emerald-500/20" />
                        <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-green-400 block">Est. Time</span>
                            <span className="font-bold text-slate-900 dark:text-white">~{estMinutes} mins</span>
                        </div>
                        <div className="h-6 w-px bg-emerald-500/20" />
                        <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-green-400 block">Est. Burn</span>
                            <span className="font-bold text-emerald-600 dark:text-green-400">~{estCalories} kcal</span>
                        </div>
                    </div>

                    {/* Exercises in Routine List */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Exercises in this Workout ({exercises.length})
                            </label>
                            {exercises.length > 0 && (
                                <span className="text-[10px] sm:text-[11px] text-slate-400">
                                    Click arrows to reorder
                                </span>
                            )}
                        </div>

                        {exercises.length === 0 ? (
                            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 text-center space-y-1">
                                <Layers className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 mx-auto" />
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    No exercises added yet
                                </p>
                                <p className="text-[11px] text-slate-400">
                                    Select from the library or create a custom movement below.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-48 sm:max-h-56 overflow-y-auto pr-1">
                                {exercises.map((ex, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 text-xs"
                                    >
                                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
                                            <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-green-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                {idx + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <h5 className="font-bold text-slate-900 dark:text-white truncate">
                                                    {ex.name}
                                                </h5>
                                                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                                                    {ex.sets} · {ex.target} · {ex.muscle}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => handleMoveExercise(idx, idx - 1)}
                                                disabled={idx === 0}
                                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30"
                                                title="Move up"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleMoveExercise(idx, idx + 1)}
                                                disabled={idx === exercises.length - 1}
                                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-30"
                                                title="Move down"
                                            >
                                                ▼
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveExercise(idx)}
                                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors ml-0.5 sm:ml-1"
                                                title="Remove exercise"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add Exercise Selector / Creator */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                ➕ Add Exercise
                            </span>
                            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200 dark:bg-white/10 text-[10px] sm:text-[11px] font-bold">
                                <button
                                    type="button"
                                    onClick={() => setAddMode('library')}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${
                                        addMode === 'library'
                                            ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                                            : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    From Library
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAddMode('manual')}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${
                                        addMode === 'manual'
                                            ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                                            : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                >
                                    Custom Exercise
                                </button>
                            </div>
                        </div>

                        {addMode === 'library' ? (
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedLibraryName}
                                    onChange={(e) => setSelectedLibraryName(e.target.value)}
                                    className="input-field flex-1 text-xs"
                                >
                                    {EXERCISE_LIBRARY.map((ex) => (
                                        <option key={ex.name} value={ex.name}>
                                            {ex.name} ({ex.category} · {ex.muscle})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleAddFromLibrary}
                                    className="btn-primary py-2.5 px-3.5 sm:px-4 text-xs font-bold shrink-0"
                                >
                                    Add
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2.5 pt-1">
                                <input
                                    type="text"
                                    placeholder="Exercise Name (e.g. Kettlebell Swings, Wall Sit)"
                                    className="input-field w-full text-xs"
                                    value={manualName}
                                    onChange={(e) => setManualName(e.target.value)}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Sets (e.g. 3 sets)"
                                        className="input-field w-full text-xs"
                                        value={manualSets}
                                        onChange={(e) => setManualSets(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Target (e.g. 15 reps, 45 secs)"
                                        className="input-field w-full text-xs"
                                        value={manualTarget}
                                        onChange={(e) => setManualTarget(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Target Muscle"
                                        className="input-field w-full text-xs"
                                        value={manualMuscle}
                                        onChange={(e) => setManualMuscle(e.target.value)}
                                    />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Form coaching tip (Optional)"
                                    className="input-field w-full text-xs"
                                    value={manualTip}
                                    onChange={(e) => setManualTip(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddManual}
                                    className="btn-secondary w-full py-2 text-xs font-bold"
                                >
                                    + Add Custom Movement to Workout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2.5 sm:gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary w-1/3 py-2.5 sm:py-3 text-xs font-bold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex-1 py-2.5 sm:py-3 text-xs font-bold shadow-lg shadow-emerald-500/20"
                        >
                            {editRoutine ? 'Save Changes' : 'Create Custom Workout'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Exercise Detail Modal ──────────────────────────────────────────────────
function ExerciseDetailModal({ exercise, onClose }) {
    useBodyScrollLock(Boolean(exercise));

    if (!exercise) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 overscroll-contain"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="card max-w-lg w-full p-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-2xl dark:bg-[#0d2118]">
                <div className="relative h-48 sm:h-64 w-full overflow-hidden border-b border-slate-100 dark:border-white/10">
                    {exercise.image ? (
                        <img
                            src={exercise.image}
                            alt={exercise.name}
                            className="w-full h-full object-cover object-center select-none"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                            <Dumbbell className="w-16 h-16 text-emerald-500/40" />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                            {exercise.name}
                        </h3>
                        <span className="badge badge-green text-[10px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 shrink-0">
                            {exercise.category}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <span>🎯 {exercise.muscle}</span>
                        <span>🔥 {exercise.burnRate}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">
                        {exercise.instructions}
                    </p>
                    {exercise.tip && (
                        <p className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40">
                            💡 <strong>Form Cue:</strong> {exercise.tip}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary w-full py-2.5 sm:py-3 text-xs font-bold mt-1"
                    >
                        Close Guide
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Workouts Page Component (Polished, Minimal, State of the Art) ──────
export default function Workouts() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState('routines'); // 'routines' | 'library' | 'custom' | 'activity'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const debouncedSearch = useDebounce(searchTerm, 250);

    const [activeWorkout, setActiveWorkout] = useState(null);
    const [selectedExercise, setSelectedExercise] = useState(null);

    // Custom routines state loaded from localStorage
    const [customRoutines, setCustomRoutines] = useState(() => {
        try {
            const saved = localStorage.getItem('user_custom_workouts');
            return saved ? JSON.parse(saved) : DEFAULT_CUSTOM_ROUTINES;
        } catch {
            return DEFAULT_CUSTOM_ROUTINES;
        }
    });

    // Custom routine modal state
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState(null);

    // Lock body and html scroll whenever ANY modal or form is active
    const isAnyModalOpen = Boolean(activeWorkout || isBuilderOpen || selectedExercise);
    useBodyScrollLock(isAnyModalOpen);

    // Persist custom routines to localStorage
    const saveCustomRoutines = (newList) => {
        setCustomRoutines(newList);
        try {
            localStorage.setItem('user_custom_workouts', JSON.stringify(newList));
        } catch (e) {
            console.error('Failed to persist custom workouts to localStorage', e);
        }
    };

    const handleSaveRoutine = (routineData) => {
        if (editingRoutine) {
            const updated = customRoutines.map(r => r.id === routineData.id ? routineData : r);
            saveCustomRoutines(updated);
            toast.success('Custom workout updated! ✨');
        } else {
            saveCustomRoutines([routineData, ...customRoutines]);
            toast.success('Custom workout created! 🎉');
        }
        setIsBuilderOpen(false);
        setEditingRoutine(null);
    };

    const handleDeleteRoutine = (routineId) => {
        if (window.confirm('Are you sure you want to delete this custom workout?')) {
            const updated = customRoutines.filter(r => r.id !== routineId);
            saveCustomRoutines(updated);
            toast.success('Workout deleted');
        }
    };

    // Local today string
    const todayStr = useMemo(() => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0], []);
    const userGoal = user?.profile?.goal || 'maintain';

    // Fetch Today's Progress from backend
    const { data: summary, isLoading } = useQuery({
        queryKey: ['summary'],
        queryFn: () => api.get('/report/summary').then(res => res.data).catch(() => null),
        staleTime: 30 * 1000,
    });

    const isTodayWorkoutDone = summary?.stats?.workout_days > 0 && summary?.stats?.latest_log_date === todayStr;

    // Log workout mutation
    const logWorkoutMutation = useMutation({
        mutationFn: async (routine) => {
            const res = await api.post('/log-progress', {
                date: todayStr,
                workout_done: true,
                notes: `Completed: ${routine.title} (~${routine.calories} kcal burned)`
            });
            return res.data;
        },
        onSuccess: () => {
            toast.success('🎉 Workout logged! +15 HealthCoins awarded! 🪙', { duration: 3500 });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
            queryClient.invalidateQueries({ queryKey: ['tokens'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setActiveWorkout(null);
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || 'Failed to save workout.');
            setActiveWorkout(null);
        }
    });

    // Category list for filter pills
    const categories = [
        { id: 'all', label: 'All Workouts' },
        { id: 'fat loss', label: '🔥 Fat Loss' },
        { id: 'strength', label: '💪 Muscle Strength' },
        { id: 'core', label: '⚡ Core & Abs' },
        { id: 'yoga', label: '🧘 Yoga & Mobility' },
        { id: 'recovery', label: '🌿 Joint Care' },
    ];

    // Filter routines based on search & category
    const filteredRoutines = useMemo(() => {
        return ROUTINES.filter((routine) => {
            const matchesSearch = routine.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                routine.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                routine.exercises.some(e => e.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
            const matchesCategory = selectedCategory === 'all' || routine.category.toLowerCase() === selectedCategory.toLowerCase();
            return matchesSearch && matchesCategory;
        });
    }, [debouncedSearch, selectedCategory]);

    // Filter custom routines
    const filteredCustomRoutines = useMemo(() => {
        return customRoutines.filter((routine) => {
            const matchesSearch = routine.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                routine.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                routine.exercises.some(e => e.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
            const matchesCategory = selectedCategory === 'all' || routine.category.toLowerCase() === selectedCategory.toLowerCase();
            return matchesSearch && matchesCategory;
        });
    }, [customRoutines, debouncedSearch, selectedCategory]);

    // Filter exercise library
    const filteredExercises = useMemo(() => {
        return EXERCISE_LIBRARY.filter((ex) => {
            const matchesSearch = ex.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                ex.muscle.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                ex.category.toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || ex.category.toLowerCase() === selectedCategory.toLowerCase() ||
                (selectedCategory === 'fat loss' && ex.category.toLowerCase() === 'cardio') ||
                (selectedCategory === 'strength' && (ex.category.toLowerCase() === 'chest' || ex.category.toLowerCase() === 'legs' || ex.category.toLowerCase() === 'back')) ||
                (selectedCategory === 'recovery' && ex.category.toLowerCase() === 'yoga');
            return matchesSearch && matchesCategory;
        });
    }, [debouncedSearch, selectedCategory]);

    // Recommended routine based on profile goal
    const recommendedRoutine = useMemo(() => {
        return ROUTINES.find(r => r.goalMatch === userGoal) || ROUTINES[0];
    }, [userGoal]);

    return (
        <div className="space-y-5 sm:space-y-6 pb-20 animate-fade-in w-full min-w-0 font-outfit">
            
            {/* Active Workout Player Modal */}
            {activeWorkout && (
                <WorkoutPlayerModal
                    routine={activeWorkout}
                    onClose={() => setActiveWorkout(null)}
                    onComplete={(r) => logWorkoutMutation.mutate(r)}
                    isLogging={logWorkoutMutation.isPending}
                />
            )}

            {/* Custom Routine Builder Modal */}
            <CustomRoutineModal
                isOpen={isBuilderOpen}
                onClose={() => {
                    setIsBuilderOpen(false);
                    setEditingRoutine(null);
                }}
                onSave={handleSaveRoutine}
                editRoutine={editingRoutine}
            />

            {/* Exercise Detail Modal */}
            <ExerciseDetailModal
                exercise={selectedExercise}
                onClose={() => setSelectedExercise(null)}
            />

            {/* Top Page Header */}
            <div className="space-y-3 sm:space-y-4">
                <div className="page-header mb-0">
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-1">
                        <Dumbbell className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 dark:text-green-400 shrink-0" />
                        <h1 className="page-title text-xl sm:text-2xl md:text-3xl">Personalized Workouts</h1>
                    </div>
                    <p className="page-subtitle text-xs sm:text-sm">
                        Guided exercise sessions with interval timers, custom workout builder, and HealthCoin rewards
                    </p>
                </div>

                {/* Static, Non-Scrolling Tab Bar for all 4 Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 p-1 sm:p-1.5 bg-slate-100 dark:bg-[#0c241a] rounded-2xl border border-slate-200/50 dark:border-white/10 w-full">
                    <button
                        type="button"
                        onClick={() => setActiveTab('routines')}
                        className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                            activeTab === 'routines'
                                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                        }`}
                    >
                        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                        <span className="truncate">Routines</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('library')}
                        className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                            activeTab === 'library'
                                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                        }`}
                    >
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">Exercise Library</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('custom')}
                        className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                            activeTab === 'custom'
                                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                        }`}
                    >
                        <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-500 shrink-0" />
                        <span className="truncate">Customize Activity</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('activity')}
                        className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                            activeTab === 'activity'
                                ? 'bg-white dark:bg-emerald-600 text-slate-900 dark:text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                        }`}
                    >
                        <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
                        <span className="truncate">My Activity</span>
                    </button>
                </div>
            </div>

            {/* TAB 1: GUIDED ROUTINES */}
            {activeTab === 'routines' && (
                <div className="space-y-5 sm:space-y-6">
                    {/* Category Filter Pills & Search */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full sm:flex-wrap">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                                        selectedCategory === cat.id
                                            ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                                            : 'bg-slate-100 dark:bg-[#0c241a] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-emerald-950/60 border border-transparent dark:border-white/10'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 w-3.5 h-3.5" />
                            <input
                                type="text"
                                placeholder="Search routines..."
                                className="input-field pl-9 py-2 text-xs w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Today's Recommended Routine Spotlight */}
                    {recommendedRoutine && selectedCategory === 'all' && !debouncedSearch && (
                        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-5 sm:p-8 text-white shadow-xl">
                            <div className="relative z-10 max-w-xl space-y-3.5 sm:space-y-4">
                                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-bold">
                                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                    <span>Recommended for Goal ({userGoal.toUpperCase()})</span>
                                </div>
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                                    {recommendedRoutine.title}
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
                                    {recommendedRoutine.description}
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-bold text-slate-300 pt-1">
                                    <span className="flex items-center gap-1.5 text-orange-400">
                                        <Flame className="w-3.5 h-3.5" /> ~{recommendedRoutine.calories} kcal
                                    </span>
                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                        <Clock className="w-3.5 h-3.5" /> {recommendedRoutine.duration}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-slate-300">
                                        <Activity className="w-3.5 h-3.5" /> {recommendedRoutine.exercises.length} Moves
                                    </span>
                                    <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white text-[10px] sm:text-[11px]">
                                        {recommendedRoutine.level}
                                    </span>
                                </div>

                                <div className="pt-2 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setActiveWorkout(recommendedRoutine)}
                                        className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-emerald-500/30"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        <span>Start Workout (+15 🪙)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Background graphic */}
                            <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-35 pointer-events-none hidden md:block">
                                <img
                                    src={recommendedRoutine.coverImage}
                                    alt=""
                                    className="w-full h-full object-cover object-center"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
                            </div>
                        </div>
                    )}

                    {/* Workout Routines Grid with Full-Bleed Edge-to-Edge Images */}
                    <div>
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                All Available Sessions
                            </h3>
                            <span className="text-xs text-slate-400 font-semibold">
                                {filteredRoutines.length} routine{filteredRoutines.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {filteredRoutines.map((routine) => (
                                <div
                                    key={routine.id}
                                    className="card card-hover p-0 overflow-hidden rounded-2xl sm:rounded-3xl flex flex-col justify-between group border border-slate-200/50 dark:border-white/10 dark:bg-[#0c241a]/90"
                                >
                                    {/* Edge-to-edge filled image without letterboxing */}
                                    <div className="relative h-44 sm:h-56 overflow-hidden w-full">
                                        <img
                                            src={routine.coverImage}
                                            alt={routine.title}
                                            loading="lazy"
                                            className="w-full h-full object-cover object-center select-none"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                                        
                                        <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/20">
                                            {routine.level}
                                        </div>

                                        <div className="absolute bottom-2.5 left-3.5 right-3.5">
                                            <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                                {routine.badge}
                                            </span>
                                            <h4 className="text-sm font-bold text-white mt-1 line-clamp-1">
                                                {routine.title}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
                                        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-400 dark:text-white/40">
                                            <span className="flex items-center gap-1 text-orange-500">
                                                <Flame className="w-3.5 h-3.5" /> ~{routine.calories} kcal
                                            </span>
                                            <span className="flex items-center gap-1 text-emerald-600 dark:text-green-400">
                                                <Clock className="w-3.5 h-3.5" /> {routine.duration}
                                            </span>
                                            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                <Activity className="w-3.5 h-3.5" /> {routine.exercises.length} moves
                                            </span>
                                        </div>

                                        <div className="space-y-1 bg-slate-50 dark:bg-black/40 p-2.5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-white/10">
                                            {routine.exercises.slice(0, 3).map((ex, idx) => (
                                                <div key={idx} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                                                    <span className="truncate font-medium">· {ex.name}</span>
                                                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">{ex.target}</span>
                                                </div>
                                            ))}
                                            {routine.exercises.length > 3 && (
                                                <p className="text-[10px] text-slate-400 italic pt-0.5">
                                                    + {routine.exercises.length - 3} more movements
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setActiveWorkout(routine)}
                                            className="btn-primary w-full text-xs py-2.5 rounded-xl flex items-center justify-center gap-2"
                                        >
                                            <Play className="w-3.5 h-3.5 fill-current" />
                                            <span>Start Routine (+15 🪙)</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: EXERCISE LIBRARY with Edge-to-Edge Filled Images */}
            {activeTab === 'library' && (
                <div className="space-y-5">
                    {/* Search and Category filters */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full sm:flex-wrap">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                                        selectedCategory === cat.id
                                            ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                                            : 'bg-slate-100 dark:bg-[#0c241a] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-emerald-950/60 border border-transparent dark:border-white/10'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 w-3.5 h-3.5" />
                            <input
                                type="text"
                                placeholder="Search exercises..."
                                className="input-field pl-9 py-2 text-xs w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
                        {filteredExercises.map((ex, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedExercise(ex)}
                                className="card card-hover p-0 overflow-hidden rounded-2xl cursor-pointer group border border-slate-200/50 dark:border-white/10 dark:bg-[#0c241a]/90"
                            >
                                <div className="h-32 sm:h-44 w-full relative overflow-hidden">
                                    <img
                                        src={ex.image}
                                        alt={ex.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover object-center select-none"
                                    />
                                    <span className="absolute top-2 left-2 text-[9px] font-bold bg-black/70 text-white px-2 py-0.5 rounded-lg backdrop-blur-xs border border-white/10">
                                        {ex.category}
                                    </span>
                                </div>
                                <div className="p-2.5 sm:p-3 space-y-0.5">
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                                        {ex.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 truncate">
                                        {ex.muscle}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: CUSTOMIZE ACTIVITY & WORKOUT BUILDER */}
            {activeTab === 'custom' && (
                <div className="space-y-5 sm:space-y-6">
                    {/* Header Banner & CTA */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 text-white shadow-xl">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] sm:text-xs font-bold">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Personalized Daily Workouts</span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                                Customize Activity & Exercise Routines
                            </h3>
                            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                                Build your own workout sessions matching your schedule, available equipment, and target muscles. Run them anytime with guided timers!
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setEditingRoutine(null);
                                setIsBuilderOpen(true);
                            }}
                            className="btn-primary py-2.5 sm:py-3 px-4 sm:px-5 text-xs font-bold whitespace-nowrap flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 shrink-0 w-full sm:w-auto"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>Create Custom Routine</span>
                        </button>
                    </div>

                    {/* Custom Routines Grid */}
                    <div>
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                My Custom Workouts ({filteredCustomRoutines.length})
                            </h4>
                            <span className="text-xs text-slate-400">
                                Stored on your device
                            </span>
                        </div>

                        {filteredCustomRoutines.length === 0 ? (
                            <div className="card p-8 sm:p-10 rounded-2xl sm:rounded-3xl border border-dashed border-slate-300 dark:border-white/10 text-center space-y-3 dark:bg-[#0c241a]/40">
                                <SlidersHorizontal className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto" />
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                                        No custom workouts yet
                                    </h4>
                                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                        Click below to craft your very first personalized exercise sequence with custom timers and form cues.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingRoutine(null);
                                        setIsBuilderOpen(true);
                                    }}
                                    className="btn-primary py-2.5 px-5 text-xs font-bold inline-flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Build Routine</span>
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {filteredCustomRoutines.map((routine) => (
                                    <div
                                        key={routine.id}
                                        className="card card-hover p-0 overflow-hidden rounded-2xl sm:rounded-3xl flex flex-col justify-between group border border-slate-200/50 dark:border-white/10 dark:bg-[#0c241a]/90"
                                    >
                                        <div className="relative h-44 sm:h-56 overflow-hidden w-full">
                                            <img
                                                src={routine.coverImage}
                                                alt={routine.title}
                                                loading="lazy"
                                                className="w-full h-full object-cover object-center select-none"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
                                            
                                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingRoutine(routine);
                                                        setIsBuilderOpen(true);
                                                    }}
                                                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-emerald-600 transition-colors"
                                                    title="Edit Routine"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteRoutine(routine.id)}
                                                    className="p-1.5 rounded-lg bg-black/60 text-rose-300 hover:bg-rose-600 hover:text-white transition-colors"
                                                    title="Delete Routine"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <div className="absolute bottom-2.5 left-3.5 right-3.5">
                                                <span className="text-[9px] sm:text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-lg uppercase tracking-wider">
                                                    {routine.badge || 'Custom'}
                                                </span>
                                                <h4 className="text-sm font-bold text-white mt-1 line-clamp-1">
                                                    {routine.title}
                                                </h4>
                                            </div>
                                        </div>

                                        <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
                                            <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-400 dark:text-white/40">
                                                <span className="flex items-center gap-1 text-orange-500">
                                                    <Flame className="w-3.5 h-3.5" /> ~{routine.calories} kcal
                                                </span>
                                                <span className="flex items-center gap-1 text-emerald-600 dark:text-green-400">
                                                    <Clock className="w-3.5 h-3.5" /> {routine.duration}
                                                </span>
                                                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                    <Activity className="w-3.5 h-3.5" /> {routine.exercises?.length || 0} moves
                                                </span>
                                            </div>

                                            <div className="space-y-1 bg-slate-50 dark:bg-black/40 p-2.5 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-white/10">
                                                {routine.exercises?.slice(0, 3).map((ex, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                                                        <span className="truncate font-medium">· {ex.name}</span>
                                                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">{ex.target}</span>
                                                    </div>
                                                ))}
                                                {(routine.exercises?.length || 0) > 3 && (
                                                    <p className="text-[10px] text-slate-400 italic pt-0.5">
                                                        + {routine.exercises.length - 3} more movements
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => setActiveWorkout(routine)}
                                                className="btn-primary w-full text-xs py-2.5 rounded-xl flex items-center justify-center gap-2"
                                            >
                                                <Play className="w-3.5 h-3.5 fill-current" />
                                                <span>Start Routine (+15 🪙)</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 4: ACTIVITY & HEALTHCOINS */}
            {activeTab === 'activity' && (
                <div className="space-y-5 sm:space-y-6">
                    {/* Metric Cards Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full">
                        <div className="metric-card w-full p-3.5 sm:p-5">
                            <div className="metric-val text-amber-500 font-bold text-base sm:text-xl">
                                {isTodayWorkoutDone ? 'Done ✅' : 'Pending'}
                            </div>
                            <div className="metric-lbl text-[10px] sm:text-xs">Today's Session</div>
                            <span className="text-[10px] sm:text-xs text-slate-400 font-medium">{isTodayWorkoutDone ? '+15 🪙 claimed' : '+15 🪙 available'}</span>
                        </div>
                        <div className="metric-card w-full p-3.5 sm:p-5">
                            <div className="metric-val text-emerald-600 dark:text-green-400 text-base sm:text-xl">
                                {summary?.stats?.workout_days || 0}
                            </div>
                            <div className="metric-lbl text-[10px] sm:text-xs">Total Workouts</div>
                            <span className="text-[10px] sm:text-xs text-slate-400 font-medium">completed days</span>
                        </div>
                        <div className="metric-card w-full p-3.5 sm:p-5">
                            <div className="metric-val text-base sm:text-xl">
                                +{((summary?.stats?.workout_days || 0) * 15)} 🪙
                            </div>
                            <div className="metric-lbl text-[10px] sm:text-xs">Workout Coins</div>
                            <span className="text-[10px] sm:text-xs text-slate-400 font-medium">earned</span>
                        </div>
                        <div className="metric-card w-full p-3.5 sm:p-5">
                            <div className="metric-val text-emerald-600 dark:text-green-400 uppercase text-base sm:text-xl">
                                {userGoal}
                            </div>
                            <div className="metric-lbl text-[10px] sm:text-xs">Target Goal</div>
                            <span className="text-[10px] sm:text-xs text-slate-400 font-medium">tailored plan</span>
                        </div>
                    </div>

                    {/* How rewards work card */}
                    <div className="card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/50 dark:border-white/10 dark:bg-[#0c241a]/90 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
                                🪙
                            </div>
                            <div>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                    How Daily Workout Rewards Work
                                </h4>
                                <p className="text-[11px] sm:text-xs text-slate-400">
                                    Consistency is rewarded with HealthCoins you can redeem for premium AI features
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1 sm:pt-2 text-xs text-slate-600 dark:text-slate-300">
                            <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/10 space-y-1">
                                <span className="font-bold text-slate-900 dark:text-white block">1. Pick or Build a Routine</span>
                                <p className="text-slate-400 text-[10px] sm:text-[11px]">Select any guided session or custom workout.</p>
                            </div>
                            <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/10 space-y-1">
                                <span className="font-bold text-slate-900 dark:text-white block">2. Follow the Timer</span>
                                <p className="text-slate-400 text-[10px] sm:text-[11px]">Execute exercises with 15s rest breaks in between.</p>
                            </div>
                            <div className="p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/10 space-y-1">
                                <span className="font-bold text-slate-900 dark:text-white block">3. Earn +15 Coins</span>
                                <p className="text-slate-400 text-[10px] sm:text-[11px]">Automatic logging & coin reward on completion.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
