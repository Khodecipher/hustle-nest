import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function CountdownTimer({ targetDate, label, onComplete }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onComplete?.();
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-amber-400" />
        <span className="text-white/70 text-sm">{label}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hrs" },
          { value: timeLeft.minutes, label: "Min" },
          { value: timeLeft.seconds, label: "Sec" }
        ].map((item, i) => (
          <div key={i} className="text-center">
            <div className="bg-slate-900/50 rounded-lg py-2">
              <span className="text-white text-xl font-bold">
                {String(item.value).padStart(2, '0')}
              </span>
            </div>
            <span className="text-white/50 text-xs mt-1">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}