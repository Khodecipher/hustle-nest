import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { withdrawalId, action, adminEmail } = await req.json();

    const withdrawals = await base44.asServiceRole.entities.Withdrawal.filter({ id: withdrawalId });
    const withdrawal = withdrawals?.[0];
    if (!withdrawal) return Response.json({ error: 'Withdrawal not found' }, { status: 404 });

    const newStatus = action === 'approve' ? 'approved' : action === 'paid' ? 'paid' : 'rejected';

    await base44.asServiceRole.entities.Withdrawal.update(withdrawalId, {
      status: newStatus,
      processed_by: adminEmail,
      processed_at: new Date().toISOString()
    });

    // Fetch user for paid/rejected actions
    if (newStatus === 'paid' || newStatus === 'rejected') {
      const users = await base44.asServiceRole.entities.User.filter({ email: withdrawal.user_email });
      const targetUser = users?.[0];
      if (targetUser) {
        if (newStatus === 'paid') {
          // Update total_withdrawn (coins already zeroed on submission)
          const newTotalWithdrawn = (targetUser.total_withdrawn || 0) + (withdrawal.amount || 0);
          await base44.asServiceRole.entities.User.update(targetUser.id, {
            total_withdrawn: newTotalWithdrawn
          });
        }
        if (newStatus === 'rejected') {
          // Restore the coins that were zeroed when withdrawal was submitted
          const restoredCoins = (targetUser.total_coins || 0) + (withdrawal.coins_converted || 0);
          // Also undo total_withdrawn since it wasn't incremented on submit anymore
          await base44.asServiceRole.entities.User.update(targetUser.id, {
            total_coins: restoredCoins
          });
          // Unmark referrals used for this withdrawal
          const usedReferrals = await base44.asServiceRole.entities.Referral.filter({
            referrer_email: withdrawal.user_email,
            counted_for_withdrawal: true
          });
          // Restore up to the number used
          const toRestore = usedReferrals.slice(0, withdrawal.referrals_used || 0);
          for (const ref of toRestore) {
            await base44.asServiceRole.entities.Referral.update(ref.id, {
              counted_for_withdrawal: false
            });
          }
        }
      }
    }

    return Response.json({ success: true, status: newStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});