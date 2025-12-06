import { useState, useEffect, useRef } from 'react';
import { TodoItem, Priority, RepeatType, Folder, ColoredTag } from '@/types/note';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { notificationManager } from '@/utils/notifications';
import { toast } from 'sonner';
import {
  Calendar as CalendarIcon,
  Flag,
  FolderIcon,
  Image as ImageIcon,
  Send,
  X,
  Repeat,
  Mic,
  MoreHorizontal,
  Timer,
  Clock,
  Bell,
  CalendarCheck,
  BellRing,
  Tag,
  CalendarClock,
  Settings2
} from 'lucide-react';
import { EditActionsSheet, ActionItem, defaultActions } from './EditActionsSheet';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TaskInputSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<TodoItem, 'id' | 'completed'>) => void;
  folders: Folder[];
  selectedFolderId?: string | null;
  onCreateFolder: (name: string, color: string) => void;
}

export const TaskInputSheet = ({ isOpen, onClose, onAddTask, folders, selectedFolderId, onCreateFolder }: TaskInputSheetProps) => {
  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState<Priority>('none');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [reminderTime, setReminderTime] = useState<Date | undefined>();
  const [repeatType, setRepeatType] = useState<RepeatType>('none');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [folderId, setFolderId] = useState<string | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showRepeatMenu, setShowRepeatMenu] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [coloredTags, setColoredTags] = useState<ColoredTag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState('#14b8a6');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showManageTags, setShowManageTags] = useState(false);
  const [editingTag, setEditingTag] = useState<ColoredTag | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [showEditActions, setShowEditActions] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>(() => {
    const saved = localStorage.getItem('taskInputActions');
    return saved ? JSON.parse(saved) : defaultActions;
  });
  const [savedTags, setSavedTags] = useState<ColoredTag[]>(() => {
    const saved = localStorage.getItem('savedColoredTags');
    return saved ? JSON.parse(saved) : [];
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const folderColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const handleSaveActions = (actions: ActionItem[]) => {
    setActionItems(actions);
    localStorage.setItem('taskInputActions', JSON.stringify(actions));
    toast.success('Actions updated');
  };

  const isActionEnabled = (id: string) => actionItems.find(a => a.id === id)?.enabled ?? true;
  const getActionOrder = () => actionItems.filter(a => a.enabled).map(a => a.id);

  useEffect(() => {
    if (!isOpen) {
      setTaskText('');
      setPriority('none');
      setDueDate(undefined);
      setReminderTime(undefined);
      setRepeatType('none');
      setRepeatDays([]);
      setFolderId(undefined);
      setImageUrl(undefined);
      setColoredTags([]);
      setTagInput('');
      setSelectedTagColor('#14b8a6');
      setShowTagInput(false);
      setDeadline(undefined);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedFolderId) {
      setFolderId(selectedFolderId);
    }
  }, [selectedFolderId]);

  const handleSend = async () => {
    if (!taskText.trim()) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}

    const mainTask: Omit<TodoItem, 'id' | 'completed'> = {
      text: taskText,
      priority: priority !== 'none' ? priority : undefined,
      dueDate: deadline || dueDate,
      reminderTime,
      repeatType: repeatType !== 'none' ? repeatType : undefined,
      repeatDays: repeatType === 'custom' && repeatDays.length > 0 ? repeatDays : undefined,
      folderId,
      imageUrl,
      coloredTags: coloredTags.length > 0 ? coloredTags : undefined,
    };

    onAddTask(mainTask);
    setTaskText('');
    inputRef.current?.focus();
  };

  const handleSetReminder = async (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);

    if (reminderDate < new Date()) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }

    // Request notification permissions
    try {
      const hasPermission = await notificationManager.checkPermissions();
      if (!hasPermission) {
        const granted = await notificationManager.requestPermissions();
        if (!granted) {
          toast.error('Notification permission denied. Reminders may not work.');
        } else {
          toast.success('Notifications enabled for reminders');
        }
      }
    } catch (error) {
      console.log('Running in web mode - native notifications not available');
    }

    setReminderTime(reminderDate);
    setShowTimePicker(false);
    toast.success(`Reminder set for ${format(reminderDate, 'h:mm a')}`);
  };

  const getRepeatLabel = () => {
    if (repeatType === 'none') return null;
    if (repeatType === 'daily') return 'Daily';
    if (repeatType === 'weekly') return 'Weekly';
    if (repeatType === 'weekdays') return 'Weekdays';
    if (repeatType === 'weekends') return 'Weekends';
    if (repeatType === 'monthly') return 'Monthly';
    if (repeatType === 'custom' && repeatDays.length > 0) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return repeatDays.map(d => dayNames[d]).join(', ');
    }
    return null;
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
    onCreateFolder(newFolderName.trim(), selectedColor);
    setNewFolderName('');
    setSelectedColor('#3b82f6');
    setShowFolderDialog(false);
  };

  const handleQuickDate = (type: string) => {
    const today = new Date();
    switch (type) {
      case 'today':
        setDueDate(today);
        break;
      case 'tomorrow':
        setDueDate(addDays(today, 1));
        break;
      case 'weekend':
        const weekend = startOfWeek(addWeeks(today, 1), { weekStartsOn: 6 });
        setDueDate(weekend);
        break;
      case 'nextweek':
        setDueDate(addWeeks(today, 1));
        break;
    }
    setShowDatePicker(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const tagColors = ['#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#10b981', '#6366f1'];

  const handleAddTag = () => {
    if (tagInput.trim() && !coloredTags.some(t => t.name === tagInput.trim())) {
      const newTag = { name: tagInput.trim(), color: selectedTagColor };
      setColoredTags([...coloredTags, newTag]);
      
      // Save to localStorage for suggestions
      const existingSaved = savedTags.filter(t => t.name !== newTag.name);
      const updatedSaved = [newTag, ...existingSaved].slice(0, 20); // Keep last 20 tags
      setSavedTags(updatedSaved);
      localStorage.setItem('savedColoredTags', JSON.stringify(updatedSaved));
      
      setTagInput('');
      setShowTagInput(false);
    }
  };

  const handleAddSavedTag = (tag: ColoredTag) => {
    if (!coloredTags.some(t => t.name === tag.name)) {
      setColoredTags([...coloredTags, tag]);
    }
  };

  const handleRemoveTag = (tagName: string) => {
    setColoredTags(coloredTags.filter(t => t.name !== tagName));
  };

  const handleDeleteSavedTag = (tagName: string) => {
    const updatedSaved = savedTags.filter(t => t.name !== tagName);
    setSavedTags(updatedSaved);
    localStorage.setItem('savedColoredTags', JSON.stringify(updatedSaved));
  };

  const handleStartEditTag = (tag: ColoredTag) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
  };

  const handleSaveEditTag = () => {
    if (!editingTag || !editTagName.trim()) return;
    
    const updatedSaved = savedTags.map(t => 
      t.name === editingTag.name ? { name: editTagName.trim(), color: editTagColor } : t
    );
    setSavedTags(updatedSaved);
    localStorage.setItem('savedColoredTags', JSON.stringify(updatedSaved));
    
    // Also update any currently selected tags
    setColoredTags(coloredTags.map(t => 
      t.name === editingTag.name ? { name: editTagName.trim(), color: editTagColor } : t
    ));
    
    setEditingTag(null);
    setEditTagName('');
    setEditTagColor('');
  };

  const handleCancelEditTag = () => {
    setEditingTag(null);
    setEditTagName('');
    setEditTagColor('');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
        onClick={onClose}
      />

      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-card z-50 rounded-t-[28px] shadow-2xl transition-all duration-500 ease-out pointer-events-auto",
          isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-full scale-95 opacity-0"
        )}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-6 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <Input
              ref={inputRef}
              placeholder="What would you like to do?"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="text-[17px] border-0 px-0 py-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none bg-transparent placeholder:text-muted-foreground/40"
              autoFocus
            />

            {taskText.trim() ? (
              <button
                onClick={handleSend}
                className="w-10 h-10 rounded-lg bg-primary hover:opacity-90 flex items-center justify-center transition-all flex-shrink-0"
              >
                <Send className="h-5 w-5 text-primary-foreground rotate-45" />
              </button>
            ) : (
              <button className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                <Mic className="h-5 w-5 text-muted-foreground/60" />
              </button>
            )}
          </div>

          {repeatType !== 'none' && (
            <div className="px-4 py-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg flex items-center gap-2 mb-4">
              <Repeat className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                {getRepeatLabel()}
              </span>
              <button
                onClick={() => {
                  setRepeatType('none');
                  setRepeatDays([]);
                }}
                className="ml-auto"
              >
                <X className="h-4 w-4 text-purple-500 hover:text-purple-700" />
              </button>
            </div>
          )}

          {/* Tags display */}
          {coloredTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {coloredTags.map((tag) => (
                <span 
                  key={tag.name} 
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border"
                  style={{ 
                    backgroundColor: `${tag.color}15`, 
                    borderColor: `${tag.color}40`,
                    color: tag.color 
                  }}
                >
                  <Tag className="h-3 w-3" />
                  {tag.name}
                  <button onClick={() => handleRemoveTag(tag.name)}>
                    <X className="h-3 w-3 hover:opacity-70" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Render action buttons in the order defined by actionItems */}
            {actionItems.filter(a => a.enabled).map((action) => {
              if (action.id === 'date') {
                return (
                  <Popover key={action.id} open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "relative flex items-center gap-1.5 px-3 py-2 rounded-md border transition-all",
                          dueDate ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-border bg-card hover:bg-muted"
                        )}
                      >
                        {dueDate && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />}
                        {dueDate ? (
                          <CalendarCheck className="h-4 w-4 text-blue-500" />
                        ) : (
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={cn("text-sm", dueDate ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground")}>
                          {dueDate ? format(dueDate, 'MMM d') : 'Date'}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                      <div className="p-3 space-y-2">
                        <div className="space-y-1">
                          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleQuickDate('today')}>Today</Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleQuickDate('tomorrow')}>Tomorrow</Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleQuickDate('weekend')}>This Weekend</Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleQuickDate('nextweek')}>Next Week</Button>
                        </div>
                        <Separator />
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={(date) => {
                            setDueDate(date);
                            setShowDatePicker(false);
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              }

              if (action.id === 'priority') {
                return (
                  <Popover key={action.id} open={showPriorityMenu} onOpenChange={setShowPriorityMenu}>
                    <PopoverTrigger asChild>
                      <button className={cn(
                        "relative flex items-center gap-1.5 px-3 py-2 rounded-md border transition-all",
                        priority === 'high' ? "border-red-500 bg-red-50 dark:bg-red-950/30" :
                        priority === 'medium' ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30" :
                        priority === 'low' ? "border-green-500 bg-green-50 dark:bg-green-950/30" :
                        "border-border bg-card hover:bg-muted"
                      )}>
                        {priority !== 'none' && (
                          <span className={cn(
                            "absolute -top-1 -right-1 w-2 h-2 rounded-full",
                            priority === 'high' ? 'bg-red-500' :
                            priority === 'medium' ? 'bg-orange-500' :
                            'bg-green-500'
                          )} />
                        )}
                        <Flag className={cn("h-4 w-4", 
                          priority === 'high' ? 'text-red-500 fill-red-500' : 
                          priority === 'medium' ? 'text-orange-500 fill-orange-500' : 
                          priority === 'low' ? 'text-green-500 fill-green-500' : 
                          'text-muted-foreground'
                        )} />
                        <span className={cn("text-sm",
                          priority === 'high' ? 'text-red-600 dark:text-red-400' : 
                          priority === 'medium' ? 'text-orange-600 dark:text-orange-400' : 
                          priority === 'low' ? 'text-green-600 dark:text-green-400' : 
                          'text-muted-foreground'
                        )}>
                          {priority !== 'none' ? (priority.charAt(0).toUpperCase() + priority.slice(1)) : 'Priority'}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2 bg-popover z-50" align="start">
                      <div className="space-y-1">
                        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setPriority('high'); setShowPriorityMenu(false); }}>
                          <Flag className="h-4 w-4 mr-2 text-red-500 fill-red-500" />High Priority
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setPriority('medium'); setShowPriorityMenu(false); }}>
                          <Flag className="h-4 w-4 mr-2 text-orange-500 fill-orange-500" />Medium Priority
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setPriority('low'); setShowPriorityMenu(false); }}>
                          <Flag className="h-4 w-4 mr-2 text-green-500 fill-green-500" />Low Priority
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setPriority('none'); setShowPriorityMenu(false); }}>
                          <Flag className="h-4 w-4 mr-2 text-gray-400" />No Priority
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              }

              if (action.id === 'reminder') {
                return (
                  <button
                    key={action.id}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-2 rounded-md border transition-all",
                      reminderTime ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30" : "border-border bg-card hover:bg-muted"
                    )}
                    onClick={() => setShowTimePicker(true)}
                  >
                    {reminderTime && <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />}
                    {reminderTime ? (
                      <BellRing className="h-4 w-4 text-purple-500 fill-purple-500" />
                    ) : (
                      <Timer className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={cn("text-sm", reminderTime ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground")}>
                      {reminderTime ? format(reminderTime, 'h:mm a') : 'Reminders'}
                    </span>
                  </button>
                );
              }

              if (action.id === 'tags') {
                return (
                  <Popover key={action.id} open={showTagInput} onOpenChange={setShowTagInput}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "relative flex items-center gap-1.5 px-3 py-2 rounded-md border transition-all",
                          coloredTags.length > 0 ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30" : "border-border bg-card hover:bg-muted"
                        )}
                      >
                        {coloredTags.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-500 rounded-full" />}
                        <Tag className={cn("h-4 w-4", coloredTags.length > 0 ? "text-teal-500" : "text-muted-foreground")} />
                        <span className={cn("text-sm", coloredTags.length > 0 ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground")}>
                          {coloredTags.length > 0 ? `${coloredTags.length} Tag${coloredTags.length > 1 ? 's' : ''}` : 'Tags'}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-3 bg-popover z-50" align="start">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a tag..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                            className="h-9 text-sm flex-1"
                          />
                          <Button size="sm" onClick={handleAddTag} disabled={!tagInput.trim()}>Add</Button>
                        </div>
                        
                        {savedTags.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-muted-foreground">Recent tags</p>
                              <button
                                onClick={() => setShowManageTags(true)}
                                className="text-xs text-primary hover:underline"
                              >
                                Manage
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {savedTags
                                .filter(st => !coloredTags.some(ct => ct.name === st.name))
                                .slice(0, 6)
                                .map((tag) => (
                                  <button
                                    key={tag.name}
                                    onClick={() => handleAddSavedTag(tag)}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full hover:opacity-80 transition-opacity"
                                    style={{ 
                                      backgroundColor: `${tag.color}20`, 
                                      color: tag.color 
                                    }}
                                  >
                                    <Tag className="h-3 w-3" />
                                    {tag.name}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Tag color</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {tagColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => setSelectedTagColor(color)}
                                className={cn(
                                  "w-7 h-7 rounded-full transition-all",
                                  selectedTagColor === color && "ring-2 ring-offset-2 ring-primary"
                                )}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        {coloredTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                            {coloredTags.map((tag) => (
                              <span 
                                key={tag.name} 
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full"
                                style={{ 
                                  backgroundColor: `${tag.color}20`, 
                                  color: tag.color 
                                }}
                              >
                                {tag.name}
                                <button onClick={() => handleRemoveTag(tag.name)}><X className="h-3 w-3" /></button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              }

              if (action.id === 'deadline') {
                return (
                  <Popover key={action.id} open={showDeadlinePicker} onOpenChange={setShowDeadlinePicker}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "relative flex items-center gap-1.5 px-3 py-2 rounded-md border transition-all",
                          deadline ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30" : "border-border bg-card hover:bg-muted"
                        )}
                      >
                        {deadline && <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />}
                        <CalendarClock className={cn("h-4 w-4", deadline ? "text-rose-500" : "text-muted-foreground")} />
                        <span className={cn("text-sm", deadline ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
                          {deadline ? format(deadline, 'MMM d') : 'Deadline'}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={(date) => {
                          setDeadline(date);
                          setShowDeadlinePicker(false);
                        }}
                      />
                      {deadline && (
                        <div className="p-2 border-t">
                          <Button variant="ghost" size="sm" className="w-full text-rose-500" onClick={() => { setDeadline(undefined); setShowDeadlinePicker(false); }}>
                            <X className="h-4 w-4 mr-2" />Remove Deadline
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                );
              }

              if (action.id === 'folder') {
                return (
                  <button
                    key={action.id}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-2 rounded-md border transition-all",
                      folderId ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : "border-border bg-card hover:bg-muted"
                    )}
                    onClick={() => setShowFolderDialog(true)}
                  >
                    {folderId && <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />}
                    <FolderIcon className={cn("h-4 w-4", folderId ? "text-amber-500" : "text-muted-foreground")} />
                    <span className={cn("text-sm", folderId ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                      {folderId ? folders.find(f => f.id === folderId)?.name || 'Folder' : 'Folder'}
                    </span>
                  </button>
                );
              }

              if (action.id === 'image') {
                return (
                  <button
                    key={action.id}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-2 rounded-md border transition-all",
                      imageUrl ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" : "border-border bg-card hover:bg-muted"
                    )}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    {imageUrl && <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />}
                    <ImageIcon className={cn("h-4 w-4", imageUrl ? "text-emerald-500" : "text-muted-foreground")} />
                    <span className={cn("text-sm", imageUrl ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                      {imageUrl ? 'Image Added' : 'Image'}
                    </span>
                  </button>
                );
              }

              if (action.id === 'repeat') {
                return (
                  <Popover key={action.id} open={showRepeatMenu} onOpenChange={setShowRepeatMenu}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "relative flex items-center gap-1.5 px-3 py-2 rounded-md border transition-all",
                          repeatType !== 'none' ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "border-border bg-card hover:bg-muted"
                        )}
                      >
                        {repeatType !== 'none' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full" />}
                        <Repeat className={cn("h-4 w-4", repeatType !== 'none' ? "text-indigo-500" : "text-muted-foreground")} />
                        <span className={cn("text-sm", repeatType !== 'none' ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground")}>
                          {repeatType !== 'none' ? getRepeatLabel() : 'Repeat'}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 bg-popover z-50" align="start">
                      {dueDate ? (
                        <div className="space-y-1">
                          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setRepeatType('daily'); setShowRepeatMenu(false); }}>
                            <Repeat className="h-4 w-4 mr-2" />Repeat Daily
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setRepeatType('weekly'); setShowRepeatMenu(false); }}>
                            <Repeat className="h-4 w-4 mr-2" />Repeat Weekly
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setRepeatType('monthly'); setShowRepeatMenu(false); }}>
                            <Repeat className="h-4 w-4 mr-2" />Monthly
                          </Button>
                          {repeatType !== 'none' && (
                            <>
                              <Separator className="my-1" />
                              <Button variant="ghost" size="sm" className="w-full justify-start text-red-500" onClick={() => { setRepeatType('none'); setRepeatDays([]); setShowRepeatMenu(false); }}>
                                <X className="h-4 w-4 mr-2" />Remove Repeat
                              </Button>
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground p-2">Set a due date first to enable repeat options</p>
                      )}
                    </PopoverContent>
                  </Popover>
                );
              }

              return null;
            })}

            {/* Edit Actions Button - always last */}
            <button
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-md border border-border bg-card hover:bg-muted transition-all"
              onClick={() => setShowEditActions(true)}
            >
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Edit Actions</span>
            </button>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </div>
      </div>

      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select or Create Folder</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {folders.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Select Folder:</p>
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { setFolderId(undefined); setShowFolderDialog(false); }}>
                    <FolderIcon className="h-4 w-4 mr-2" />All Tasks
                  </Button>
                  {folders.map((folder) => (
                    <Button
                      key={folder.id}
                      variant={folderId === folder.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => { setFolderId(folder.id); setShowFolderDialog(false); }}
                    >
                      <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: folder.color }} />
                      {folder.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium">Create New Folder:</p>
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }}
              />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Color</p>
                <div className="flex gap-2">
                  {folderColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn("w-10 h-10 rounded-full transition-all", selectedColor === color && "ring-2 ring-primary ring-offset-2")}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateFolder} className="w-full" disabled={!newFolderName.trim()}>
                Create Folder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showTimePicker && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Timer className="h-5 w-5 text-muted-foreground" />
                Set Reminder
              </h3>
              <Button size="icon" variant="ghost" onClick={() => setShowTimePicker(false)} className="h-8 w-8">
                <X className="h-5 w-5" />
              </Button>
            </div>

            {reminderTime && (
              <div className="mb-4 p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Current reminder:</p>
                <p className="text-sm font-medium flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-cyan-500" />
                  {format(reminderTime, 'h:mm a')}
                </p>
                <Button
                  onClick={() => { setReminderTime(undefined); setShowTimePicker(false); }}
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-8 text-xs text-red-500 hover:text-red-600"
                >
                  Remove Reminder
                </Button>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Time</label>
                <input
                  type="time"
                  onChange={(e) => handleSetReminder(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-lg"
                />
              </div>
              <p className="text-xs text-muted-foreground">You'll receive a notification at the selected time</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Actions Sheet */}
      <EditActionsSheet
        isOpen={showEditActions}
        onClose={() => setShowEditActions(false)}
        actions={actionItems}
        onSave={handleSaveActions}
      />

      {/* Manage Tags Dialog */}
      <Dialog open={showManageTags} onOpenChange={(open) => {
        setShowManageTags(open);
        if (!open) handleCancelEditTag();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Saved Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {savedTags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No saved tags yet</p>
            ) : (
              savedTags.map((tag) => (
                <div 
                  key={tag.name} 
                  className="flex flex-col gap-2 p-3 rounded-lg border border-border"
                >
                  {editingTag?.name === tag.name ? (
                    <>
                      <Input
                        value={editTagName}
                        onChange={(e) => setEditTagName(e.target.value)}
                        placeholder="Tag name"
                        className="h-9"
                        autoFocus
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {tagColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditTagColor(color)}
                            className={cn(
                              "w-7 h-7 rounded-full transition-all",
                              editTagColor === color && "ring-2 ring-primary ring-offset-2"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Button size="sm" onClick={handleSaveEditTag} className="flex-1 h-8">
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEditTag} className="flex-1 h-8">
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => handleStartEditTag(tag)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <span 
                          className="w-4 h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: tag.color }} 
                        />
                        <span className="text-sm font-medium">{tag.name}</span>
                      </button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteSavedTag(tag.name)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
