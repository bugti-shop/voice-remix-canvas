import { useState, useRef } from 'react';
import { TodoItem, Priority, ColoredTag } from '@/types/note';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Repeat, Trash2, Check, Tag, Play, Pause, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TaskItemProps {
  item: TodoItem;
  level?: number;
  onUpdate: (itemId: string, updates: Partial<TodoItem>) => void;
  onDelete: (itemId: string) => void;
  onTaskClick: (item: TodoItem) => void;
  onImageClick: (imageUrl: string) => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onSelect?: (itemId: string) => void;
}

const getPriorityBorderColor = (priority?: Priority) => {
  switch (priority) {
    case 'high': return 'border-red-500';
    case 'medium': return 'border-orange-500';
    case 'low': return 'border-green-500';
    default: return 'border-muted-foreground/40';
  }
};

export const TaskItem = ({
  item,
  level = 0,
  onUpdate,
  onDelete,
  onTaskClick,
  onImageClick,
  isSelected = false,
  isSelectionMode = false,
  onSelect
}: TaskItemProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasSubtasks = item.subtasks && item.subtasks.length > 0;
  const indentPx = level * 16;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.voiceRecording) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlayingVoice(false);
      return;
    }

    const audio = new Audio(item.voiceRecording.audioUrl);
    audioRef.current = audio;
    audio.onended = () => {
      setIsPlayingVoice(false);
      audioRef.current = null;
    };
    audio.play();
    setIsPlayingVoice(true);
  };

  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    
    // Only swipe horizontally if not scrolling vertically
    if (deltaY < 30) {
      setIsSwiping(true);
      // Limit swipe range
      const clampedX = Math.max(-120, Math.min(120, deltaX));
      setSwipeX(clampedX);
    }
  };

  const handleTouchEnd = async () => {
    if (swipeX < -SWIPE_THRESHOLD) {
      // Swipe left - Delete
      try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
      onDelete(item.id);
    } else if (swipeX > SWIPE_THRESHOLD) {
      // Swipe right - Toggle complete
      try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
      onUpdate(item.id, { completed: !item.completed });
    }
    setSwipeX(0);
    setIsSwiping(false);
  };

  return (
    <div className="space-y-2" style={{ paddingLeft: indentPx > 0 ? `${indentPx}px` : undefined }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="relative overflow-hidden rounded-lg">
          {/* Swipe action backgrounds */}
          <div className="absolute inset-0 flex">
            <div className={cn(
              "flex-1 flex items-center justify-start pl-4 transition-colors",
              swipeX > SWIPE_THRESHOLD ? "bg-green-500" : "bg-green-500/70"
            )}>
              <Check className="h-6 w-6 text-white" />
            </div>
            <div className={cn(
              "flex-1 flex items-center justify-end pr-4 transition-colors",
              swipeX < -SWIPE_THRESHOLD ? "bg-red-500" : "bg-red-500/70"
            )}>
              <Trash2 className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Main task card */}
          <div
            className={cn(
              "bg-card rounded-lg border group hover:shadow-sm transition-all p-2 cursor-pointer h-[72px] relative",
              isSelected && "ring-2 ring-primary",
              level > 0 && "mr-2"
            )}
            style={{ transform: `translateX(${swipeX}px)`, transition: isSwiping ? 'none' : 'transform 0.3s ease-out' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center gap-2 h-full">
              {isSelectionMode && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelect?.(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5 flex-shrink-0"
                />
              )}
              <div className="relative flex items-center flex-shrink-0">
                {hasSubtasks && (
                  <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="absolute -top-4 left-1/2 -translate-x-1/2 h-3 w-6 p-0 flex items-center justify-center hover:bg-transparent focus:bg-transparent focus:outline-none">
                      {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                  </CollapsibleTrigger>
                )}
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={async (checked) => {
                    // Update immediately for instant visual feedback
                    onUpdate(item.id, { completed: !!checked });
                    if (checked && !item.completed) {
                      try {
                        await Haptics.impact({ style: ImpactStyle.Heavy });
                        setTimeout(async () => { try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {} }, 100);
                      } catch {}
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "h-6 w-6 flex-shrink-0 transition-all",
                    item.completed 
                      ? "rounded-sm border-2 border-muted-foreground/50 bg-muted-foreground/20 data-[state=checked]:bg-muted-foreground/20 data-[state=checked]:text-muted-foreground" 
                      : cn("rounded-full border-2", getPriorityBorderColor(item.priority))
                  )}
                />
              </div>
              <div
                className="flex-1 min-w-0 overflow-hidden mr-2"
                onClick={(e) => { e.stopPropagation(); if (!isSelectionMode && !isSwiping) onTaskClick(item); }}
              >
                <div className="flex items-center gap-2">
                  {item.voiceRecording && (
                    <Mic className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  )}
                  <p className={cn("text-sm font-medium truncate", item.completed && "text-muted-foreground")}>{item.text}</p>
                  {item.repeatType && item.repeatType !== 'none' && <Repeat className="h-3 w-3 text-purple-500 flex-shrink-0" />}
                </div>
                {/* Voice recording indicator */}
                {item.voiceRecording && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <button
                      onClick={handlePlayVoice}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      {isPlayingVoice ? (
                        <Pause className="h-3 w-3 text-primary" />
                      ) : (
                        <Play className="h-3 w-3 text-primary" />
                      )}
                      <span className="text-[10px] text-primary font-medium">
                        {formatDuration(item.voiceRecording.duration)}
                      </span>
                    </button>
                  </div>
                )}
                {/* Colored tags display */}
                {item.coloredTags && item.coloredTags.length > 0 && !item.voiceRecording && (
                  <div className="flex items-center gap-1 mt-1 overflow-hidden">
                    {item.coloredTags.slice(0, 3).map((tag) => (
                      <span 
                        key={tag.name}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded-full truncate max-w-[60px]"
                        style={{ 
                          backgroundColor: `${tag.color}20`, 
                          color: tag.color 
                        }}
                      >
                        <Tag className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="truncate">{tag.name}</span>
                      </span>
                    ))}
                    {item.coloredTags.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{item.coloredTags.length - 3}</span>
                    )}
                  </div>
                )}
                {hasSubtasks && <p className="text-xs text-muted-foreground mt-1">{item.subtasks!.filter(st => st.completed).length}/{item.subtasks!.length} subtasks</p>}
              </div>
              {item.imageUrl && (
                <div
                  className="w-14 h-14 rounded-full overflow-hidden border-2 border-border flex-shrink-0 ml-1 cursor-pointer hover:border-primary transition-colors"
                  onClick={(e) => { e.stopPropagation(); onImageClick(item.imageUrl!); }}
                >
                  <img src={item.imageUrl} alt="Task attachment" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>

        {hasSubtasks && (
          <CollapsibleContent className="space-y-2">
            {item.subtasks!.map((subtask) => (
              <TaskItem
                key={subtask.id}
                item={subtask}
                level={level + 1}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onTaskClick={onTaskClick}
                onImageClick={onImageClick}
                isSelected={isSelected}
                isSelectionMode={isSelectionMode}
                onSelect={onSelect}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
};
