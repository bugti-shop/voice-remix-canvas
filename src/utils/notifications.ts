// Simplified notification manager for web (no Capacitor native notifications)

class NotificationManager {
  private static instance: NotificationManager;

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async scheduleNotification(options: {
    id: number;
    title: string;
    body: string;
    schedule: Date;
    extra?: Record<string, unknown>;
  }): Promise<void> {
    console.log('Notification scheduled:', options);
    // In a web environment, we'd use Service Workers for real notifications
    // For now, just log the scheduled notification
  }

  async cancelNotification(id: number): Promise<void> {
    console.log('Notification cancelled:', id);
  }

  async cancelAllNotifications(): Promise<void> {
    console.log('All notifications cancelled');
  }

  async getPendingNotifications(): Promise<any[]> {
    return [];
  }
}

export const notificationManager = NotificationManager.getInstance();
