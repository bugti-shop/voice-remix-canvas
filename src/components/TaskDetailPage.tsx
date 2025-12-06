import { useState, useRef, useEffect } from 'react';
import { TodoItem, Priority, Folder, Note, RepeatType, ColoredTag } from '@/types/note';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  ArrowLeft,
  FolderIcon,
  ChevronDown,
  MoreVertical,
  Check,
  Flag,
  Copy,
  Pin,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Bell,
  Repeat,
  FileText,
  Paperclip,
  Tag,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { WaveformVisualizer } from './WaveformVisualizer';
import { Play, Pause } from 'lucide-react';

interface TaskDetailPageProps {
  isOpen: boolean;
  task: TodoItem | null;
  folders: Folder[];
  onClose: () => void;
  onUpdate: (task: TodoItem) => void;
  onDelete: (taskId: string) => void;
  onDuplicate: (task: TodoItem) => void;
  onConvertToNote: (task: TodoItem) => void;
  onMoveToFolder: (taskId: string, folderId: string | null) => void;
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

const REPEAT_OPTIONS: { value: RepeatType; label: string }[] = [
  { value: 'none', label: 'Never' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'monthly', label: 'Monthly' },
];

export const TaskDetailPage = ({
  isOpen,
  task,
  folders,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  onConvertToNote,
  onMoveToFolder
}: TaskDetailPageProps) => {
  const [title, setTitle] = useState('');
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.text);
    }
  }, [task]);

  useEffect(() => {
    if (showSubtaskInput && subtaskInputRef.current) {
      subtaskInputRef.current.focus();
    }
  }, [showSubtaskInput]);

  if (!isOpen || !task) return null;

  const currentFolder = folders.find(f => f.id === task.folderId);

  const handleTitleBlur = () => {
    if (title.trim() !== task.text) {
      onUpdate({ ...task, text: title.trim() });
    }
  };

  const handleMarkAsDone = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
    onUpdate({ ...task, completed: !task.completed });
    toast.success(task.completed ? 'Task marked as incomplete' : 'Task marked as done');
  };

  const handleSetPriority = async (priority: Priority) => {
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
    onUpdate({ ...task, priority });
    toast.success(`Priority set to ${priority === 'none' ? 'none' : priority}`);
  };

  const handleDuplicate = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
    onDuplicate(task);
    onClose();
    toast.success('Task duplicated');
  };

  const handlePin = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
    toast.success('Task pinned');
  };

  const handleDelete = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
    onDelete(task.id);
    onClose();
    toast.success('Task deleted');
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskText.trim()) return;
    
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
    
    const newSubtask: TodoItem = {
      id: Date.now().toString(),
      text: newSubtaskText.trim(),
      completed: false,
    };

    onUpdate({
      ...task,
      subtasks: [...(task.subtasks || []), newSubtask]
    });

    setNewSubtaskText('');
    // Keep input open for next subtask
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
    const updatedSubtasks = (task.subtasks || []).map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    onUpdate({
      ...task,
      subtasks: (task.subtasks || []).filter(st => st.id !== subtaskId)
    });
  };

  const handleSetDate = (date: Date | undefined) => {
    onUpdate({ ...task, dueDate: date });
    setShowDatePicker(false);
    if (date) toast.success(`Date set to ${format(date, 'MMM d, yyyy')}`);
  };

  const handleSetDeadline = (date: Date | undefined) => {
    // Using dueDate for deadline as well - you could add a separate deadline field if needed
    onUpdate({ ...task, dueDate: date });
    setShowDeadlinePicker(false);
    if (date) toast.success(`Deadline set to ${format(date, 'MMM d, yyyy')}`);
  };

  const handleSetReminder = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);

    if (reminderDate < new Date()) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }

    onUpdate({ ...task, reminderTime: reminderDate });
    setShowTimePicker(false);
    toast.success(`Reminder set for ${format(reminderDate, 'h:mm a')}`);
  };

  const handleSetRepeat = (repeatType: RepeatType) => {
    onUpdate({ ...task, repeatType });
    setShowRepeatPicker(false);
    toast.success(`Repeat set to ${repeatType}`);
  };

  const handleConvertToNote = () => {
    onConvertToNote(task);
    onClose();
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpdate({ ...task, imageUrl: dataUrl });
      toast.success('Attachment added');
    };
    reader.readAsDataURL(file);
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    
    const newTag: ColoredTag = {
      name: newTagName.trim(),
      color: newTagColor
    };

    onUpdate({
      ...task,
      coloredTags: [...(task.coloredTags || []), newTag]
    });

    // Save to suggestions
    const savedTags = JSON.parse(localStorage.getItem('coloredTagSuggestions') || '[]');
    const exists = savedTags.some((t: ColoredTag) => t.name === newTag.name);
    if (!exists) {
      localStorage.setItem('coloredTagSuggestions', JSON.stringify([newTag, ...savedTags].slice(0, 20)));
    }

    setNewTagName('');
    setShowTagInput(false);
    toast.success('Tag added');
  };

  const handleRemoveTag = (tagName: string) => {
    onUpdate({
      ...task,
      coloredTags: (task.coloredTags || []).filter(t => t.name !== tagName)
    });
  };

  const handleVoicePlay = () => {
    if (!task.voiceRecording) return;

    if (playingVoiceId === task.id && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingVoiceId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(task.voiceRecording.audioUrl);
    audioRef.current = audio;
    audio.onended = () => {
      setPlayingVoiceId(null);
      audioRef.current = null;
    };
    audio.play();
    setPlayingVoiceId(task.id);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-orange-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn(
      "fixed inset-0 bg-background z-50 flex flex-col transition-transform duration-300",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        {/* Left: Folders Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <FolderIcon className="h-4 w-4" />
              <span>{currentFolder?.name || 'All Tasks'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-popover border shadow-lg z-[60]">
            <DropdownMenuItem 
              onClick={() => onMoveToFolder(task.id, null)}
              className={cn("cursor-pointer", !task.folderId && "bg-accent")}
            >
              <FolderIcon className="h-4 w-4 mr-2" />
              All Tasks (No folder)
              {!task.folderId && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {folders.map((folder) => (
              <DropdownMenuItem 
                key={folder.id}
                onClick={() => onMoveToFolder(task.id, folder.id)}
                className={cn("cursor-pointer", task.folderId === folder.id && "bg-accent")}
              >
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: folder.color }} />
                {folder.name}
                {task.folderId === folder.id && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Right: Options Menu */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg z-[60]">
              <DropdownMenuItem onClick={handleMarkAsDone} className="cursor-pointer">
                <Check className="h-4 w-4 mr-2" />
                {task.completed ? 'Mark as Incomplete' : 'Mark as Done'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer p-0">
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full flex items-center px-2 py-1.5 cursor-pointer">
                    <Flag className="h-4 w-4 mr-2" />
                    Set Priority
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="left" className="bg-popover border shadow-lg z-[70]">
                    <DropdownMenuItem onClick={() => handleSetPriority('high')} className="cursor-pointer">
                      <Flag className="h-4 w-4 mr-2 text-red-500" />High
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetPriority('medium')} className="cursor-pointer">
                      <Flag className="h-4 w-4 mr-2 text-orange-500" />Medium
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetPriority('low')} className="cursor-pointer">
                      <Flag className="h-4 w-4 mr-2 text-green-500" />Low
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetPriority('none')} className="cursor-pointer">
                      <Flag className="h-4 w-4 mr-2 text-muted-foreground" />None
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate} className="cursor-pointer">
                <Copy className="h-4 w-4 mr-2" />Duplicate Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePin} className="cursor-pointer">
                <Pin className="h-4 w-4 mr-2" />Pin Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Task Title */}
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Task title..."
            className={cn(
              "text-xl font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0",
              task.completed && "line-through opacity-60"
            )}
          />
          {task.priority && task.priority !== 'none' && (
            <div className="flex items-center gap-1.5">
              <Flag className={cn("h-4 w-4", getPriorityColor(task.priority))} />
              <span className={cn("text-sm capitalize", getPriorityColor(task.priority))}>
                {task.priority} Priority
              </span>
            </div>
          )}
        </div>

        {/* Voice Recording Display */}
        {task.voiceRecording && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <button
              onClick={handleVoicePlay}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              {playingVoiceId === task.id ? (
                <Pause className="h-5 w-5 text-primary" />
              ) : (
                <Play className="h-5 w-5 text-primary" />
              )}
              <WaveformVisualizer 
                isActive={playingVoiceId === task.id} 
                barCount={20}
                color="hsl(var(--primary))"
                className="h-6 w-24"
              />
              <span className="text-sm text-primary font-medium">
                {formatDuration(task.voiceRecording.duration)}
              </span>
            </button>
          </div>
        )}

        {/* Image Display */}
        {task.imageUrl && (
          <div className="rounded-xl overflow-hidden border border-border">
            <img src={task.imageUrl} alt="Task attachment" className="w-full max-h-48 object-cover" />
          </div>
        )}

        {/* Subtasks */}
        <div className="space-y-3">
          <button
            onClick={() => setShowSubtaskInput(true)}
            className="flex items-center gap-2 text-primary font-medium"
          >
            <Plus className="h-5 w-5" />
            Add Sub-task
          </button>

          {showSubtaskInput && (
            <div className="flex items-center gap-2 pl-7">
              <Checkbox className="h-5 w-5 rounded-sm border-2" disabled />
              <Input
                ref={subtaskInputRef}
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                placeholder="Type subtask and press Enter..."
                className="flex-1 h-9"
              />
              <Button variant="ghost" size="icon" onClick={() => setShowSubtaskInput(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-2 pl-2">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-3 py-2 group">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => handleToggleSubtask(subtask.id)}
                    className={cn(
                      "h-5 w-5 rounded-sm border-2",
                      subtask.completed && "border-muted-foreground/50"
                    )}
                  />
                  <span className={cn("flex-1 text-sm", subtask.completed && "line-through text-muted-foreground")}>
                    {subtask.text}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Items */}
        <div className="space-y-1 border-t border-border pt-4">
          {/* Date */}
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 transition-colors">
                <CalendarIcon className="h-5 w-5 text-cyan-500" />
                <span className="flex-1 text-left">Date</span>
                <span className="text-sm text-muted-foreground">
                  {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'Not set'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[60]" align="start">
              <Calendar
                mode="single"
                selected={task.dueDate ? new Date(task.dueDate) : undefined}
                onSelect={handleSetDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Deadline */}
          <Popover open={showDeadlinePicker} onOpenChange={setShowDeadlinePicker}>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 transition-colors">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className="flex-1 text-left">Deadline</span>
                <span className="text-sm text-muted-foreground">
                  {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'Not set'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[60]" align="start">
              <Calendar
                mode="single"
                selected={task.dueDate ? new Date(task.dueDate) : undefined}
                onSelect={handleSetDeadline}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Time & Reminder */}
          <Popover open={showTimePicker} onOpenChange={setShowTimePicker}>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 transition-colors">
                <Bell className="h-5 w-5 text-purple-500" />
                <span className="flex-1 text-left">Time & Reminder</span>
                <span className="text-sm text-muted-foreground">
                  {task.reminderTime ? format(new Date(task.reminderTime), 'h:mm a') : 'Not set'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 z-[60]" align="start">
              <div className="space-y-3">
                <label className="text-sm font-medium">Set Reminder Time</label>
                <input
                  type="time"
                  onChange={(e) => handleSetReminder(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                />
                {task.reminderTime && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-destructive"
                    onClick={() => {
                      onUpdate({ ...task, reminderTime: undefined });
                      setShowTimePicker(false);
                      toast.success('Reminder removed');
                    }}
                  >
                    Remove Reminder
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Repeat Task */}
          <Popover open={showRepeatPicker} onOpenChange={setShowRepeatPicker}>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 transition-colors">
                <Repeat className="h-5 w-5 text-green-500" />
                <span className="flex-1 text-left">Repeat Task</span>
                <span className="text-sm text-muted-foreground capitalize">
                  {task.repeatType === 'none' ? 'Never' : task.repeatType || 'Never'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 z-[60]" align="start">
              <div className="space-y-1">
                {REPEAT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSetRepeat(option.value)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors",
                      task.repeatType === option.value && "bg-accent"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Convert to Notes */}
          <button 
            onClick={handleConvertToNote}
            className="w-full flex items-center gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 transition-colors"
          >
            <FileText className="h-5 w-5 text-blue-500" />
            <span className="flex-1 text-left">Convert to Notes</span>
          </button>

          {/* Attachment */}
          <button 
            onClick={handleAttachment}
            className="w-full flex items-center gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 transition-colors"
          >
            <Paperclip className="h-5 w-5 text-pink-500" />
            <span className="flex-1 text-left">Attachment</span>
            {task.imageUrl && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Tag */}
          <div className="space-y-2">
            <Popover open={showTagInput} onOpenChange={setShowTagInput}>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center gap-3 py-3 hover:bg-muted/50 rounded-lg px-2 transition-colors">
                  <Tag className="h-5 w-5 text-yellow-500" />
                  <span className="flex-1 text-left">Tag</span>
                  <span className="text-sm text-muted-foreground">
                    {task.coloredTags?.length || 0} tag(s)
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 z-[60]" align="start">
                <div className="space-y-3">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Tag name..."
                    className="h-9"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform",
                          newTagColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Button onClick={handleAddTag} size="sm" className="w-full">
                    Add Tag
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Display existing tags */}
            {task.coloredTags && task.coloredTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-10">
                {task.coloredTags.map((tag) => (
                  <span
                    key={tag.name}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    {tag.name}
                    <button onClick={() => handleRemoveTag(tag.name)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safe area padding for bottom */}
      <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }} />
    </div>
  );
};
