import { useState, useMemo } from "react";
import { Coins, Calendar, TrendingUp, ChevronDown, ChevronRight, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CoinsByDayTab({ dailyEarnings, users }) {
  const [viewMode, setViewMode] = useState("by-day"); // "by-day" or "by-user"
  const [selectedUser, setSelectedUser] = useState("all");
  const [expandedDays, setExpandedDays] = useState(new Set());

  const userMap = useMemo(() => {
    const map = {};
    users.forEach(u => { map[u.email] = u; });
    return map;
  }, [users]);

  // Deduplicate: keep max coins per user per day
  const deduped = useMemo(() => {
    const map = {};
    dailyEarnings.forEach(e => {
      const key = `${e.user_email}_${e.date}`;
      if (!map[key] || e.coins_earned > map[key].coins_earned) {
        map[key] = e;
      }
    });
    return Object.values(map);
  }, [dailyEarnings]);

  // BY DAY view data
  const byDayData = useMemo(() => {
    const dateMap = {};
    deduped.forEach(e => {
      if (!dateMap[e.date]) {
        dateMap[e.date] = { date: e.date, totalCoins: 0, users: [] };
      }
      const userData = userMap[e.user_email];
      dateMap[e.date].totalCoins += e.coins_earned;
      dateMap[e.date].users.push({
        email: e.user_email,
        name: userData?.full_name || e.user_email,
        coinsToday: e.coins_earned,
        totalCoins: userData?.total_coins || 0
      });
    });
    return Object.values(dateMap)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(d => ({ ...d, users: d.users.sort((a, b) => b.coinsToday - a.coinsToday) }));
  }, [deduped, userMap]);

  // BY USER view data
  const byUserData = useMemo(() => {
    const filtered = selectedUser === "all" ? deduped : deduped.filter(e => e.user_email === selectedUser);
    const dateMap = {};
    filtered.forEach(e => {
      if (!dateMap[e.date]) dateMap[e.date] = { date: e.date, totalCoins: 0, userCount: new Set() };
      dateMap[e.date].totalCoins += e.coins_earned;
      dateMap[e.date].userCount.add(e.user_email);
    });
    return Object.values(dateMap)
      .map(d => ({ ...d, userCount: d.userCount.size }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [deduped, selectedUser]);

  const userOptions = useMemo(() => {
    return [...new Set(dailyEarnings.map(e => e.user_email))].sort();
  }, [dailyEarnings]);

  const grandTotal = useMemo(() => {
    const data = viewMode === "by-day" ? byDayData : byUserData;
    return data.reduce((sum, d) => sum + d.totalCoins, 0);
  }, [viewMode, byDayData, byUserData]);

  const toggleDay = (date) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Selected user stats
  const selectedUserData = selectedUser !== "all" ? userMap[selectedUser] : null;

  return (
    <div className="space-y-4">
      {/* View mode toggle + filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => setViewMode("by-day")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "by-day" ? "bg-amber-500 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            By Day
          </button>
          <button
            onClick={() => setViewMode("by-user")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "by-user" ? "bg-amber-500 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            By User
          </button>
        </div>
        {viewMode === "by-user" && (
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
        )}
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
          <p className="text-white text-xl font-bold">{viewMode === "by-day" ? byDayData.length : byUserData.length}</p>
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

      {/* BY DAY VIEW — expandable rows */}
      {viewMode === "by-day" && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-slate-800 text-white/60 text-xs font-medium uppercase">
            <span></span>
            <span>Date</span>
            <span className="text-center">Users</span>
            <span className="text-right">Total Coins</span>
          </div>
          <div className="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
            {byDayData.length === 0 ? (
              <div className="text-center py-8 text-white/50 text-sm">No earnings data</div>
            ) : (
              byDayData.map((day) => (
                <div key={day.date}>
                  <button
                    onClick={() => toggleDay(day.date)}
                    className="w-full grid grid-cols-4 gap-4 px-4 py-3 hover:bg-slate-700/30 transition-colors"
                  >
                    <span className="flex items-center">
                      {expandedDays.has(day.date) ? (
                        <ChevronDown className="w-4 h-4 text-white/50" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-white/50" />
                      )}
                    </span>
                    <span className="text-white text-sm text-left">{formatDate(day.date)}</span>
                    <span className="text-white/60 text-sm text-center">{day.users.length}</span>
                    <span className="text-amber-400 text-sm font-medium text-right">{day.totalCoins.toLocaleString()}</span>
                  </button>
                  <AnimatePresence>
                    {expandedDays.has(day.date) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-slate-900/50 border-t border-slate-700/30">
                          <div className="grid grid-cols-3 gap-4 px-4 py-2 text-white/40 text-xs uppercase">
                            <span></span>
                            <span>User</span>
                            <span className="text-right">Coins Earned</span>
                          </div>
                          {day.users.map((u, i) => (
                            <div key={u.email} className="grid grid-cols-3 gap-4 px-4 py-2 hover:bg-slate-800/50">
                              <span className="flex items-center pl-2">
                                <User className="w-3 h-3 text-white/30" />
                              </span>
                              <div className="min-w-0">
                                <p className="text-white text-sm truncate">{u.name}</p>
                                <p className="text-white/40 text-xs truncate">{u.email}</p>
                              </div>
                              <span className="text-amber-400 text-sm text-right">{u.coinsToday.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
          {byDayData.length > 0 && (
            <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-slate-800 border-t border-slate-700">
              <span></span>
              <span className="text-white font-semibold text-sm">Total</span>
              <span></span>
              <span className="text-amber-400 font-bold text-sm text-right">{grandTotal.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* BY USER VIEW — flat table */}
      {viewMode === "by-user" && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-slate-800 text-white/60 text-xs font-medium uppercase">
            <span>Date</span>
            <span className="text-center">Users</span>
            <span className="text-right">Coins</span>
          </div>
          <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
            {byUserData.length === 0 ? (
              <div className="text-center py-8 text-white/50 text-sm">No earnings data</div>
            ) : (
              byUserData.map((day) => (
                <div key={day.date} className="grid grid-cols-3 gap-4 px-4 py-3 hover:bg-slate-700/30">
                  <span className="text-white text-sm">{formatDate(day.date)}</span>
                  <span className="text-white/60 text-sm text-center">{day.userCount}</span>
                  <span className="text-amber-400 text-sm font-medium text-right">{day.totalCoins.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
          {byUserData.length > 0 && (
            <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-slate-800 border-t border-slate-700">
              <span className="text-white font-semibold text-sm">Total</span>
              <span></span>
              <span className="text-amber-400 font-bold text-sm text-right">{grandTotal.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}