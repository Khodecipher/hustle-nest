import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const MAX_DAILY_COINS = 1700;
const COINS_PER_TAP = 10;
const BATCH_INTERVAL_MS = 3000;

export default function CoinTapper({ coinsEarned, maxCoins, userEmail, dailyEarning, onCoinsUpdate, disabled }) {
  const [localCoins, setLocalCoins] = useState(coinsEarned);
  const [tapAnimations, setTapAnimations] = useState([]);
  const [isPressed, setIsPressed] = useState(false);

  const pendingTapsRef = useRef(0);
  const isSavingRef = useRef(false);
  const localCoinsRef = useRef(coinsEarned);
  const tapsCountRef = useRef(dailyEarning?.taps_count || 0);

  // Sync from parent when props change (e.g. on initial load)
  useEffect(() => {
    setLocalCoins(coinsEarned);
    localCoinsRef.current = coinsEarned;
    tapsCountRef.current = dailyEarning?.taps_count || 0;
  }, [coinsEarned, dailyEarning]);

  const flushTaps = useCallback(async () => {
    if (pendingTapsRef.current === 0 || isSavingRef.current) return;
    
    isSavingRef.current = true;
    const tapsToSave = pendingTapsRef.current;
    const newCoins = Math.min(localCoinsRef.current, maxCoins);
    const newTapsCount = tapsCountRef.current;

    try {
      // Use backend function for atomic find-or-create + deduplication
      const response = await base44.functions.invoke('saveDailyTaps', {
        coins_earned: newCoins,
        taps_count: newTapsCount
      });

      // Only clear pending taps AFTER successful save
      pendingTapsRef.current -= tapsToSave;
      if (onCoinsUpdate) {
        onCoinsUpdate(newCoins, response.data.total_coins);
      }
    } catch (err) {
      toast.error("Sync failed, will retry...");
    }

    isSavingRef.current = false;
  }, [maxCoins, onCoinsUpdate]);

  // Auto-flush every BATCH_INTERVAL_MS
  useEffect(() => {
    const interval = setInterval(flushTaps, BATCH_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      flushTaps();
    };
  }, [flushTaps]);

  const handleTap = (e) => {
    if (disabled || localCoinsRef.current >= maxCoins) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newAnimation = { id: Date.now() + Math.random(), x, y };
    setTapAnimations(prev => [...prev, newAnimation]);
    setTimeout(() => {
      setTapAnimations(prev => prev.filter(a => a.id !== newAnimation.id));
    }, 800);

    const newCoins = Math.min(localCoinsRef.current + COINS_PER_TAP, maxCoins);
    localCoinsRef.current = newCoins;
    tapsCountRef.current += 1;
    pendingTapsRef.current += 1;
    setLocalCoins(newCoins);
  };

  const progress = (localCoins / maxCoins) * 100;
  const remaining = maxCoins - localCoins;

  return (
    <div className="flex flex-col items-center">
      {/* Progress Ring */}
      <div className="relative mb-6">
        <svg className="w-64 h-64 transform -rotate-90">
          <circle cx="128" cy="128" r="120" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
          <circle
            cx="128" cy="128" r="120"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>

        {/* Tap Button */}
        <motion.button
          onPointerDown={() => setIsPressed(true)}
          onPointerUp={() => setIsPressed(false)}
          onPointerLeave={() => setIsPressed(false)}
          onClick={handleTap}
          disabled={disabled || localCoins >= maxCoins}
          animate={{ scale: isPressed ? 0.95 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`absolute inset-8 rounded-full flex flex-col items-center justify-center transition-all ${
            disabled || localCoins >= maxCoins
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 cursor-pointer active:shadow-orange-500/60"
          }`}
        >
          <Coins className="w-16 h-16 text-white mb-2" />
          <span className="text-white text-3xl font-bold">{localCoins}</span>
          <span className="text-white/70 text-sm">/ {maxCoins}</span>

          {/* Floating Animations */}
          <AnimatePresence>
            {tapAnimations.map(anim => (
              <motion.div
                key={anim.id}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -60, scale: 1.5 }}
                exit={{ opacity: 0 }}
                className="absolute pointer-events-none"
                style={{ left: anim.x - 128, top: anim.y - 128 }}
              >
                <span className="text-yellow-300 font-bold text-xl flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  +10
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Status */}
      <div className="text-center">
        {localCoins >= maxCoins ? (
          <p className="text-green-400 font-semibold">🎉 Daily limit reached! Come back tomorrow.</p>
        ) : disabled ? (
          <p className="text-amber-400 font-semibold">⏰ Tapping available Sunday - Friday</p>
        ) : (
          <p className="text-white/60">Tap the coin to earn! {remaining} coins remaining today</p>
        )}
      </div>
    </div>
  );
}