import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { coins_earned, taps_count } = await req.json();

    if (typeof coins_earned !== 'number' || coins_earned < 0 || coins_earned > 1700) {
      return Response.json({ error: 'Invalid coins_earned' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Find existing record for today using service role to avoid race conditions
    const existing = await base44.asServiceRole.entities.DailyEarning.filter({
      user_email: user.email,
      date: today
    });

    let record;

    if (existing.length > 0) {
      // Sort by coins_earned descending to get the "best" record
      existing.sort((a, b) => (b.coins_earned || 0) - (a.coins_earned || 0));
      const best = existing[0];

      // Update the best record (only allow coins to go up, not down)
      const newCoins = Math.max(best.coins_earned || 0, coins_earned);
      await base44.asServiceRole.entities.DailyEarning.update(best.id, {
        coins_earned: newCoins,
        taps_count: taps_count || best.taps_count
      });
      record = { ...best, coins_earned: newCoins, taps_count: taps_count || best.taps_count };

      // Clean up any duplicate records for today (keep only the best one)
      if (existing.length > 1) {
        for (let i = 1; i < existing.length; i++) {
          try {
            await base44.asServiceRole.entities.DailyEarning.delete(existing[i].id);
          } catch (_) {
            // ignore cleanup failures
          }
        }
      }
    } else {
      // Create new record for today
      record = await base44.asServiceRole.entities.DailyEarning.create({
        user_email: user.email,
        date: today,
        coins_earned: Math.min(coins_earned, 1700),
        taps_count: taps_count || 0
      });
    }

    // Also recalculate and update total_coins on the user
    const allEarnings = await base44.asServiceRole.entities.DailyEarning.filter({
      user_email: user.email
    });
    const byDate = {};
    allEarnings.forEach(e => {
      if (!byDate[e.date] || e.coins_earned > byDate[e.date]) {
        byDate[e.date] = e.coins_earned;
      }
    });
    const totalEarned = Object.values(byDate).reduce((sum, c) => sum + c, 0);
    const totalWithdrawn = user.total_withdrawn || 0;
    const correctTotal = Math.max(0, totalEarned - totalWithdrawn);

    await base44.asServiceRole.entities.User.update(user.id, { total_coins: correctTotal });

    return Response.json({
      success: true,
      record_id: record.id,
      coins_earned: record.coins_earned,
      total_coins: correctTotal
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});