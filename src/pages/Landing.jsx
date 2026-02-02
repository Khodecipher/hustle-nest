import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coins, Users, Wallet, TrendingUp, ChevronRight, Shield, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function Landing() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      localStorage.setItem('referralCode', ref);
    }

    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      setIsLoggedIn(isAuth);
    } catch (err) {
      setIsLoggedIn(false);
    }
    setLoading(false);
  };

  const handleGetStarted = () => {
    if (isLoggedIn) {
      window.location.href = createPageUrl("Dashboard");
    } else {
      window.location.href = createPageUrl("Register");
    }
  };

  const features = [
    { icon: Coins, title: "Earn Daily", desc: "Tap coins daily to earn up to 1,500 coins" },
    { icon: Users, title: "Refer & Earn", desc: "Invite friends and meet withdrawal targets" },
    { icon: Wallet, title: "Weekly Payouts", desc: "Withdraw every Saturday with 2+ referrals" },
    { icon: TrendingUp, title: "Grow Together", desc: "Join 10,000+ hustlers earning daily" }
  ];

  const steps = [
    { num: "01", title: "Register & Pay", desc: "One-time ₦10,000 registration fee" },
    { num: "02", title: "Tap Daily", desc: "Earn 1,500 coins every day (Sun-Fri)" },
    { num: "03", title: "Refer Friends", desc: "Get 2 referrals weekly to withdraw" },
    { num: "04", title: "Cash Out", desc: "Withdraw earnings every Saturday" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Hustle Nest</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => base44.auth.redirectToLogin(createPageUrl("Payment"))}
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-800"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => window.location.href = createPageUrl("Register")}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 pb-24">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">Join 10,000+ Hustlers</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Turn Your Taps Into
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent"> Real Cash</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10">
              Simple tap-to-earn system. Complete daily tasks, refer friends, and withdraw weekly. 
              Start your hustle journey today!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-lg px-8 py-6 rounded-xl"
              >
                {isLoggedIn ? "Go to Dashboard" : "Start Earning Now"}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <div className="flex items-center gap-2 text-white/50">
                <Shield className="w-5 h-5" />
                <span>Secure & Verified</span>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-16"
          >
            {[
              { value: "₦10K", label: "Registration" },
              { value: "1,500", label: "Daily Coins" },
              { value: "Weekly", label: "Payouts" }
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                <p className="text-2xl md:text-3xl font-bold text-amber-400">{stat.value}</p>
                <p className="text-white/50 text-sm">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Why Choose Hustle Nest?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-amber-500/30 transition-all"
              >
                <div className="p-3 bg-amber-500/10 rounded-xl w-fit mb-4">
                  <feature.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-white/50">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            How It Works
          </h2>
          <p className="text-white/50 text-center mb-12 max-w-xl mx-auto">
            Simple 4-step process to start earning
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6">
                  <span className="text-5xl font-bold text-amber-500/20">{step.num}</span>
                  <h3 className="text-lg font-semibold text-white mt-2">{step.title}</h3>
                  <p className="text-white/50 text-sm mt-2">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-slate-700" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-8 md:p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Hustling?
            </h2>
            <p className="text-white/80 mb-8 max-w-lg mx-auto">
              Join thousands of users already earning daily. One-time registration fee of ₦10,000 to get started.
            </p>
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-white text-amber-600 hover:bg-white/90 text-lg px-8 py-6 rounded-xl font-semibold"
            >
              {isLoggedIn ? "Go to Dashboard" : "Join Hustle Nest"}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
              <Coins className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">Hustle Nest</span>
          </div>
          <p className="text-white/40 text-sm">© 2024 Hustle Nest. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}