import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coins, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      localStorage.setItem('referralCode', ref);
    } else {
      const stored = localStorage.getItem('referralCode');
      if (stored) setReferralCode(stored);
    }
  }, []);

  const handleRegister = () => {
    setLoading(true);
    base44.auth.redirectToLogin(createPageUrl("Payment"));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-4">
            <Coins className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join Hustle Nest</h1>
          <p className="text-white/50 mt-2">Create your account to start earning</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50 mb-6">
          <h3 className="text-white font-semibold mb-4">How it works:</h3>
          <div className="space-y-3">
            {[
              { step: "1", text: "Click 'Create Account' to register" },
              { step: "2", text: "Pay ₦10,000 registration fee" },
              { step: "3", text: "Upload payment proof" },
              { step: "4", text: "Admin approves, then you can start earning!" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 text-sm font-bold">{item.step}</span>
                </div>
                <p className="text-white/70 text-sm">{item.text}</p>
              </div>
            ))}
          </div>

          {referralCode && (
            <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
              <p className="text-green-400 text-sm">
                🎉 Referral code applied: <span className="font-bold">{referralCode}</span>
              </p>
            </div>
          )}
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-white/70">Registration Fee</span>
            <span className="text-2xl font-bold text-amber-400">₦10,000</span>
          </div>
          <p className="text-white/50 text-xs mt-2">One-time payment to activate your account</p>
        </div>

        <Button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white py-6 text-lg"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Create Account"
          )}
        </Button>

        <div className="text-center mt-6">
          <Link to={createPageUrl("Landing")} className="text-white/50 hover:text-white text-sm inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}