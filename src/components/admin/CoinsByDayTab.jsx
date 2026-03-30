import { useState, useMemo } from "react";
import { Coins, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function CoinsByDayTab({ dailyEarnings, users }) {
  const [selectedUser, setSelectedUser] = useState("all");

  const userOptions = useMemo(() => {
    const emails = [...new Set(dailyEarnings.map(e => e.user_email))].sort();
    return emails;
  }, [dailyEarnings]);

  const { byDay, grandTotal } = useMemo(() => {
    const filtered = selectedUser === "all" 
      ? dailyEarnings 
      : dailyEarnings.filter(e => e.user_email === selectedUser);

    // Group by date, taking max coins per user per day
    const userDateMap = {};
    filtered.forEach(e => {
      const key = `${e.user_email}_${e.date}`;
      if (!userDateMap[key] || e.coins_earned > userDateMap[key].coins_earned) {
        userDateMap[key] = e;
      }
    });

    // Now group by date
    const dateMap = {};
    Object.values(userDateMap).forEach(e => {
      if (!dateMap[e.date]) {
        dateMap[e.date] = { date: e.date, totalCoins: 0, userCount: 0, users: new Set() };
      }
      dateMap[e.date].totalCoins += e.coins_earned;
      dateMap[e.date].users.add(e.user_email);
    });

    const sorted = Object.values(dateMap)
      .map(d => ({ ...d, userCount: d.users.size }))
      .sort((a, b) => b.date.localeCompare(a.date));

    const total = sorted.reduce((sum, d) => sum + d.totalCoins, 0);

    return { byDay: sorted, grandTotal: total };
  }, [dailyEarnings, selectedUser]);

  // For selected user, find their total_coins and total_withdrawn
  const selectedUserData = useMemo(() => {
    if (selectedUser === "all") return null;
    return users.find(u => u.email === selectedUser);
  }, [selectedUser, users]);

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm flex-1 max-w-xs"
        >
          <option value="all">All Users</option>
          {userOptions.map(email => (
            <option key={email} value={email}>{email}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4">
          <Coins className="w-5 h-5 text-white/80 mb-1" />
          <p className="text-white/80 text-xs">Total Coins Earned</p>
          <p className="text-white text-xl font-bold">{grandTotal.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4">
          <Calendar className="w-5 h-5 text-white/80 mb-1" />
          <p className="text-white/80 text-xs">Days Active</p>
          <p className="text-white text-xl font-bold">{byDay.length}</p>
        </div>
        {selectedUserData && (
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-4">
            <TrendingUp className="w-5 h-5 text-white/80 mb-1" />
            <p className="text-white/80 text-xs">Current Balance</p>
            <p className="text-white text-xl font-bold">{(selectedUserData.total_coins || 0).toLocaleString()}</p>
            {selectedUserData.total_withdrawn > 0 && (
              <p className="text-white/60 text-xs mt-1">Withdrawn: ₦{selectedUserData.total_withdrawn.toLocaleString()}</p>
            )}
          </div>
        )}
      </div>

      {/* Day-by-day table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-slate-800 text-white/60 text-xs font-medium uppercase">
          <span>Date</span>
          <span className="text-center">Users</span>
          <span className="text-right">Coins</span>
        </div>
        <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
          {byDay.length === 0 ? (
            <div className="text-center py-8 text-white/50 text-sm">No earnings data</div>
          ) : (
            byDay.map((day, i) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-3 gap-4 px-4 py-3 hover:bg-slate-700/30"
              >
                <span className="text-white text-sm">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-white/60 text-sm text-center">{day.userCount}</span>
                <span className="text-amber-400 text-sm font-medium text-right">
                  {day.totalCoins.toLocaleString()}
                </span>
              </motion.div>
            ))
          )}
        </div>
        {byDay.length > 0 && (
          <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-slate-800 border-t border-slate-700">
            <span className="text-white font-semibold text-sm">Total</span>
            <span></span>
            <span className="text-amber-400 font-bold text-sm text-right">{grandTotal.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}