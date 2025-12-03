import { useState } from 'react';
import { TodoItem, Priority } from '@/types/note';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
    case 'low': return 'border-blue-500';
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
  const hasSubtasks = item.subtasks && item.subtasks.length > 0;
  const indentPx = level * 16;

  return (
    <div className="space-y-2" style={{ paddingLeft: indentPx > 0 ? `${indentPx}px` : undefined }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            "bg-card rounded-lg border group hover:shadow-sm transition-all p-2 cursor-pointer h-[72px]",
            isSelected && "ring-2 ring-primary",
            level > 0 && "mr-2"
          )}
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
                  <button
                    className="absolute -top-4 left-1/2 -translate-x-1/2 h-3 w-6 p-0 flex items-center justify-center hover:bg-transparent focus:bg-transparent focus:outline-none"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </button>
                </CollapsibleTrigger>
              )}
              <Checkbox
                checked={item.completed}
                onCheckedChange={async (checked) => {
                  if (checked && !item.completed) {
                    try {
                      await Haptics.impact({ style: ImpactStyle.Heavy });
                      setTimeout(async () => {
                        try {
                          await Haptics.impact({ style: ImpactStyle.Medium });
                        } catch {}
                      }, 100);
                    } catch (error) {
                      console.log('Haptics not available');
                    }
                  }
                  onUpdate(item.id, { completed: !!checked });
                }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "h-6 w-6 rounded-full border-2 flex-shrink-0 transition-all",
                  item.completed
                    ? "bg-green-500 border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:text-white scale-110"
                    : getPriorityBorderColor(item.priority)
                )}
              />
            </div>
            <div
              className="flex-1 min-w-0 overflow-hidden mr-2"
              onClick={(e) => {
                e.stopPropagation();
                if (!isSelectionMode) {
                  onTaskClick(item);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <p className={cn(
                  "text-sm font-medium truncate",
                  item.completed && "line-through text-muted-foreground"
                )}>
                  {item.text}
                </p>
                {item.repeatType && item.repeatType !== 'none' && (
                  <Repeat className="h-3 w-3 text-purple-500 flex-shrink-0" />
                )}
              </div>
              {hasSubtasks && (
                <p className="text-xs text-muted-foreground mt-1">
                  {item.subtasks!.filter(st => st.completed).length}/{item.subtasks!.length} subtasks
                </p>
              )}
            </div>
            {item.imageUrl && (
              <div
                className="w-14 h-14 rounded-full overflow-hidden border-2 border-border flex-shrink-0 ml-1 cursor-pointer hover:border-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(item.imageUrl!);
                }}
              >
                <img
                  src={item.imageUrl}
                  alt="Task attachment"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
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
