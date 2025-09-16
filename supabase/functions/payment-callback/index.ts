import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateTradingCredentials() {
  const username = `CR${Math.floor(Math.random() * 9000000) + 1000000}`;
  const password =
    Math.random().toString(36).substring(2, 12) +
    Math.random().toString(36).substring(2, 4).toUpperCase() +
    Math.floor(Math.random() * 99);
  const serverOptions = ["Deriv-Demo", "Deriv-Real-01", "Deriv-Real-02"];
  const server = serverOptions[Math.floor(Math.random() * serverOptions.length)];
  return { username, password, server };
}

function generateAccountNumber() {
  return Math.floor(Math.random() * 900000000) + 100000000;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");
    if (!reference) return new Response("Missing transaction reference", { status: 400 });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // ✅ Verify Paystack transaction
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}` },
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.status || verifyData.data.status !== "success") {
      throw new Error("Payment verification failed");
    }

    const paymentId = verifyData.data.metadata.payment_id;
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*, account_tiers(*)")
      .eq("id", paymentId)
      .single();
    if (paymentError || !payment) throw new Error("Payment record not found");

    // ✅ Update payment
    await supabaseAdmin
      .from("payments")
      .update({
        status: "completed",
        payment_reference: reference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    // ✅ Create trading account
    const tradingCredentials = await generateTradingCredentials();
    const accountNumber = generateAccountNumber();
    const userId = verifyData.data.metadata?.user_id || payment.metadata?.user_id;
    if (!userId) throw new Error("Missing user_id");

    const { error: accountError } = await supabaseAdmin.from("user_accounts").insert({
      user_id: userId,
      account_number: accountNumber.toString(),
      account_type: payment.account_tiers.name.toLowerCase(),
      balance: payment.account_tiers.balance,
      initial_balance: payment.account_tiers.balance,
      equity: payment.account_tiers.balance,
      status: "active",
      deriv_account_id: tradingCredentials.username,
      daily_drawdown_limit: payment.account_tiers.daily_drawdown_limit,
      overall_drawdown_limit: payment.account_tiers.overall_drawdown_limit,
    });

    if (accountError) throw new Error("Failed to create trading account");

    // ✅ Send email via Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    await resend.emails.send({
      from: "Nextgen Prop Firm <onboarding@resend.dev>",
      to: String(
        payment.metadata.customer_email ||
          verifyData.data.customer?.email ||
          verifyData.data.email
      ),
      subject: "🎉 Welcome to Nextgen Prop Firm - Your Trading Account is Ready!",
      html: `
        <h2>Hello ${payment.metadata.customer_name || "Trader"},</h2>
        <p>Congratulations! Your trading account is ready. Here are your credentials:</p>
        <ul>
          <li><strong>Account Number:</strong> ${accountNumber}</li>
          <li><strong>Trading Username:</strong> ${tradingCredentials.username}</li>
          <li><strong>Password:</strong> ${tradingCredentials.password}</li>
          <li><strong>Server:</strong> ${tradingCredentials.server}</li>
          <li><strong>Account Type:</strong> ${payment.account_tiers.name}</li>
          <li><strong>Starting Balance:</strong> $${payment.account_tiers.balance}</li>
        </ul>
        <p>Login to your dashboard here: <a href="${Deno.env.get(
          "SUPABASE_URL"
        )}/dashboard">Go to Dashboard</a></p>
      `,
    });

    // ✅ Return success page
    return new Response(
      `<!DOCTYPE html><html><body><h1 style="color:green;">🎉 Payment Successful!</h1><p>Check your email for your trading credentials.</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error: any) {
    console.error("Payment callback error:", error);
    return new Response(
      `<!DOCTYPE html><html><body><h1 style="color:red;">Payment Error</h1><p>${error.message}</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }
};

serve(handler);