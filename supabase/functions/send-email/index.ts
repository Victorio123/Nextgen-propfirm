import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  type: 'welcome' | 'breach' | 'warning' | 'account_created' | 'trading_credentials';
  userData?: {
    firstName?: string;
    lastName?: string;
    accountId?: string;
    loginCredentials?: {
      username: string;
      password: string;
      server: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { to, subject, html, type, userData }: EmailRequest = await req.json();

    let emailContent = html;
    let emailSubject = subject;

    // Generate specific email content based on type
    if (type === 'trading_credentials' && userData) {
      emailSubject = "Welcome to Nextgen Prop Firm - Your Trading Account Details";
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0066ff;">Welcome to Nextgen Prop Firm!</h1>
          <p>Hi ${userData.firstName || 'Trader'},</p>
          <p>Congratulations! Your trading account has been successfully created. Here are your login details:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Trading Account Details</h3>
            <p><strong>Account ID:</strong> ${userData.accountId}</p>
            <p><strong>Username:</strong> ${userData.loginCredentials?.username}</p>
            <p><strong>Password:</strong> ${userData.loginCredentials?.password}</p>
            <p><strong>Server:</strong> ${userData.loginCredentials?.server}</p>
          </div>
          
          <p>You can now start trading with your funded account. Remember to follow our risk management rules:</p>
          <ul>
            <li>Daily drawdown limit: 5%</li>
            <li>Overall drawdown limit: 10%</li>
            <li>Minimum trading days: 5</li>
          </ul>
          
          <p>Best of luck with your trading!</p>
          <p><strong>The Nextgen Prop Firm Team</strong></p>
        </div>
      `;
    } else if (type === 'breach' && userData) {
      emailSubject = "Trading Rule Violation - Account Restricted";
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Account Restriction Notice</h1>
          <p>Hi ${userData.firstName || userData.to},</p>
          <p>We've noticed a breach of our trading rules on your account ${userData.accountId}.</p>
          <p>Your account has been temporarily restricted from trading. Please contact our support team for assistance.</p>
          <p><strong>The Nextgen Prop Firm Team</strong></p>
        </div>
      `;
    }

    console.log(`Sending ${type} email to ${to}`);

    const emailResponse = await resend.emails.send({
      from: "Nextgen Prop Firm <noreply@nextgenpropfirm.com>",
      to: [to],
      subject: emailSubject,
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
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