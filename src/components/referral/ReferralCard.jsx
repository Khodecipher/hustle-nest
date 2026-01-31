import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Share2, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ReferralCard({ referralCode, referralCount, weeklyTarget, monthlyTarget }) {
  const [copied, setCopied] = useState(false);
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Hustle Nest",
          text: "Start earning with Hustle Nest! Use my referral link:",
          url: referralLink
        });
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const weeklyProgress = Math.min((referralCount / weeklyTarget) * 100, 100);
  const monthlyProgress = Math.min((referralCount / monthlyTarget) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 border border-slate-700/50"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-purple-500/20 rounded-xl">
          <Users className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Your Referrals</h3>
          <p className="text-white/50 text-sm">{referralCount} confirmed referrals</p>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4 mb-5">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-white/70">Weekly Target</span>
            <span className="text-amber-400 font-medium">{referralCount}/{weeklyTarget}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${weeklyProgress}%` }}
              className={`h-full rounded-full ${weeklyProgress >= 100 ? 'bg-green-500' : 'bg-amber-500'}`}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-white/70">Monthly Target</span>
            <span className="text-purple-400 font-medium">{referralCount}/{monthlyTarget}</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${monthlyProgress}%` }}
              className={`h-full rounded-full ${monthlyProgress >= 100 ? 'bg-green-500' : 'bg-purple-500'}`}
            />
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-slate-900/50 rounded-xl p-3 mb-4">
        <p className="text-white/50 text-xs mb-2">Your Referral Link</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 bg-transparent text-white text-sm truncate outline-none"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={copyToClipboard}
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <Button
        onClick={shareLink}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Referral Link
      </Button>
    </motion.div>
  );
}