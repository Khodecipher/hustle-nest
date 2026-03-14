import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles } from "lucide-react";

export default function CoinTapper({ coinsEarned, maxCoins, onTap, disabled }) {
  const [tapAnimations, setTapAnimations] = useState([]);
  const [isPressed, setIsPressed] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const progress = (coinsEarned / maxCoins) * 100;
  const remaining = maxCoins - coinsEarned;

  const handleTap = (e) => {
    if (disabled || coinsEarned >= maxCoins || isCooldown) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newAnimation = {
      id: Date.now() + Math.random(),
      x,
      y,
      value: "+10"
    };
    
    setTapAnimations(prev => [...prev, newAnimation]);
    
    // Set cooldown to prevent rate limiting
    setIsCooldown(true);
    
    // Call onTap
    if (onTap) {
      onTap();
    }
    
    setTimeout(() => {
      setTapAnimations(prev => prev.filter(a => a.id !== newAnimation.id));
    }, 1000);
    
    // 500ms cooldown between taps
    setTimeout(() => {
      setIsCooldown(false);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Progress Ring */}
      <div className="relative mb-6">
        <svg className="w-64 h-64 transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
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
          disabled={disabled || coinsEarned >= maxCoins || isCooldown}
          animate={{ scale: isPressed ? 0.95 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`absolute inset-8 rounded-full flex flex-col items-center justify-center transition-all ${
            disabled || coinsEarned >= maxCoins
              ? "bg-gray-700 cursor-not-allowed"
              : "bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 cursor-pointer active:shadow-orange-500/60"
          }`}
        >
          <Coins className="w-16 h-16 text-white mb-2" />
          <span className="text-white text-3xl font-bold">{coinsEarned}</span>
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
                  {anim.value}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.button>
      </div>
      
      {/* Status */}
      <div className="text-center">
        {coinsEarned >= maxCoins ? (
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