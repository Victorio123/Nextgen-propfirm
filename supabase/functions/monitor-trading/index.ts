import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TradingUpdate {
  accountId: string;
  balance: number;
  equity: number;
  dailyDrawdown: number;
  overallDrawdown: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { accountId, balance, equity, dailyDrawdown, overallDrawdown }: TradingUpdate = await req.json();

    // Update account data
    const { data: account, error: updateError } = await supabaseAdmin
      .from('user_accounts')
      .update({
        balance: balance,
        equity: equity,
        current_daily_drawdown: dailyDrawdown,
        current_overall_drawdown: overallDrawdown,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .select('*, profiles!inner(email, first_name)')
      .single();

    if (updateError) throw updateError;

    // Check for rule violations
    const dailyLimit = account.daily_drawdown_limit || 5;
    const overallLimit = account.overall_drawdown_limit || 10;
    
    let statusUpdate = account.status;
    let sendAlert = false;

    if (dailyDrawdown >= dailyLimit || overallDrawdown >= overallLimit) {
      statusUpdate = 'breached';
      sendAlert = true;

      // Update status to breached
      await supabaseAdmin
        .from('user_accounts')
        .update({ status: 'breached' })
        .eq('id', accountId);

      // Send breach notification email
      if (account.profiles?.email) {
        await supabaseAdmin.functions.invoke('send-email', {
          body: {
            to: account.profiles.email,
            subject: "Trading Rule Violation - Account Restricted",
            type: 'breach',
            userData: {
              firstName: account.profiles.first_name,
              accountId: account.account_number,
              to: account.profiles.email
            }
          }
        });
      }
    } else if (dailyDrawdown >= dailyLimit * 0.8 || overallDrawdown >= overallLimit * 0.8) {
      if (account.status !== 'warning') {
        statusUpdate = 'warning';
        sendAlert = true;
      }
    } else if (account.status === 'warning') {
      statusUpdate = 'active';
    }

    if (statusUpdate !== account.status) {
      await supabaseAdmin
        .from('user_accounts')
        .update({ status: statusUpdate })
        .eq('id', accountId);
    }

    return new Response(JSON.stringify({ 
      success: true,
      account: {
        id: accountId,
        status: statusUpdate,
        balance,
        equity,
        dailyDrawdown,
        overallDrawdown
      },
      alertSent: sendAlert
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Trading monitoring error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);