import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, data } = await req.json();
    await base44.asServiceRole.entities.User.update(userId, data);

    // If marking user as paid, create referral record for their referrer
    if (data.has_paid === true) {
      const users = await base44.asServiceRole.entities.User.filter({ id: userId });
      const targetUser = users?.[0];
      if (targetUser?.referred_by) {
        const referrers = await base44.asServiceRole.entities.User.filter({ referral_code: targetUser.referred_by });
        const referrer = referrers?.[0];
        if (referrer) {
          // Check if referral already exists to avoid duplicates
          const existing = await base44.asServiceRole.entities.Referral.filter({
            referrer_email: referrer.email,
            referred_email: targetUser.email
          });
          if (!existing || existing.length === 0) {
            await base44.asServiceRole.entities.Referral.create({
              referrer_email: referrer.email,
              referred_email: targetUser.email,
              referred_name: targetUser.full_name || targetUser.email,
              status: 'confirmed',
              counted_for_withdrawal: false
            });
          }
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});