import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  X, 
  GripVertical, 
  Calendar as CalendarIcon,
  Flag,
  Timer,
  Tag,
  CalendarClock,
  FolderIcon,
  Image as ImageIcon,
  Repeat,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionItem {
  id: string;
  name: string;
  icon: React.ElementType;
  enabled: boolean;
  color?: string;
}

export const defaultActions: ActionItem[] = [
  { id: 'date', name: 'Date', icon: CalendarIcon, enabled: true, color: 'text-blue-500' },
  { id: 'priority', name: 'Priority', icon: Flag, enabled: true, color: 'text-orange-500' },
  { id: 'reminder', name: 'Reminders', icon: Timer, enabled: true, color: 'text-purple-500' },
  { id: 'tags', name: 'Tags', icon: Tag, enabled: true, color: 'text-teal-500' },
  { id: 'deadline', name: 'Deadline', icon: CalendarClock, enabled: true, color: 'text-rose-500' },
  { id: 'folder', name: 'Folder', icon: FolderIcon, enabled: true, color: 'text-amber-500' },
  { id: 'image', name: 'Image', icon: ImageIcon, enabled: true, color: 'text-emerald-500' },
  { id: 'repeat', name: 'Repeat', icon: Repeat, enabled: true, color: 'text-indigo-500' },
];

interface EditActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  actions: ActionItem[];
  onSave: (actions: ActionItem[]) => void;
}

export const EditActionsSheet = ({ isOpen, onClose, actions, onSave }: EditActionsSheetProps) => {
  const [localActions, setLocalActions] = useState<ActionItem[]>(actions);

  useEffect(() => {
    setLocalActions(actions);
  }, [actions]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(localActions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setLocalActions(items);
  };

  const handleToggle = (id: string) => {
    setLocalActions(prev => 
      prev.map(action => 
        action.id === id ? { ...action, enabled: !action.enabled } : action
      )
    );
  };

  const handleSave = () => {
    onSave(localActions);
    onClose();
  };

  const handleReset = () => {
    setLocalActions(defaultActions);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-[80] flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <X className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold">Edit Actions</h2>
            <p className="text-xs text-muted-foreground">Customize action buttons order & visibility</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>Reset</Button>
          <Button size="sm" onClick={handleSave}>Save</Button>
        </div>
      </div>

      {/* Actions List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-lg mx-auto">
          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Drag to reorder. Toggle to show/hide actions.
          </p>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="actions">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {localActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Draggable key={action.id} draggableId={action.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border transition-all",
                              action.enabled 
                                ? "bg-card border-border" 
                                : "bg-muted/30 border-border/50 opacity-60",
                              snapshot.isDragging && "shadow-lg ring-2 ring-primary/20"
                            )}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="touch-none"
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 cursor-grab active:cursor-grabbing" />
                            </div>
                            
                            <div className={cn("p-2 rounded-lg", action.enabled ? "bg-muted" : "bg-muted/50")}>
                              <Icon className={cn("h-5 w-5", action.enabled ? action.color : "text-muted-foreground")} />
                            </div>

                            <span className={cn(
                              "flex-1 font-medium",
                              !action.enabled && "text-muted-foreground"
                            )}>
                              {action.name}
                            </span>

                            <Switch 
                              checked={action.enabled} 
                              onCheckedChange={() => handleToggle(action.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground mb-3 text-center">Preview</p>
        <div className="flex items-center gap-2 flex-wrap justify-center max-w-lg mx-auto">
          {localActions.filter(a => a.enabled).map((action) => {
            const Icon = action.icon;
            return (
              <div 
                key={action.id}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border bg-card"
              >
                <Icon className={cn("h-4 w-4", action.color)} />
                <span className="text-sm text-muted-foreground">{action.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
