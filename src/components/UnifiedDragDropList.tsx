import { useState, useRef, useCallback, useEffect } from 'react';
import { TodoItem, TaskSection } from '@/types/note';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { cn } from '@/lib/utils';

interface UnifiedDragDropListProps {
  sections: TaskSection[];
  items: TodoItem[];
  onReorder: (updatedItems: TodoItem[]) => void;
  onTaskClick: (task: TodoItem, parentId?: string) => void;
  renderTask: (item: TodoItem, isDragging: boolean, isDropTarget: boolean, parentId?: string) => React.ReactNode;
  renderSubtask: (subtask: TodoItem, parentId: string, isDragging: boolean, isDropTarget: boolean) => React.ReactNode;
  renderSectionHeader: (section: TaskSection) => React.ReactNode;
  renderEmptySection: (section: TaskSection) => React.ReactNode;
  expandedTasks: Set<string>;
  className?: string;
}

const LONG_PRESS_DELAY = 300;

interface DragItem {
  id: string;
  type: 'task' | 'subtask';
  parentId?: string;
  sectionId?: string;
}

export const UnifiedDragDropList = ({
  sections,
  items,
  onReorder,
  onTaskClick,
  renderTask,
  renderSubtask,
  renderSectionHeader,
  renderEmptySection,
  expandedTasks,
  className
}: UnifiedDragDropListProps) => {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedItem: DragItem | null;
    translateY: number;
    startY: number;
    dropTarget: {
      type: 'section' | 'task' | 'subtask-area';
      sectionId?: string;
      taskId?: string;
      position?: 'before' | 'after';
    } | null;
  }>({
    isDragging: false,
    draggedItem: null,
    translateY: 0,
    startY: 0,
    dropTarget: null,
  });

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((item: DragItem, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    hasMovedRef.current = false;

    longPressTimerRef.current = setTimeout(async () => {
      if (!hasMovedRef.current) {
        try {
          await Haptics.impact({ style: ImpactStyle.Medium });
        } catch {}

        setDragState({
          isDragging: true,
          draggedItem: item,
          translateY: 0,
          startY: touch.clientY,
          dropTarget: null,
        });
      }
    }, LONG_PRESS_DELAY);
  }, []);

  const findDropTarget = useCallback((touchY: number, touchX: number): typeof dragState.dropTarget => {
    if (!dragState.draggedItem) return null;

    let bestTarget: typeof dragState.dropTarget = null;
    let bestDistance = Infinity;

    // Check all task items
    itemRefs.current.forEach((ref, id) => {
      if (id === dragState.draggedItem?.id) return;
      
      const rect = ref.getBoundingClientRect();
      if (touchY >= rect.top && touchY <= rect.bottom) {
        const itemCenter = rect.top + rect.height / 2;
        const distance = Math.abs(touchY - itemCenter);
        
        if (distance < bestDistance) {
          bestDistance = distance;
          
          // Check if dragging a task near another task
          const item = items.find(i => i.id === id);
          if (item) {
            // If touch is in the middle area of the task, it's a "make subtask" drop
            const taskThird = rect.height / 3;
            const middleStart = rect.top + taskThird;
            const middleEnd = rect.bottom - taskThird;
            
            if (touchY > middleStart && touchY < middleEnd && dragState.draggedItem.type === 'task') {
              bestTarget = { type: 'subtask-area', taskId: id };
            } else {
              bestTarget = { 
                type: 'task', 
                taskId: id, 
                position: touchY < itemCenter ? 'before' : 'after',
                sectionId: item.sectionId
              };
            }
          }
        }
      }
    });

    // If no direct task hit, check sections
    if (!bestTarget) {
      sectionRefs.current.forEach((ref, sectionId) => {
        const rect = ref.getBoundingClientRect();
        if (touchY >= rect.top && touchY <= rect.bottom) {
          bestTarget = { type: 'section', sectionId };
        }
      });
    }

    return bestTarget;
  }, [dragState.draggedItem, items]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    if (!dragState.isDragging && (deltaX > 10 || deltaY > 10)) {
      hasMovedRef.current = true;
      clearLongPressTimer();
      return;
    }

    if (dragState.isDragging) {
      e.preventDefault();
      e.stopPropagation();
      
      const translateY = touch.clientY - dragState.startY;
      const newDropTarget = findDropTarget(touch.clientY, touch.clientX);
      
      // Haptic feedback when changing drop target
      if (JSON.stringify(newDropTarget) !== JSON.stringify(dragState.dropTarget)) {
        try {
          Haptics.impact({ style: ImpactStyle.Light });
        } catch {}
      }

      setDragState(prev => ({
        ...prev,
        translateY,
        dropTarget: newDropTarget,
      }));
    }
  }, [dragState, findDropTarget, clearLongPressTimer]);

  const handleTouchEnd = useCallback(() => {
    clearLongPressTimer();

    if (dragState.isDragging && dragState.draggedItem && dragState.dropTarget) {
      const { draggedItem, dropTarget } = dragState;
      let newItems = [...items];

      try {
        Haptics.impact({ style: ImpactStyle.Heavy });
      } catch {}

      if (draggedItem.type === 'task') {
        const taskIndex = newItems.findIndex(i => i.id === draggedItem.id);
        if (taskIndex === -1) {
          setDragState({ isDragging: false, draggedItem: null, translateY: 0, startY: 0, dropTarget: null });
          return;
        }
        
        const [movedTask] = newItems.splice(taskIndex, 1);

        if (dropTarget.type === 'subtask-area' && dropTarget.taskId) {
          // Convert task to subtask
          newItems = newItems.map(item => {
            if (item.id === dropTarget.taskId) {
              return {
                ...item,
                subtasks: [...(item.subtasks || []), { ...movedTask, sectionId: undefined }]
              };
            }
            return item;
          });
        } else if (dropTarget.type === 'task' && dropTarget.taskId) {
          // Move task before/after another task
          const targetIndex = newItems.findIndex(i => i.id === dropTarget.taskId);
          const insertIndex = dropTarget.position === 'after' ? targetIndex + 1 : targetIndex;
          const targetTask = newItems[targetIndex];
          movedTask.sectionId = targetTask?.sectionId;
          newItems.splice(insertIndex, 0, movedTask);
        } else if (dropTarget.type === 'section' && dropTarget.sectionId) {
          // Move task to section (at the end)
          movedTask.sectionId = dropTarget.sectionId;
          newItems.push(movedTask);
        }
      } else if (draggedItem.type === 'subtask' && draggedItem.parentId) {
        // Find and remove subtask from parent
        let movedSubtask: TodoItem | null = null;
        newItems = newItems.map(item => {
          if (item.id === draggedItem.parentId && item.subtasks) {
            const subtaskIndex = item.subtasks.findIndex(st => st.id === draggedItem.id);
            if (subtaskIndex !== -1) {
              movedSubtask = item.subtasks[subtaskIndex];
              return {
                ...item,
                subtasks: item.subtasks.filter(st => st.id !== draggedItem.id)
              };
            }
          }
          return item;
        });

        if (movedSubtask) {
          if (dropTarget.type === 'section' || (dropTarget.type === 'task' && dropTarget.taskId !== draggedItem.parentId)) {
            // Convert subtask to task
            const newTask: TodoItem = {
              ...movedSubtask,
              sectionId: dropTarget.sectionId || sections[0]?.id,
            };
            
            if (dropTarget.type === 'task' && dropTarget.taskId) {
              const targetIndex = newItems.findIndex(i => i.id === dropTarget.taskId);
              const insertIndex = dropTarget.position === 'after' ? targetIndex + 1 : targetIndex;
              const targetTask = newItems[targetIndex];
              newTask.sectionId = targetTask?.sectionId;
              newItems.splice(insertIndex, 0, newTask);
            } else {
              newItems.push(newTask);
            }
          } else if (dropTarget.type === 'subtask-area' && dropTarget.taskId && dropTarget.taskId !== draggedItem.parentId) {
            // Move subtask to another task
            newItems = newItems.map(item => {
              if (item.id === dropTarget.taskId) {
                return {
                  ...item,
                  subtasks: [...(item.subtasks || []), movedSubtask!]
                };
              }
              return item;
            });
          }
        }
      }

      onReorder(newItems);
    }

    setDragState({
      isDragging: false,
      draggedItem: null,
      translateY: 0,
      startY: 0,
      dropTarget: null,
    });
  }, [dragState, items, sections, onReorder, clearLongPressTimer]);

  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer();
    setDragState({
      isDragging: false,
      draggedItem: null,
      translateY: 0,
      startY: 0,
      dropTarget: null,
    });
  }, [clearLongPressTimer]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventContextMenu = (e: Event) => {
      if (dragState.isDragging) {
        e.preventDefault();
      }
    };

    container.addEventListener('contextmenu', preventContextMenu);
    return () => {
      container.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [dragState.isDragging]);

  const setItemRef = useCallback((id: string, ref: HTMLDivElement | null) => {
    if (ref) {
      itemRefs.current.set(id, ref);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  const setSectionRef = useCallback((id: string, ref: HTMLDivElement | null) => {
    if (ref) {
      sectionRefs.current.set(id, ref);
    } else {
      sectionRefs.current.delete(id);
    }
  }, []);

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div 
      ref={containerRef}
      className={cn("relative space-y-4", className)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={{ 
        touchAction: dragState.isDragging ? 'none' : 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {sortedSections.map(section => {
        const sectionTasks = items.filter(item => 
          !item.completed && (item.sectionId === section.id || (!item.sectionId && section.id === sections[0]?.id))
        );
        const isDropTargetSection = dragState.dropTarget?.type === 'section' && dragState.dropTarget.sectionId === section.id;

        return (
          <div 
            key={section.id}
            ref={(ref) => setSectionRef(section.id, ref)}
            className={cn(
              "rounded-xl overflow-hidden border border-border/30 transition-all",
              isDropTargetSection && "ring-2 ring-primary"
            )}
          >
            {renderSectionHeader(section)}
            
            {!section.isCollapsed && (
              <div 
                className="bg-background" 
                style={{ borderLeft: `4px solid ${section.color}` }}
              >
                {sectionTasks.length > 0 ? (
                  <div className="divide-y divide-border/30">
                    {sectionTasks.map((item) => {
                      const isDragging = dragState.draggedItem?.id === item.id && dragState.draggedItem?.type === 'task';
                      const isSubtaskDropTarget = dragState.dropTarget?.type === 'subtask-area' && dragState.dropTarget.taskId === item.id;
                      const isTaskDropTarget = dragState.dropTarget?.type === 'task' && dragState.dropTarget.taskId === item.id;
                      const hasSubtasks = item.subtasks && item.subtasks.length > 0;
                      const isExpanded = expandedTasks.has(item.id);

                      return (
                        <div key={item.id}>
                          <div
                            ref={(ref) => setItemRef(item.id, ref)}
                            className={cn(
                              "relative transition-transform",
                              isDragging && "z-50 opacity-90 scale-[1.02] shadow-lg",
                              isSubtaskDropTarget && "ring-2 ring-primary ring-inset bg-primary/5",
                              isTaskDropTarget && dragState.dropTarget?.position === 'before' && "before:absolute before:inset-x-0 before:-top-0.5 before:h-1 before:bg-primary before:rounded-full",
                              isTaskDropTarget && dragState.dropTarget?.position === 'after' && "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-1 after:bg-primary after:rounded-full"
                            )}
                            style={{
                              transform: isDragging ? `translateY(${dragState.translateY}px)` : undefined,
                              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                            }}
                            onTouchStart={(e) => handleTouchStart({ id: item.id, type: 'task', sectionId: item.sectionId }, e)}
                          >
                            {renderTask(item, isDragging, isSubtaskDropTarget, undefined)}
                          </div>

                          {/* Subtasks */}
                          {hasSubtasks && isExpanded && (
                            <div className="ml-8 border-l-2 border-muted/50 bg-muted/10">
                              {item.subtasks!.map((subtask) => {
                                const isSubtaskDragging = dragState.draggedItem?.id === subtask.id && dragState.draggedItem?.type === 'subtask';
                                
                                return (
                                  <div
                                    key={subtask.id}
                                    ref={(ref) => setItemRef(subtask.id, ref)}
                                    className={cn(
                                      "relative transition-transform",
                                      isSubtaskDragging && "z-50 opacity-90 scale-[1.02] shadow-lg bg-card"
                                    )}
                                    style={{
                                      transform: isSubtaskDragging ? `translateY(${dragState.translateY}px)` : undefined,
                                      transition: isSubtaskDragging ? 'none' : 'transform 0.2s ease-out',
                                    }}
                                    onTouchStart={(e) => handleTouchStart({ id: subtask.id, type: 'subtask', parentId: item.id }, e)}
                                    onClick={() => onTaskClick(subtask, item.id)}
                                  >
                                    {renderSubtask(subtask, item.id, isSubtaskDragging, false)}
                                  </div>
                                );
                              })}
                              <p className="text-xs text-muted-foreground px-3 py-1.5 bg-muted/20">
                                {item.subtasks!.filter(st => st.completed).length}/{item.subtasks!.length} completed
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  renderEmptySection(section)
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
