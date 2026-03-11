import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WithdrawalForm({ 
  totalCoins, 
  canWithdraw, 
  referralCount,
  requiredReferrals,
  savedUsdtAddress,
  onSubmit,
  isSubmitting 
}) {
  const [usdtAddress, setUsdtAddress] = useState(savedUsdtAddress || "");

  const withdrawableAmount = totalCoins;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canWithdraw) return;
    onSubmit({
      usdt_address: usdtAddress,
      amount: withdrawableAmount,
      coins: totalCoins
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 border border-slate-700/50"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-green-500/20 rounded-xl">
          <Wallet className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Withdraw Earnings</h3>
          <p className="text-white/50 text-sm">Every Saturday 1:00 AM - 1:00 PM</p>
        </div>
      </div>

      {/* ERC-20 Warning */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-300 text-sm font-bold mb-1">⚠️ ERC-20 Network Only</p>
          <p className="text-red-300 text-xs leading-relaxed">
            You <strong>MUST</strong> submit a USDT <strong>ERC-20 (Ethereum)</strong> wallet address only. 
            Do <strong>NOT</strong> submit a BEP-20, TRC-20, or any other network address. 
            If you submit the wrong chain address, your funds will be sent to that address and <strong>we will NOT be liable for any lost funds</strong> resulting from your mistake. Always double-check your address and network before submitting.
          </p>
        </div>
      </div>

      {/* Status Check */}
      {!canWithdraw && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Cannot withdraw yet</p>
              <p className="text-red-400/70 text-sm mt-1">
                You need at least {requiredReferrals} referrals this week. 
                Current: {referralCount} referrals.
              </p>
            </div>
          </div>
        </div>
      )}

      {canWithdraw && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 font-medium">Ready to withdraw!</p>
              <p className="text-green-400/70 text-sm mt-1">
                You have {referralCount} referrals and {withdrawableAmount.toLocaleString()} coins available.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-white/70">USDT Wallet Address (ERC-20 only)</Label>
          <Input
            type="text"
            value={usdtAddress}
            onChange={(e) => setUsdtAddress(e.target.value)}
            placeholder="0x... (ERC-20 address)"
            className="bg-slate-900/50 border-slate-700 text-white mt-1.5 font-mono text-sm"
          />
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-white/70">Coins to convert</span>
            <span className="text-2xl font-bold text-green-400">{withdrawableAmount.toLocaleString()}</span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={!canWithdraw || isSubmitting || !usdtAddress.trim()}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Request Withdrawal"}
        </Button>
      </form>
    </motion.div>
  );
}