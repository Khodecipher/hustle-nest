import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const [payments, withdrawals, users, referrals] = await Promise.all([
      base44.asServiceRole.entities.Payment.list('-created_date'),
      base44.asServiceRole.entities.Withdrawal.list('-created_date'),
      base44.asServiceRole.entities.User.list('-created_date', 500),
      base44.asServiceRole.entities.Referral.list('-created_date', 500),
    ]);

    return Response.json({ payments, withdrawals, users, referrals });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});