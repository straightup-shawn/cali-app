/**
 * Browser Notification utilities for the rest timer.
 * Uses the Web Notifications API which works in PWAs (backgrounded on Android Chrome,
 * with limitations on iOS Safari).
 */

/**
 * Request notification permission from the user.
 * Returns true if permission is granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Send a browser notification (e.g., when the rest timer completes).
 * Silently fails if permission is not granted or Notifications are unsupported.
 */
export function sendTimerNotification(title: string, body: string): void {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  new Notification(title, {
    body,
    icon: '/icons/icon-192.svg',
    tag: 'rest-timer',
  });
}
