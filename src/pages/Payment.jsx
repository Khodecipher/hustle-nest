import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coins, Upload, CheckCircle, AlertCircle, Copy, ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const USDT_ADDRESS = "0x1C7B3246f0bB8c23121264ca8762Ef21f2056B44";
const NETWORK = "ERC-20 (Ethereum)";

export default function Payment() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [existingPayment, setExistingPayment] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadUserAndPayment();
  }, []);

  const loadUserAndPayment = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Check if user already paid
      if (userData.has_paid) {
        window.location.href = createPageUrl("Dashboard");
        return;
      }

      // Check for existing payment
      const payments = await base44.entities.Payment.filter({
        user_email: userData.email
      });

      if (payments.length > 0) {
        setExistingPayment(payments[0]);
      }

      // Generate referral code if not exists
      if (!userData.referral_code) {
        const code = generateReferralCode(userData.email);
        await base44.auth.updateMe({ referral_code: code });
      }

      // Check for referral from localStorage
      const storedRef = localStorage.getItem('referralCode');
      if (storedRef && !userData.referred_by) {
        await base44.auth.updateMe({ referred_by: storedRef });
      }

    } catch (err) {
      toast.error("Please log in to continue");
      base44.auth.redirectToLogin(createPageUrl("Payment"));
    }
    setLoading(false);
  };

  const generateReferralCode = (email) => {
    const prefix = email.split('@')[0].substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${random}`;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPaymentProof(file_url);
      toast.success("Proof uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload file");
    }
    setUploading(false);
  };

  const submitPayment = async () => {
    if (!paymentProof) {
      toast.error("Please upload payment proof");
      return;
    }

    setUploading(true);
    try {
      // Check for existing pending payment
      const existingPayments = await base44.entities.Payment.filter({
        user_email: user.email,
        status: "pending"
      });

      if (existingPayments.length > 0) {
        // Update existing
        await base44.entities.Payment.update(existingPayments[0].id, {
          payment_proof: paymentProof
        });
      } else {
        // Create new
        await base44.entities.Payment.create({
          user_email: user.email,
          amount: 10000,
          status: "pending",
          payment_proof: paymentProof
        });
      }

      // Notify admin
      await base44.integrations.Core.SendEmail({
        to: "lavezziomotola@gmail.com",
        subject: "New Payment Proof Submitted",
        body: `A new payment proof has been submitted on Hustle Nest.\n\nUser: ${user.full_name || user.email}\nEmail: ${user.email}\n\nPlease log in to the admin panel to review and confirm the payment.`
      });

      toast.success("Payment submitted for verification!");
      loadUserAndPayment();
    } catch (err) {
      toast.error("Failed to submit payment");
    }
    setUploading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Header */}
        <Link to={createPageUrl("Landing")} className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-4">
            <Coins className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Complete Registration</h1>
          <p className="text-white/60 mt-2">One-time payment of ₦10,000 to activate your account</p>
        </motion.div>

        {/* Payment Status */}
        {existingPayment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-5 mb-6 ${
              existingPayment.status === 'pending' 
                ? 'bg-amber-500/10 border border-amber-500/30'
                : existingPayment.status === 'rejected'
                ? 'bg-red-500/10 border border-red-500/30'
                : 'bg-green-500/10 border border-green-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              {existingPayment.status === 'pending' ? (
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              ) : existingPayment.status === 'rejected' ? (
                <AlertCircle className="w-10 h-10 text-red-500" />
              ) : (
                <CheckCircle className="w-10 h-10 text-green-500" />
              )}
              <div>
                <p className={`font-semibold ${
                  existingPayment.status === 'pending' ? 'text-amber-400' :
                  existingPayment.status === 'rejected' ? 'text-red-400' : 'text-green-400'
                }`}>
                  {existingPayment.status === 'pending' ? 'Payment Under Review' :
                   existingPayment.status === 'rejected' ? 'Payment Rejected' : 'Payment Confirmed'}
                </p>
                <p className="text-white/50 text-sm">
                  {existingPayment.status === 'pending' 
                    ? 'Your payment is being verified. This may take a few hours.'
                    : existingPayment.status === 'rejected'
                    ? 'Please upload a valid payment proof below.'
                    : 'Redirecting to dashboard...'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50 mb-4"
        >
          <h2 className="text-lg font-semibold text-white mb-1">USDT Wallet Address</h2>
          <p className="text-white/50 text-sm mb-4">Network: <span className="text-amber-400 font-semibold">{NETWORK}</span></p>

          <div className="bg-slate-900/70 rounded-xl p-4 border border-slate-700 mb-4">
            <p className="text-white/50 text-xs mb-2">Send USDT to this address:</p>
            <p className="text-white font-mono text-sm break-all leading-relaxed">{USDT_ADDRESS}</p>
            <Button
              onClick={() => copyToClipboard(USDT_ADDRESS)}
              className="mt-3 w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
              variant="ghost"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Copied!" : "Copy Address"}
            </Button>
          </div>

          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30 mb-4">
            <p className="text-amber-400 text-sm font-medium">Amount to Pay</p>
            <p className="text-3xl font-bold text-amber-400 mt-1">₦10,000</p>
            <p className="text-white/50 text-xs mt-1">Equivalent in USDT via Pursa Exchange</p>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-xs">Only send on the <strong>{NETWORK}</strong> network. Sending on the wrong network will result in permanent loss of funds.</p>
          </div>
        </motion.div>

        {/* Step by Step Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50 mb-4"
        >
          <h2 className="text-lg font-semibold text-white mb-4">How to Pay via Pursa Exchange</h2>
          <div className="space-y-4">
            {[
              {
                num: "01",
                title: "Go to Pursa",
                desc: "Visit the Pursa Exchange website.",
                action: { label: "Open Pursa", url: "https://pursa.co" }
              },
              {
                num: "02",
                title: "Select USDT",
                desc: "Choose Tether (USDT) as the cryptocurrency you want to buy."
              },
              {
                num: "03",
                title: "Enter Amount",
                desc: "Input ₦10,000. The system will automatically show the USDT equivalent."
              },
              {
                num: "04",
                title: "Paste Wallet Address",
                desc: `Copy and paste the USDT wallet address above. Make sure to select the ${NETWORK} network.`
              },
              {
                num: "05",
                title: "Make Payment",
                desc: "Follow the bank transfer details shown on Pursa and complete the payment."
              },
              {
                num: "06",
                title: "Upload Proof & Submit",
                desc: "Take a screenshot of your payment confirmation and upload it below."
              }
            ].map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0">
                  <span className="text-2xl font-bold text-amber-500/30">{step.num}</span>
                </div>
                <div className="flex-1 pb-4 border-b border-slate-700/50 last:border-0">
                  <p className="text-white font-semibold">{step.title}</p>
                  <p className="text-white/50 text-sm mt-1">{step.desc}</p>
                  {step.action && (
                    <a
                      href={step.action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-amber-400 text-sm hover:text-amber-300"
                    >
                      {step.action.label} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upload Proof Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Upload Payment Proof</h2>

          <div className="mb-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-xl hover:border-amber-500/50 transition-colors cursor-pointer bg-slate-900/30">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {paymentProof ? (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Proof uploaded</span>
                </div>
              ) : uploading ? (
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="flex flex-col items-center text-white/50">
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm">Click to upload screenshot</span>
                </div>
              )}
            </label>
          </div>

          <Button
            onClick={submitPayment}
            disabled={!paymentProof || uploading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            {uploading ? "Processing..." : "Submit Payment"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}