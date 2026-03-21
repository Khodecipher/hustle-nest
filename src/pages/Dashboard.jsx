import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coins, Users, Wallet, TrendingUp, Calendar, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

import StatsCard from "@/components/dashboard/StatsCard";
import CoinTapper from "@/components/tap/CoinTapper";
import CountdownTimer from "@/components/common/CountdownTimer";
import ReferralCard from "@/components/referral/ReferralCard";
import WithdrawalForm from "@/components/withdrawal/WithdrawalForm";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyEarning, setDailyEarning] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [weeklyReferrals, setWeeklyReferrals] = useState(0);
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);

  const MAX_DAILY_COINS = 1700;
  const WEEKLY_REFERRAL_TARGET = 2;
  const MONTHLY_REFERRAL_TARGET = 8;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      
      // Check if user has paid
      if (!userData.has_paid) {
        window.location.href = createPageUrl("Payment");
        return;
      }
      
      setUser(userData);

      // Generate referral code if not exists
      if (!userData.referral_code) {
        const code = generateReferralCode(userData.email);
        await base44.auth.updateMe({ referral_code: code });
        userData.referral_code = code;
        setUser({ ...userData });
      }

      // Load today's earning
      const today = new Date().toISOString().split('T')[0];
      const earnings = await base44.entities.DailyEarning.filter({
        user_email: userData.email,
        date: today
      });
      
      if (earnings.length > 0) {
        setDailyEarning(earnings[0]);
      }

      // Load ALL referrals (confirmed)
      const allReferrals = await base44.entities.Referral.filter({
        referrer_email: userData.email,
        status: "confirmed"
      });
      setReferrals(allReferrals);

      // Active referrals = confirmed but not yet used in a withdrawal
      const activeRefs = allReferrals.filter(r => !r.counted_for_withdrawal);
      setWeeklyReferrals(activeRefs.length);

      // Check for pending withdrawal
      const withdrawals = await base44.entities.Withdrawal.filter({
        user_email: userData.email,
        status: "pending"
      });
      if (withdrawals.length > 0) {
        setPendingWithdrawal(withdrawals[0]);
      }

    } catch (err) {
      toast.error("Please log in to continue");
      base44.auth.redirectToLogin(createPageUrl("Dashboard"));
    }
    setLoading(false);
  };

  const generateReferralCode = (email) => {
    const prefix = email.split('@')[0].substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${random}`;
  };

  const handleCoinsUpdate = (newDailyCoins) => {
    setUser(prev => {
      // delta = new daily coins minus what daily was before this update
      const prevDaily = dailyEarning?.coins_earned || 0;
      const delta = newDailyCoins - prevDaily;
      const newTotal = Math.max(0, (prev?.total_coins || 0) + delta);
      // Persist total to user profile
      base44.auth.updateMe({ total_coins: newTotal }).catch(() => {});
      return { ...prev, total_coins: newTotal };
    });
    setDailyEarning(prev => ({ ...prev, coins_earned: newDailyCoins }));
  };

  const canTapToday = () => {
    const now = new Date();
    const day = now.getDay();
    return day !== 6; // Sunday (0) to Friday (5), no tapping on Saturday
  };

  const isWithdrawalWindow = () => {
    const now = new Date();
    const day = now.getDay();
    // Open from Saturday all day through Sunday midnight (end of Sunday)
    return day === 6 || day === 0;
  };

  const getNextWithdrawalDate = () => {
    const now = new Date();
    const day = now.getDay();
    
    // If it's Mon–Fri, count days until Saturday
    let daysUntilSaturday;
    if (day === 6 || day === 0) {
      // Already in window, shouldn't show countdown
      daysUntilSaturday = 0;
    } else {
      // Monday(1)–Friday(5): days until Saturday
      daysUntilSaturday = 6 - day;
    }
    
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    nextSaturday.setHours(0, 0, 0, 0);
    
    return nextSaturday;
  };

  const handleWithdrawal = async (formData) => {
    setSubmittingWithdrawal(true);
    try {
      // Save USDT address to user profile
      await base44.auth.updateMe({
        usdt_address: formData.usdt_address
      });

      // Get current week number
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);

      // Create withdrawal request
      const withdrawal = await base44.entities.Withdrawal.create({
        user_email: user.email,
        amount: formData.amount,
        coins_converted: formData.coins,
        referrals_used: weeklyReferrals,
        status: "pending",
        usdt_address: formData.usdt_address,
        week_number: weekNumber
      });

      // Mark referrals as used
      const unusedReferrals = referrals.filter(r => !r.counted_for_withdrawal).slice(0, WEEKLY_REFERRAL_TARGET);
      for (const ref of unusedReferrals) {
        await base44.entities.Referral.update(ref.id, {
          counted_for_withdrawal: true
        });
      }

      // Reset user's total coins
      await base44.auth.updateMe({
        total_coins: 0,
        total_withdrawn: (user.total_withdrawn || 0) + formData.amount
      });

      toast.success("Withdrawal request submitted!");
      setPendingWithdrawal(withdrawal);
      loadData();

    } catch (err) {
      toast.error("Failed to submit withdrawal");
    }
    setSubmittingWithdrawal(false);
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Landing"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalCoins = user?.total_coins || 0;
  const todayCoins = dailyEarning?.coins_earned || 0;

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">Hustle Nest</p>
              <p className="text-white/50 text-xs">{user?.full_name || user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.href = createPageUrl("Admin")}
                className="text-white/60 hover:text-white hover:bg-slate-800"
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-white/60 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            icon={Coins}
            label="Total Coins"
            value={totalCoins.toLocaleString()}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            delay={0}
          />
          <StatsCard
            icon={Calendar}
            label="Today's Coins"
            value={`${todayCoins}/${MAX_DAILY_COINS}`}
            gradient="bg-gradient-to-br from-blue-500 to-cyan-600"
            delay={0.1}
          />
          <StatsCard
            icon={Users}
            label="Referrals"
            value={`${weeklyReferrals}/${WEEKLY_REFERRAL_TARGET}`}
            gradient="bg-gradient-to-br from-purple-500 to-pink-600"
            delay={0.2}
          />
          <StatsCard
            icon={Wallet}
            label="Total Withdrawn"
            value={`₦${(user?.total_withdrawn || 0).toLocaleString()}`}
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
            delay={0.3}
          />
        </div>

        {/* Pending Withdrawal Alert */}
        {pendingWithdrawal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div>
                <p className="text-amber-400 font-semibold">Withdrawal Pending</p>
                <p className="text-amber-400/70 text-sm">
                  ₦{pendingWithdrawal.amount.toLocaleString()} is being processed
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="earn" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700 p-1 w-full grid grid-cols-3">
            <TabsTrigger value="earn" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">
              Earn
            </TabsTrigger>
            <TabsTrigger value="refer" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              Refer
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earn" className="mt-6">
            <div className="flex flex-col items-center">
              {/* Countdown */}
              {!canTapToday() && (
                <div className="w-full max-w-md mb-6">
                  <CountdownTimer
                    targetDate={getNextSunday()}
                    label="Tapping resumes in"
                  />
                </div>
              )}
              
              {/* Coin Tapper */}
              <CoinTapper
                coinsEarned={todayCoins}
                maxCoins={MAX_DAILY_COINS}
                userEmail={user?.email}
                dailyEarning={dailyEarning}
                onCoinsUpdate={handleCoinsUpdate}
                disabled={!canTapToday()}
              />
            </div>
          </TabsContent>

          <TabsContent value="refer" className="mt-6">
            <div className="max-w-md mx-auto">
              <ReferralCard
                referralCode={user?.referral_code || ""}
                referralCount={weeklyReferrals}
                weeklyTarget={WEEKLY_REFERRAL_TARGET}
                monthlyTarget={MONTHLY_REFERRAL_TARGET}
              />

              {/* Referral List */}
              {referrals.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50"
                >
                  <h3 className="text-white font-semibold mb-4">Recent Referrals</h3>
                  <div className="space-y-3">
                    {referrals.slice(0, 5).map((ref, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <span className="text-purple-400 text-sm font-medium">
                              {ref.referred_name?.[0]?.toUpperCase() || "U"}
                            </span>
                          </div>
                          <span className="text-white/80">{ref.referred_name || ref.referred_email}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          ref.counted_for_withdrawal 
                            ? 'bg-gray-500/20 text-gray-400' 
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {ref.counted_for_withdrawal ? 'Used' : 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="withdraw" className="mt-6">
            <div className="max-w-md mx-auto">
              {/* Withdrawal Window Countdown */}
              {!isWithdrawalWindow() && (
                <div className="mb-6">
                  <CountdownTimer
                    targetDate={getNextWithdrawalDate()}
                    label="Next withdrawal window"
                  />
                </div>
              )}

              {isWithdrawalWindow() ? (
                <WithdrawalForm
                  totalCoins={totalCoins}
                  canWithdraw={weeklyReferrals >= WEEKLY_REFERRAL_TARGET && totalCoins > 0 && !pendingWithdrawal}
                  referralCount={weeklyReferrals}
                  requiredReferrals={WEEKLY_REFERRAL_TARGET}
                  savedUsdtAddress={user?.usdt_address}
                  onSubmit={handleWithdrawal}
                  isSubmitting={submittingWithdrawal}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 text-center"
                >
                  <Wallet className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">Withdrawal Window Closed</h3>
                  <p className="text-white/50 text-sm">
                    Withdrawals are only available on Saturdays and Sundays.
                    Keep earning and referring to maximize your payout!
                  </p>
                </motion.div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function getNextSunday() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(0, 0, 0, 0);
  return nextSunday;
}