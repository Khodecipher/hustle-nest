import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate - works for any logged-in user including non-owner admins
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Use service role so all admins (not just owner) can fetch all data
    const [payments, withdrawals, users, referrals, dailyEarnings] = await Promise.all([
      base44.asServiceRole.entities.Payment.list('-created_date', 500),
      base44.asServiceRole.entities.Withdrawal.list('-created_date', 500),
      base44.asServiceRole.entities.User.list('-created_date', 1000),
      base44.asServiceRole.entities.Referral.list('-created_date', 1000),
      base44.asServiceRole.entities.DailyEarning.list('-date', 5000),
    ]);

    return Response.json({ payments, withdrawals, users, referrals, dailyEarnings });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});