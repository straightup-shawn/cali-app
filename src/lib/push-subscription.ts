/**
 * Web Push subscription management.
 * Handles subscribing the user's browser to push notifications
 * and storing/syncing the subscription with Supabase.
 */

import { supabase } from '@/lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Convert a URL-safe base64 string to a Uint8Array (required by PushManager).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe the current browser to push notifications and save the subscription
 * to Supabase. Returns true if successful.
 */
export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.warn('VAPID_PUBLIC_KEY not configured');
      return false;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    // Save to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const subJson = subscription.toJSON();

    await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint,
          keys_p256dh: subJson.keys?.p256dh ?? '',
          keys_auth: subJson.keys?.auth ?? '',
        } as any,
        { onConflict: 'user_id,endpoint' }
      );

    return true;
  } catch (err) {
    console.error('Push subscription failed:', err);
    return false;
  }
}

/**
 * Check if the user is already subscribed to push.
 */
export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

/**
 * Schedule a push notification via Supabase Edge Function.
 * The server will wait `delaySeconds` and then send the push.
 */
export async function scheduleTimerPush(delaySeconds: number): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    await fetch(`${supabaseUrl}/functions/v1/schedule-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        delaySeconds,
        title: 'Rest Complete',
        body: 'Time to start your next set!',
      }),
    });
  } catch (err) {
    console.error('Failed to schedule push:', err);
  }
}

/**
 * Cancel a scheduled push (best-effort — server may have already sent).
 */
export async function cancelTimerPush(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    await fetch(`${supabaseUrl}/functions/v1/schedule-push`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });
  } catch {
    // Best effort
  }
}
