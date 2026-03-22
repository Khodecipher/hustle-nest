import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { paymentId, action, adminEmail } = await req.json();

    const payment = (await base44.asServiceRole.entities.Payment.filter({ id: paymentId }))?.[0];
    if (!payment) return Response.json({ error: 'Payment not found' }, { status: 404 });

    if (action === 'confirm') {
      // Update payment
      await base44.asServiceRole.entities.Payment.update(paymentId, {
        status: 'confirmed',
        confirmed_by: adminEmail,
        confirmed_at: new Date().toISOString()
      });

      // Find and update user
      const users = await base44.asServiceRole.entities.User.filter({ email: payment.user_email });
      const targetUser = users?.[0];
      if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 });

      await base44.asServiceRole.entities.User.update(targetUser.id, { has_paid: true });

      // Handle referral if user was referred
      if (targetUser.referred_by) {
        const referrers = await base44.asServiceRole.entities.User.filter({ referral_code: targetUser.referred_by });
        const referrer = referrers?.[0];
        if (referrer) {
          await base44.asServiceRole.entities.Referral.create({
            referrer_email: referrer.email,
            referred_email: targetUser.email,
            referred_name: targetUser.full_name,
            status: 'confirmed',
            counted_for_withdrawal: false
          });
        }
      }

      return Response.json({ success: true, message: 'Payment confirmed' });

    } else {
      await base44.asServiceRole.entities.Payment.update(paymentId, { status: 'rejected' });
      return Response.json({ success: true, message: 'Payment rejected' });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});