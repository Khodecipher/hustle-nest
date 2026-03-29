import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, data, adminEmail } = await req.json();

    // If marking as paid, require a payment proof record first
    if (data.has_paid === true) {
      const targetUsers = await base44.asServiceRole.entities.User.filter({ id: userId });
      const targetUser = targetUsers?.[0];
      if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });

      const payments = await base44.asServiceRole.entities.Payment.filter({ user_email: targetUser.email });
      const hasProof = payments?.some(p => p.payment_proof);
      if (!hasProof) {
        return Response.json({ error: 'No payment proof found for this user. Ask them to submit payment proof first.' }, { status: 400 });
      }

      // Add audit info
      data.paid_confirmed_by = adminEmail || 'admin';
      data.paid_confirmed_at = new Date().toISOString();

      // Create referral record if user was referred
      if (targetUser.referred_by) {
        const referrers = await base44.asServiceRole.entities.User.filter({ referral_code: targetUser.referred_by });
        const referrer = referrers?.[0];
        if (referrer) {
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

    await base44.asServiceRole.entities.User.update(userId, data);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});