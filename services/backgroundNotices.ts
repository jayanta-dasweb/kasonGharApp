/**
 * Must be imported once at app root (global scope) so the task exists
 * even when React UI is not mounted.
 */
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { syncNoticesInBackground } from '@/services/notificationSync';

export const NOTICE_BACKGROUND_TASK = 'kason-notice-sync';

TaskManager.defineTask(NOTICE_BACKGROUND_TASK, async () => {
  try {
    const result = await syncNoticesInBackground();
    if (result === 'fail') return BackgroundTask.BackgroundTaskResult.Failed;
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerNoticeBackgroundTask() {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      console.warn('[notice] background task restricted on this device');
      return false;
    }
    const already = await TaskManager.isTaskRegisteredAsync(NOTICE_BACKGROUND_TASK);
    if (!already) {
      await BackgroundTask.registerTaskAsync(NOTICE_BACKGROUND_TASK, {
        minimumInterval: 15, // minutes (OS may delay)
      });
    }
    return true;
  } catch (e) {
    console.warn('[notice] register background task failed', e);
    return false;
  }
}
