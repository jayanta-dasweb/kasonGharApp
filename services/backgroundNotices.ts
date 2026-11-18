/**
 * Optional background task — safe in Expo Go (no-ops if native modules missing).
 * Do NOT import this file for side effects from root layout.
 */
import { syncNoticesInBackground } from '@/services/notificationSync';

export const NOTICE_BACKGROUND_TASK = 'kason-notice-sync';

let defined = false;

async function ensureTaskDefined() {
  if (defined) return true;
  try {
    const BackgroundTask = await import('expo-background-task');
    const TaskManager = await import('expo-task-manager');
    TaskManager.defineTask(NOTICE_BACKGROUND_TASK, async () => {
      try {
        const result = await syncNoticesInBackground();
        if (result === 'fail') return BackgroundTask.BackgroundTaskResult.Failed;
        return BackgroundTask.BackgroundTaskResult.Success;
      } catch {
        return BackgroundTask.BackgroundTaskResult.Failed;
      }
    });
    defined = true;
    return true;
  } catch (e) {
    console.warn('[notice] background task modules unavailable', e);
    return false;
  }
}

export async function registerNoticeBackgroundTask() {
  try {
    const ok = await ensureTaskDefined();
    if (!ok) return false;
    const BackgroundTask = await import('expo-background-task');
    const TaskManager = await import('expo-task-manager');
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      return false;
    }
    const already = await TaskManager.isTaskRegisteredAsync(NOTICE_BACKGROUND_TASK);
    if (!already) {
      await BackgroundTask.registerTaskAsync(NOTICE_BACKGROUND_TASK, {
        minimumInterval: 15,
      });
    }
    return true;
  } catch (e) {
    console.warn('[notice] register background task failed', e);
    return false;
  }
}
