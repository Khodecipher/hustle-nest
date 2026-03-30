import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { targetEmail } = await req.json();

    // Only process one user at a time to avoid rate limits
    const earnings = await base44.asServiceRole.entities.DailyEarning.filter({
      user_email: targetEmail
    });

    // Group by date
    const byDate = {};
    for (const e of earnings) {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    }

    let deletedCount = 0;

    for (const [date, records] of Object.entries(byDate)) {
      if (records.length <= 1) continue;

      // Keep the one with highest coins
      records.sort((a, b) => (b.coins_earned || 0) - (a.coins_earned || 0));
      const toDelete = records.slice(1);

      for (const dup of toDelete) {
        try {
          await base44.asServiceRole.entities.DailyEarning.delete(dup.id);
          deletedCount++;
          // Rate limit: wait 200ms between deletes
          await sleep(200);
        } catch (err) {
          // If rate limited, wait longer and retry once
          await sleep(2000);
          try {
            await base44.asServiceRole.entities.DailyEarning.delete(dup.id);
            deletedCount++;
          } catch (_) {}
        }
      }
    }

    // Recalculate total_coins for this user
    const remainingEarnings = await base44.asServiceRole.entities.DailyEarning.filter({
      user_email: targetEmail
    });
    const dateCoins = {};
    remainingEarnings.forEach(e => {
      if (!dateCoins[e.date] || e.coins_earned > dateCoins[e.date]) {
        dateCoins[e.date] = e.coins_earned;
      }
    });
    const totalEarned = Object.values(dateCoins).reduce((sum, c) => sum + c, 0);

    const users = await base44.asServiceRole.entities.User.filter({ email: targetEmail });
    const targetUser = users?.[0];
    if (targetUser) {
      const correctTotal = Math.max(0, totalEarned - (targetUser.total_withdrawn || 0));
      await base44.asServiceRole.entities.User.update(targetUser.id, { total_coins: correctTotal });
      return Response.json({ 
        success: true, 
        deleted: deletedCount, 
        remaining_records: remainingEarnings.length,
        total_earned: totalEarned,
        total_coins_set: correctTotal
      });
    }

    return Response.json({ success: true, deleted: deletedCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});