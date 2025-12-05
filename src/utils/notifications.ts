import { LocalNotifications } from '@capacitor/local-notifications';
import { TodoItem } from '@/types/note';

export class NotificationManager {
  private static instance: NotificationManager;
  private permissionGranted = false;

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      this.permissionGranted = result.display === 'granted';
      return this.permissionGranted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.checkPermissions();
      this.permissionGranted = result.display === 'granted';
      return this.permissionGranted;
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  async scheduleTaskReminder(task: TodoItem, recurringType?: 'daily' | 'weekly' | 'monthly', recurringCount: number = 30): Promise<number[]> {
    if (!task.reminderTime) return [];

    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Notification permissions not granted');
      }
    }

    try {
      await this.cancelTaskReminder(task.id);

      const baseNotificationId = parseInt(task.id.slice(0, 8), 16) || Date.now();
      const reminderDate = new Date(task.reminderTime);
      const notificationIds: number[] = [];
      const notifications: any[] = [];

      if (recurringType) {
        for (let i = 0; i < recurringCount; i++) {
          const occurrenceDate = new Date(reminderDate);

          if (recurringType === 'daily') {
            occurrenceDate.setDate(occurrenceDate.getDate() + i);
          } else if (recurringType === 'weekly') {
            occurrenceDate.setDate(occurrenceDate.getDate() + (i * 7));
          } else if (recurringType === 'monthly') {
            occurrenceDate.setMonth(occurrenceDate.getMonth() + i);
          }

          if (occurrenceDate > new Date()) {
            const notificationId = baseNotificationId + i;
            notificationIds.push(notificationId);

            notifications.push({
              id: notificationId,
              title: `Task Reminder ${recurringType === 'daily' ? '(Daily)' : recurringType === 'weekly' ? '(Weekly)' : '(Monthly)'}`,
              body: task.text,
              schedule: { at: occurrenceDate },
              sound: undefined,
              attachments: undefined,
              actionTypeId: '',
              extra: { taskId: task.id, recurring: true, recurringType },
            });
          }
        }
      } else {
        if (reminderDate > new Date()) {
          notificationIds.push(baseNotificationId);
          notifications.push({
            id: baseNotificationId,
            title: 'Task Reminder',
            body: task.text,
            schedule: { at: reminderDate },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: { taskId: task.id },
          });
        }
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`Scheduled ${notifications.length} notification(s) for task: ${task.text}`);
      }

      return notificationIds;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  async cancelTaskReminder(taskId: string, notificationIds?: number[]): Promise<void> {
    try {
      if (notificationIds && notificationIds.length > 0) {
        await LocalNotifications.cancel({
          notifications: notificationIds.map(id => ({ id }))
        });
      } else {
        const baseNotificationId = parseInt(taskId.slice(0, 8), 16) || Date.now();
        const idsToCancel = [];
        for (let i = 0; i < 100; i++) {
          idsToCancel.push({ id: baseNotificationId + i });
        }
        await LocalNotifications.cancel({ notifications: idsToCancel });
      }
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllReminders(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async rescheduleAllTasks(tasks: TodoItem[]): Promise<void> {
    await this.cancelAllReminders();
    for (const task of tasks) {
      if (task.reminderTime && !task.completed) {
        try {
          await this.scheduleTaskReminder(task);
        } catch (error) {
          console.error(`Failed to schedule reminder for task ${task.id}:`, error);
        }
      }
    }
  }
}

export const notificationManager = NotificationManager.getInstance();
