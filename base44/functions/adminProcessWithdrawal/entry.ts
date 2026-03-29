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

    // When marked as paid: reset user's coins and update total_withdrawn
    if (newStatus === 'paid') {
      const users = await base44.asServiceRole.entities.User.filter({ email: withdrawal.user_email });
      const targetUser = users?.[0];
      if (targetUser) {
        const newTotalWithdrawn = (targetUser.total_withdrawn || 0) + (withdrawal.amount || 0);
        await base44.asServiceRole.entities.User.update(targetUser.id, {
          total_coins: 0,
          total_withdrawn: newTotalWithdrawn
        });
      }
    }

    // When rejected: restore coins back to user (don't penalize them)
    if (newStatus === 'rejected') {
      const users = await base44.asServiceRole.entities.User.filter({ email: withdrawal.user_email });
      const targetUser = users?.[0];
      if (targetUser) {
        // Restore the coins that were zeroed when withdrawal was submitted
        const restoredCoins = (targetUser.total_coins || 0) + (withdrawal.coins_converted || 0);
        await base44.asServiceRole.entities.User.update(targetUser.id, {
          total_coins: restoredCoins
        });
      }
    }

    return Response.json({ success: true, status: newStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});