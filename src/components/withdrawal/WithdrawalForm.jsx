import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NIGERIAN_BANKS = [
  "Access Bank", "Citibank", "Ecobank", "Fidelity Bank", "First Bank",
  "First City Monument Bank", "Guaranty Trust Bank", "Heritage Bank",
  "Keystone Bank", "Polaris Bank", "Providus Bank", "Stanbic IBTC",
  "Standard Chartered", "Sterling Bank", "Union Bank", "United Bank for Africa",
  "Unity Bank", "Wema Bank", "Zenith Bank", "Opay", "Palmpay", "Kuda Bank", "Moniepoint"
];

export default function WithdrawalForm({ 
  totalCoins, 
  canWithdraw, 
  referralCount,
  requiredReferrals,
  savedBankDetails,
  onSubmit,
  isSubmitting 
}) {
  const [bankName, setBankName] = useState(savedBankDetails?.bank_name || "");
  const [accountNumber, setAccountNumber] = useState(savedBankDetails?.account_number || "");
  const [accountName, setAccountName] = useState(savedBankDetails?.account_name || "");

  // 1 coin = 1 Naira for simplicity
  const withdrawableAmount = totalCoins;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canWithdraw) return;
    
    onSubmit({
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
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
                You have {referralCount} referrals and ₦{withdrawableAmount.toLocaleString()} available.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-white/70">Bank Name</Label>
          <Select value={bankName} onValueChange={setBankName}>
            <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-1.5">
              <SelectValue placeholder="Select your bank" />
            </SelectTrigger>
            <SelectContent>
              {NIGERIAN_BANKS.map(bank => (
                <SelectItem key={bank} value={bank}>{bank}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white/70">Account Number</Label>
          <Input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Enter 10-digit account number"
            maxLength={10}
            className="bg-slate-900/50 border-slate-700 text-white mt-1.5"
          />
        </div>

        <div>
          <Label className="text-white/70">Account Name</Label>
          <Input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Enter account holder name"
            className="bg-slate-900/50 border-slate-700 text-white mt-1.5"
          />
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-white/70">Amount to withdraw</span>
            <span className="text-2xl font-bold text-green-400">₦{withdrawableAmount.toLocaleString()}</span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={!canWithdraw || isSubmitting || !bankName || !accountNumber || !accountName}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Request Withdrawal"}
        </Button>
      </form>
    </motion.div>
  );
}