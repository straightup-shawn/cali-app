/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// In-memory store for pending timers (per user, only latest matters)
const pendingTimers = new Map<string, number>(); // userId -> timeoutId

/**
 * Send a web push notification using the Web Push Protocol.
 * Uses VAPID for authentication.
 */
async function sendWebPush(
  subscription: { endpoint: string; keys_p256dh: string; keys_auth: string },
  payload: { title: string; body: string }
): Promise<boolean> {
  try {
    // Import web-push compatible library for Deno
    const { default: webpush } = await import(
      "https://esm.sh/web-push@3.6.7"
    );

    webpush.setVapidDetails(
      "mailto:noreply@isometrix.app",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys_p256dh,
          auth: subscription.keys_auth,
        },
      },
      JSON.stringify(payload)
    );

    return true;
  } catch (err) {
    console.error("Push send failed:", err);
    return false;
  }
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Authenticate user from JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // DELETE — cancel pending timer
  if (req.method === "DELETE") {
    const existing = pendingTimers.get(user.id);
    if (existing) {
      clearTimeout(existing);
      pendingTimers.delete(user.id);
    }
    return new Response(JSON.stringify({ cancelled: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // POST — schedule a push notification
  if (req.method === "POST") {
    const { delaySeconds, title, body } = await req.json();

    if (!delaySeconds || delaySeconds < 1 || delaySeconds > 600) {
      return new Response(
        JSON.stringify({ error: "delaySeconds must be 1-600" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Cancel any existing timer for this user
    const existing = pendingTimers.get(user.id);
    if (existing) {
      clearTimeout(existing);
    }

    // Schedule the push
    const timerId = setTimeout(async () => {
      pendingTimers.delete(user.id);

      // Fetch user's push subscriptions
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, keys_p256dh, keys_auth")
        .eq("user_id", user.id);

      if (!subs || subs.length === 0) {
        console.log(`No push subscriptions for user ${user.id}`);
        return;
      }

      // Send to all subscriptions
      for (const sub of subs) {
        await sendWebPush(sub, {
          title: title || "Rest Complete",
          body: body || "Time to start your next set!",
        });
      }
    }, delaySeconds * 1000);

    pendingTimers.set(user.id, timerId as unknown as number);

    return new Response(
      JSON.stringify({ scheduled: true, delaySeconds }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
