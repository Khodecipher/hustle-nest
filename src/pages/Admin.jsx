import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, Wallet, CheckCircle, XCircle, Eye, 
  TrendingUp, Clock, Coins, ArrowLeft, Search,
  UserCheck, UserX, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Admin() {
  const [adminUser, setAdminUser] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    paidUsers: 0,
    pendingPayments: 0,
    pendingWithdrawals: 0,
    totalPaidOut: 0
  });

  useEffect(() => {
    checkAdminAndLoadData();
    // Auto-refresh every 30 seconds to catch new payments
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const userData = await base44.auth.me();
      if (userData.role !== 'admin') {
        toast.error("Admin access required");
        window.location.href = createPageUrl("Dashboard");
        return;
      }
      setAdminUser(userData.email);
      loadData();
    } catch (err) {
      toast.error("Please log in");
      base44.auth.redirectToLogin(createPageUrl("Admin"));
    }
  };

  const loadData = async () => {
    try {
      const response = await base44.functions.invoke('adminGetData', {});
      const { payments: paymentsData, withdrawals: withdrawalsData, users: usersData } = response.data;

      setPayments(paymentsData);
      setWithdrawals(withdrawalsData);
      setAllUsers(usersData);

      const paidUsers = usersData.filter(u => u.has_paid).length;
      const pendingPayments = paymentsData.filter(p => p.status === 'pending').length;
      const pendingWithdrawals = withdrawalsData.filter(w => w.status === 'pending').length;
      const totalPaidOut = withdrawalsData
        .filter(w => w.status === 'paid')
        .reduce((sum, w) => sum + (w.amount || 0), 0);

      setStats({
        totalUsers: usersData.length,
        paidUsers,
        pendingPayments,
        pendingWithdrawals,
        totalPaidOut
      });

    } catch (err) {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  const handleAdminLogout = () => {
    base44.auth.logout(createPageUrl("Landing"));
  };

  const handlePaymentAction = async (payment, action) => {
    try {
      const response = await base44.functions.invoke('adminConfirmPayment', {
        paymentId: payment.id,
        action,
        adminEmail: adminUser
      });

      if (response.data?.error) {
        toast.error(response.data.error);
      } else {
        toast.success(action === 'confirm' ? "Payment confirmed! User can now access the dashboard." : "Payment rejected");
      }

      setSelectedPayment(null);
      loadData();
    } catch (err) {
      toast.error("Failed to update payment");
    }
  };

  const handleWithdrawalAction = async (withdrawal, action) => {
    try {
      const response = await base44.functions.invoke('adminProcessWithdrawal', {
        withdrawalId: withdrawal.id,
        action,
        adminEmail: adminUser
      });
      if (response.data?.error) {
        toast.error(response.data.error);
      } else {
        const newStatus = action === 'approve' ? 'approved' : action === 'paid' ? 'paid' : 'rejected';
        toast.success(`Withdrawal ${newStatus}!`);
      }
      loadData();
    } catch (err) {
      toast.error("Failed to update withdrawal");
    }
  };

  const filteredPayments = payments.filter(p => 
    p.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWithdrawals = withdrawals.filter(w =>
    w.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleAdmin = async (userItem) => {
    const newRole = userItem.role === 'admin' ? 'user' : 'admin';
    await base44.functions.invoke('adminUpdateUser', { userId: userItem.id, data: { role: newRole } });
    toast.success(`${userItem.email} is now ${newRole}`);
    loadData();
  };

  const handleTogglePaid = async (userItem) => {
    const newPaidStatus = !userItem.has_paid;
    await base44.functions.invoke('adminUpdateUser', { userId: userItem.id, data: { has_paid: newPaidStatus } });
    toast.success(`${userItem.email} marked as ${newPaidStatus ? 'PAID ✓' : 'unpaid'}`);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Dashboard")} className="text-white/60 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Admin Panel</p>
                <p className="text-white/50 text-xs">Manage users & payments</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdminLogout}
            className="text-white/60 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { icon: Users, label: "Total Users", value: stats.totalUsers, color: "from-blue-500 to-cyan-600" },
            { icon: UserCheck, label: "Paid Users", value: stats.paidUsers, color: "from-green-500 to-emerald-600" },
            { icon: Clock, label: "Pending Payments", value: stats.pendingPayments, color: "from-amber-500 to-orange-600" },
            { icon: Wallet, label: "Pending Withdrawals", value: stats.pendingWithdrawals, color: "from-purple-500 to-pink-600" },
            { icon: TrendingUp, label: "Total Paid Out", value: `₦${stats.totalPaidOut.toLocaleString()}`, color: "from-red-500 to-rose-600" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4`}
            >
              <stat.icon className="w-5 h-5 text-white/80 mb-2" />
              <p className="text-white/80 text-xs">{stat.label}</p>
              <p className="text-white text-xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-800/50 border-slate-700 text-white pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700 p-1">
            <TabsTrigger value="payments" className="data-[state=active]:bg-amber-500">
              Payments ({stats.pendingPayments} pending)
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-green-500">
              Withdrawals ({stats.pendingWithdrawals} pending)
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-500">
              Users ({stats.totalUsers})
            </TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="space-y-3">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-white/50">No payments found</div>
              ) : (
                filteredPayments.map((payment) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        payment.status === 'pending' ? 'bg-amber-500/20' :
                        payment.status === 'confirmed' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {payment.status === 'pending' ? (
                          <Clock className="w-5 h-5 text-amber-400" />
                        ) : payment.status === 'confirmed' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{payment.user_email}</p>
                        <p className="text-white/50 text-sm">₦{payment.amount?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={
                        payment.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        payment.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 
                        'bg-red-500/20 text-red-400'
                      }>
                        {payment.status}
                      </Badge>
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <div className="space-y-3">
              {filteredWithdrawals.length === 0 ? (
                <div className="text-center py-12 text-white/50">No withdrawals found</div>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <motion.div
                    key={withdrawal.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-medium">{withdrawal.user_email}</p>
                        <p className="text-green-400 text-lg font-bold">₦{withdrawal.amount?.toLocaleString()}</p>
                      </div>
                      <Badge className={
                        withdrawal.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                        withdrawal.status === 'approved' ? 'bg-blue-500/20 text-blue-400' :
                        withdrawal.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                      }>
                        {withdrawal.status}
                      </Badge>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                      <div className="text-sm">
                        <p className="text-white/50 mb-1">USDT Address (ERC-20)</p>
                        <p className="text-white font-mono text-xs break-all">{withdrawal.usdt_address || "—"}</p>
                      </div>
                    </div>
                    {(withdrawal.status === 'pending' || withdrawal.status === 'approved') && (
                      <div className="flex gap-2">
                        {withdrawal.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleWithdrawalAction(withdrawal, 'approve')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleWithdrawalAction(withdrawal, 'reject')}
                              className="border-red-500 text-red-500 hover:bg-red-500/10"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {withdrawal.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => handleWithdrawalAction(withdrawal, 'paid')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Wallet className="w-4 h-4 mr-1" />
                            Mark as Paid
                          </Button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="space-y-3">
              {allUsers.filter(u => 
                u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((userItem) => (
                <motion.div
                  key={userItem.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      userItem.has_paid ? 'bg-green-500/20' : 'bg-slate-700'
                    }`}>
                      {userItem.has_paid ? (
                        <UserCheck className="w-5 h-5 text-green-400" />
                      ) : (
                        <UserX className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{userItem.full_name || 'No name'}</p>
                      <p className="text-white/50 text-sm">{userItem.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-amber-400 font-medium">{userItem.total_coins || 0} coins</p>
                    </div>
                    <Badge className={userItem.has_paid ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}>
                      {userItem.has_paid ? 'Paid' : 'Unpaid'}
                    </Badge>
                    <Badge className={userItem.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}>
                      {userItem.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePaid(userItem)}
                      className={`text-xs ${userItem.has_paid ? 'border-red-500/50 text-red-400 hover:bg-red-500/10' : 'border-green-500/50 text-green-400 hover:bg-green-500/10'}`}
                    >
                      {userItem.has_paid ? 'Mark Unpaid' : '✓ Mark Paid'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleAdmin(userItem)}
                      className="border-slate-600 text-white/70 hover:text-white hover:bg-slate-700 text-xs"
                    >
                      {userItem.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Payment Review Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Review Payment</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div>
                <p className="text-white/50 text-sm">User</p>
                <p className="text-white font-medium">{selectedPayment.user_email}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm">Amount</p>
                <p className="text-green-400 text-xl font-bold">₦{selectedPayment.amount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/50 text-sm mb-2">Payment Proof</p>
                {selectedPayment.payment_proof ? (
                  <div className="space-y-2">
                    <img
                      src={selectedPayment.payment_proof}
                      alt="Payment proof"
                      className="w-full rounded-lg border border-slate-700"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                    />
                    <a
                      href={selectedPayment.payment_proof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden text-amber-400 text-sm underline"
                    >
                      Image failed to load — click here to open in new tab
                    </a>
                    <a
                      href={selectedPayment.payment_proof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-amber-400/70 text-xs hover:text-amber-400 mt-1"
                    >
                      Open image in new tab ↗
                    </a>
                  </div>
                ) : (
                  <p className="text-red-400 text-sm italic">No proof uploaded</p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handlePaymentAction(selectedPayment, 'confirm')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Payment
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => handlePaymentAction(selectedPayment, 'reject')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}