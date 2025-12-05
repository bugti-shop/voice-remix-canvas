import { ChevronRight, Settings as SettingsIcon, Cloud, CloudUpload, Calendar, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { syncManager } from '@/utils/syncManager';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calendarSyncManager } from '@/utils/calendarSyncManager';
import { isGoogleCalendarEnabled, GoogleCalendar } from '@/utils/googleCalendar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { TodoLayout } from './TodoLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TodoSettings = () => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(syncManager.isSyncEnabled());
  const { isOnline, isSyncing, manualSync, lastSync } = useRealtimeSync();
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(calendarSyncManager.isCalendarSyncEnabled());
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isCalendarSyncing, setIsCalendarSyncing] = useState(false);
  const [availableCalendars, setAvailableCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>(calendarSyncManager.getSelectedCalendars());
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);

  useEffect(() => {
    isGoogleCalendarEnabled().then(async (connected) => {
      setIsCalendarConnected(connected);
      if (connected) {
        try {
          const calendars = await calendarSyncManager.fetchAvailableCalendars();
          setAvailableCalendars(calendars);
        } catch (error) {
          console.error('Failed to fetch calendars:', error);
        }
      }
    });
  }, []);

  const handleSyncToggle = async (enabled: boolean) => {
    setSyncEnabled(enabled);
    syncManager.setSyncEnabled(enabled);

    if (enabled) {
      toast({
        title: 'Sync Enabled',
        description: 'Your data will sync across all devices.',
      });
      await manualSync();
    } else {
      toast({
        title: 'Sync Disabled',
        description: 'App will work in offline mode only.',
      });
    }
  };

  const handleCalendarToggle = (calendarId: string) => {
    setSelectedCalendars(prev => {
      let newSelection: string[];
      if (prev.includes(calendarId)) {
        if (prev.length === 1) {
          toast({
            title: 'At Least One Calendar Required',
            description: 'You must have at least one calendar selected.',
            variant: 'destructive',
          });
          return prev;
        }
        newSelection = prev.filter(id => id !== calendarId);
      } else {
        newSelection = [...prev, calendarId];
      }
      calendarSyncManager.setSelectedCalendars(newSelection);
      return newSelection;
    });
  };

  const handleCalendarSyncToggle = async (enabled: boolean) => {
    if (!isCalendarConnected) {
      toast({
        title: 'Google Calendar Not Connected',
        description: 'Please enable Google Calendar in your account settings.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedCalendars.length === 0) {
      toast({
        title: 'No Calendars Selected',
        description: 'Please select at least one calendar to sync.',
        variant: 'destructive',
      });
      return;
    }

    setCalendarSyncEnabled(enabled);
    calendarSyncManager.setCalendarSyncEnabled(enabled);

    if (enabled) {
      try {
        await calendarSyncManager.enableAutoSync(15);
        toast({
          title: 'Calendar Sync Enabled',
          description: `Syncing with ${selectedCalendars.length} calendar(s) every 15 minutes.`,
        });
      } catch (error) {
        toast({
          title: 'Failed to Enable Sync',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        });
        setCalendarSyncEnabled(false);
        calendarSyncManager.setCalendarSyncEnabled(false);
      }
    } else {
      calendarSyncManager.disableAutoSync();
      toast({
        title: 'Calendar Sync Disabled',
        description: 'Automatic calendar sync has been turned off.',
      });
    }
  };

  const handleImportFromCalendar = async () => {
    if (!isCalendarConnected) {
      toast({
        title: 'Google Calendar Not Connected',
        description: 'Please enable Google Calendar first.',
        variant: 'destructive',
      });
      return;
    }

    setIsCalendarSyncing(true);

    try {
      const { tasks, count } = await calendarSyncManager.importFromCalendar();
      const existingTasks = JSON.parse(localStorage.getItem('todoItems') || '[]');
      const existingIds = new Set(existingTasks.map((t: any) => t.googleCalendarEventId));
      const newTasks = tasks.filter(t => !existingIds.has(t.googleCalendarEventId));
      const mergedTasks = [...existingTasks, ...newTasks];
      localStorage.setItem('todoItems', JSON.stringify(mergedTasks));
      window.dispatchEvent(new Event('todoItemsUpdated'));

      toast({
        title: 'Import Successful',
        description: `Imported ${newTasks.length} events from Google Calendar.`,
      });
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import calendar events',
        variant: 'destructive',
      });
    } finally {
      setIsCalendarSyncing(false);
    }
  };

  const handleManualCalendarSync = async () => {
    if (!isCalendarConnected) {
      toast({
        title: 'Google Calendar Not Connected',
        description: 'Please enable Google Calendar first.',
        variant: 'destructive',
      });
      return;
    }

    setIsCalendarSyncing(true);

    try {
      const existingTasks = JSON.parse(localStorage.getItem('todoItems') || '[]');
      const result = await calendarSyncManager.syncTwoWay(existingTasks);
      const updatedTasks = [...existingTasks, ...result.imported];
      localStorage.setItem('todoItems', JSON.stringify(updatedTasks));
      window.dispatchEvent(new Event('todoItemsUpdated'));

      toast({
        title: 'Sync Complete',
        description: `Imported: ${result.imported.length}, Updated: ${result.updated}, Conflicts: ${result.conflicts}`,
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync with calendar',
        variant: 'destructive',
      });
    } finally {
      setIsCalendarSyncing(false);
    }
  };

  const handleBackupData = () => {
    const todoItems = localStorage.getItem('todoItems') || '[]';
    const todoFolders = localStorage.getItem('todoFolders') || '[]';
    const backup = { todoItems, todoFolders, timestamp: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `npd-todo-backup-${Date.now()}.json`;
    a.click();
    toast({ title: "Data backed up successfully" });
  };

  const handleRestoreData = () => {
    setShowRestoreDialog(true);
  };

  const confirmRestoreData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const backup = JSON.parse(event.target?.result as string);
            if (backup.todoItems) localStorage.setItem('todoItems', backup.todoItems);
            if (backup.todoFolders) localStorage.setItem('todoFolders', backup.todoFolders);
            toast({ title: "Data restored successfully" });
            setTimeout(() => window.location.reload(), 1000);
          } catch (error) {
            toast({ title: "Failed to restore data", variant: "destructive" });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
    setShowRestoreDialog(false);
  };

  const handleDownloadData = () => {
    const allData = {
      todoItems: localStorage.getItem('todoItems'),
      todoFolders: localStorage.getItem('todoFolders'),
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `npd-todo-data-${Date.now()}.json`;
    a.click();
    toast({ title: "Data downloaded" });
  };

  const handleDeleteData = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteData = () => {
    localStorage.removeItem('todoItems');
    localStorage.removeItem('todoFolders');
    toast({ title: "All todo data deleted" });
    setShowDeleteDialog(false);
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'NPD - Todo App',
        text: 'Check out this amazing todo app!',
        url: window.location.origin
      });
    } else {
      toast({ title: "Share feature not available on this device" });
    }
  };

  const settingsItems = [
    { label: 'Back up data', onClick: handleBackupData },
    { label: 'Restore data', onClick: handleRestoreData },
    { label: 'Download my data', onClick: handleDownloadData },
    { label: 'Delete app data', onClick: handleDeleteData },
  ];

  const handleRateAndShare = () => {
    window.open('https://play.google.com/store/apps/details?id=app.nota.com', '_blank');
  };

  const otherItems = [
    { label: 'Share with friends', onClick: handleRateAndShare },
    { label: 'Terms of Service', onClick: () => setShowTermsDialog(true) },
    { label: 'Help and feedback', onClick: () => setShowHelpDialog(true) },
    { label: 'Privacy', onClick: () => setShowPrivacyDialog(true) },
    { label: 'Rate app', onClick: handleRateAndShare },
  ];

  return (
    <TodoLayout title="Settings">
      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Cloud Sync Section */}
          <div className="bg-card border rounded-lg">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Cloud Sync</h2>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Enable Sync</p>
                  <p className="text-xs text-muted-foreground">Sync your data across devices</p>
                </div>
                <Switch
                  checked={syncEnabled}
                  onCheckedChange={handleSyncToggle}
                />
              </div>

              {syncEnabled && (
                <div className="flex items-center justify-between py-2 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Status: {isOnline ? '🟢 Online' : '🔴 Offline'}
                    </p>
                    {lastSync && (
                      <p className="text-xs text-muted-foreground">
                        Last sync: {lastSync.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={manualSync}
                    disabled={isSyncing || !isOnline}
                    variant="outline"
                    size="sm"
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Google Calendar Sync Section */}
          <div className="bg-card border rounded-lg">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Google Calendar</h2>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {!isCalendarConnected ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Enable Google Calendar integration to sync your tasks with your calendar.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Calendar sync is not currently connected.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Calendar Selection */}
                  <div className="border rounded-lg p-3 space-y-2">
                    <button
                      onClick={() => setShowCalendarSelector(!showCalendarSelector)}
                      className="w-full flex items-center justify-between text-sm font-medium"
                    >
                      <span>Selected Calendars ({selectedCalendars.length})</span>
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        showCalendarSelector && "rotate-90"
                      )} />
                    </button>

                    {showCalendarSelector && (
                      <ScrollArea className="h-48 border-t pt-2">
                        <div className="space-y-2">
                          {availableCalendars.map((calendar) => (
                            <div
                              key={calendar.id}
                              className="flex items-center space-x-2 p-2 hover:bg-secondary/50 rounded"
                            >
                              <Checkbox
                                id={calendar.id}
                                checked={selectedCalendars.includes(calendar.id)}
                                onCheckedChange={() => handleCalendarToggle(calendar.id)}
                              />
                              <label
                                htmlFor={calendar.id}
                                className="flex-1 text-sm cursor-pointer flex items-center gap-2"
                              >
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: calendar.backgroundColor || '#3b82f6' }}
                                />
                                <span>{calendar.summary}</span>
                                {calendar.primary && (
                                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                    Primary
                                  </span>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Two-Way Sync</p>
                      <p className="text-xs text-muted-foreground">
                        Auto-sync every 15 minutes
                      </p>
                    </div>
                    <Switch
                      checked={calendarSyncEnabled}
                      onCheckedChange={handleCalendarSyncToggle}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleImportFromCalendar}
                      disabled={isCalendarSyncing || selectedCalendars.length === 0}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                    >
                      {isCalendarSyncing ? 'Importing...' : 'Import Events'}
                    </Button>
                    <Button
                      onClick={handleManualCalendarSync}
                      disabled={isCalendarSyncing || selectedCalendars.length === 0}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                    >
                      {isCalendarSyncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                  </div>

                  {calendarSyncManager.getLastSyncTime() && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {calendarSyncManager.getLastSyncTime()?.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Settings Items */}
          <div className="space-y-1">
            {settingsItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-border hover:bg-secondary/50 transition-colors"
              >
                <span className="text-foreground text-sm">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}

            <div className="flex items-center gap-2 px-4 py-3">
              <SettingsIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm font-medium">Other</span>
            </div>

            {otherItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-border hover:bg-secondary/50 transition-colors"
              >
                <span className="text-foreground text-sm">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Todo Data?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-destructive">⚠️ Warning: This action cannot be undone!</p>
              <p>This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All your tasks and subtasks</li>
                <li>All todo folders and categories</li>
                <li>All task data stored in this app</li>
              </ul>
              <p className="font-medium mt-2">Are you absolutely sure you want to continue?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteData} className="bg-destructive hover:bg-destructive/90">
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Data from Backup?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-orange-600">⚠️ Important Notice:</p>
              <p>Restoring data will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Replace all current tasks and folders</li>
                <li>Overwrite existing data with backup data</li>
                <li>Reload the app after restoration</li>
              </ul>
              <p className="font-medium mt-2">Make sure you have backed up your current data if needed.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestoreData}>
              Continue to Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terms of Service Dialog */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold mb-2">1. Acceptance of Terms</h3>
                <p className="text-muted-foreground">By accessing and using NPD, you accept and agree to be bound by the terms and provision of this agreement.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">2. Use License</h3>
                <p className="text-muted-foreground">Permission is granted to temporarily use NPD for personal, non-commercial transitory viewing only.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">3. User Data</h3>
                <p className="text-muted-foreground">All tasks and data are stored locally on your device. You are responsible for backing up your data regularly.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">4. Disclaimer</h3>
                <p className="text-muted-foreground">The app is provided "as is" without warranty of any kind. We do not guarantee that the app will be error-free or uninterrupted.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">5. Limitations</h3>
                <p className="text-muted-foreground">In no event shall NPD or its suppliers be liable for any damages arising out of the use or inability to use the app.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">6. Modifications</h3>
                <p className="text-muted-foreground">We may revise these terms at any time without notice. By using this app, you agree to be bound by the current version of these terms.</p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold mb-2">1. Information We Collect</h3>
                <p className="text-muted-foreground">NPD stores all your tasks and data locally on your device. We do not collect, transmit, or store any personal information on external servers.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">2. Local Storage</h3>
                <p className="text-muted-foreground">Your tasks, folders, and settings are stored using your device's local storage. This data remains on your device and is not accessible to us.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">3. Data Security</h3>
                <p className="text-muted-foreground">Since all data is stored locally, the security of your information depends on your device's security measures. We recommend using device encryption and strong passwords.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">4. Third-Party Services</h3>
                <p className="text-muted-foreground">We do not use any third-party analytics or tracking services. Your data is completely private and stays on your device.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">5. Data Backup</h3>
                <p className="text-muted-foreground">You can backup your data using the backup feature. Backup files are stored on your device and you control where they are kept.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">6. Changes to Privacy Policy</h3>
                <p className="text-muted-foreground">We may update this privacy policy from time to time. Continued use of the app after changes constitutes acceptance of the updated policy.</p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Help and Feedback Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Help & Feedback</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold mb-2">Getting Started</h3>
                <p className="text-muted-foreground">Create your first task by tapping the "Add Task" button. Set priorities, due dates, and reminders to stay organized.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">Organizing Tasks</h3>
                <p className="text-muted-foreground">Use folders and categories to organize your tasks. Add subtasks to break down larger projects into manageable steps.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">Backup & Restore</h3>
                <p className="text-muted-foreground">Regularly backup your data using the "Back up data" option. Keep your backup files in a safe location like cloud storage.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">Common Issues</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Tasks not saving? Check your device storage space.</li>
                  <li>App running slow? Try completing or archiving old tasks.</li>
                  <li>Lost data? Restore from your latest backup file.</li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold mb-2">Contact Support</h3>
                <p className="text-muted-foreground">For additional help or to report issues, please contact us through the app store review section or reach out via our support channels.</p>
              </section>
              <section>
                <h3 className="font-semibold mb-2">Feedback</h3>
                <p className="text-muted-foreground">We value your feedback! Let us know how we can improve NPD by rating the app and leaving a review.</p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </TodoLayout>
  );
};

export default TodoSettings;
