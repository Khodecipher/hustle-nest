import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all users and all daily earnings
    const [users, allEarnings] = await Promise.all([
      base44.asServiceRole.entities.User.list('-created_date', 1000),
      base44.asServiceRole.entities.DailyEarning.list('-created_date', 10000),
    ]);

    const results = [];

    for (const u of users) {
      if (!u.has_paid) continue;

      // Get this user's earnings, pick max coins_earned per day
      const userEarnings = allEarnings.filter(e => e.user_email === u.email);
      const byDate = {};
      userEarnings.forEach(e => {
        if (!byDate[e.date] || e.coins_earned > byDate[e.date]) {
          byDate[e.date] = e.coins_earned;
        }
      });

      const totalEarned = Object.values(byDate).reduce((sum, c) => sum + c, 0);
      const correctTotal = Math.max(0, totalEarned - (u.total_withdrawn || 0));

      if (correctTotal !== (u.total_coins || 0)) {
        await base44.asServiceRole.entities.User.update(u.id, { total_coins: correctTotal });
        results.push({ email: u.email, old: u.total_coins || 0, new: correctTotal });
      }
    }

    return Response.json({ success: true, updated: results.length, details: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});