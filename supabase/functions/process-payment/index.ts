import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  tierId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  paymentMethod: 'paystack';
  userId?: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tierId, email, firstName, lastName, paymentMethod, userId }: PaymentRequest = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get tier info
    const { data: tier, error: tierError } = await supabaseAdmin
      .from('account_tiers')
      .select('*')
      .eq('id', tierId)
      .single();

    if (tierError || !tier) throw new Error('Invalid account tier');

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId || null,
        tier_id: tierId,
        amount: tier.price,
        currency: 'USD',
        payment_method: paymentMethod,
        status: 'pending',
        metadata: { email, firstName, lastName, tier_name: tier.name, user_id: userId || null }
      })
      .select()
      .single();

    if (paymentError) throw new Error('Failed to create payment record');

    // Initialize Paystack
    const secret = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!secret) throw new Error('Payment gateway not configured');

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(Number(tier.price) * 100),
        reference: payment.id,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-callback`,
        metadata: {
          payment_id: payment.id,
          tier_id: tierId,
          tier_name: tier.name,
          customer_name: `${firstName} ${lastName}`.trim(),
          customer_email: email,
          user_id: userId || null,
        }
      }),
    });

    const paystackData = await paystackRes.json();
    if (!paystackData.status) throw new Error(paystackData.message || 'Failed to initialize Paystack payment');

    // Update payment record with Paystack reference
    await supabaseAdmin.from('payments')
      .update({ payment_reference: paystackData.data.reference })
      .eq('id', payment.id);

    return new Response(JSON.stringify({
      success: true,
      paymentId: payment.id,
      paymentUrl: paystackData.data.authorization_url,
      amount: tier.price,
      tier: tier.name
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Process payment error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);