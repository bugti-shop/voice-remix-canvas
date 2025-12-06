import { useState, useEffect, useMemo } from 'react';
import { TodoItem, Folder, Priority, Note } from '@/types/note';
import { Plus, FolderIcon, ChevronRight, ChevronDown, MoreVertical, Eye, EyeOff, Filter, Copy, MousePointer2, FolderPlus, Settings, LayoutList, LayoutGrid, Trash2, ListPlus, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TaskInputSheet } from '@/components/TaskInputSheet';
import { TaskDetailSheet } from '@/components/TaskDetailSheet';
import { TaskItem } from '@/components/TaskItem';
import { TaskFilterSheet, DateFilter, PriorityFilter, StatusFilter } from '@/components/TaskFilterSheet';
import { DuplicateOptionsSheet, DuplicateOption } from '@/components/DuplicateOptionsSheet';
import { FolderManageSheet } from '@/components/FolderManageSheet';
import { MoveToFolderSheet } from '@/components/MoveToFolderSheet';
import { SelectActionsSheet, SelectAction } from '@/components/SelectActionsSheet';
import { PrioritySelectSheet } from '@/components/PrioritySelectSheet';
import { BatchTaskSheet } from '@/components/BatchTaskSheet';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { notificationManager } from '@/utils/notifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from '@/components/ui/checkbox';
import { TodoLayout } from './TodoLayout';
import { toast } from 'sonner';
import { isToday, isTomorrow, isThisWeek, isBefore, startOfDay } from 'date-fns';

type ViewMode = 'card' | 'flat';

const Today = () => {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodoItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isDuplicateSheetOpen, setIsDuplicateSheetOpen] = useState(false);
  const [isFolderManageOpen, setIsFolderManageOpen] = useState(false);
  const [isMoveToFolderOpen, setIsMoveToFolderOpen] = useState(false);
  const [isSelectActionsOpen, setIsSelectActionsOpen] = useState(false);
  const [isPrioritySheetOpen, setIsPrioritySheetOpen] = useState(false);
  const [isBatchTaskOpen, setIsBatchTaskOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('flat');

  useEffect(() => {
    const saved = localStorage.getItem('todoItems');
    if (saved) {
      const parsed = JSON.parse(saved);
      const loadedItems = parsed.map((item: TodoItem) => ({
        ...item,
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        reminderTime: item.reminderTime ? new Date(item.reminderTime) : undefined,
      }));
      setItems(loadedItems);
      notificationManager.rescheduleAllTasks(loadedItems).catch(console.error);
    }

    const savedFolders = localStorage.getItem('todoFolders');
    if (savedFolders) {
      const parsed = JSON.parse(savedFolders);
      setFolders(parsed.map((f: Folder) => ({ ...f, createdAt: new Date(f.createdAt) })));
    }

    const savedShowCompleted = localStorage.getItem('todoShowCompleted');
    if (savedShowCompleted !== null) setShowCompleted(JSON.parse(savedShowCompleted));
    const savedDateFilter = localStorage.getItem('todoDateFilter');
    if (savedDateFilter) setDateFilter(savedDateFilter as DateFilter);
    const savedPriorityFilter = localStorage.getItem('todoPriorityFilter');
    if (savedPriorityFilter) setPriorityFilter(savedPriorityFilter as PriorityFilter);
    const savedStatusFilter = localStorage.getItem('todoStatusFilter');
    if (savedStatusFilter) setStatusFilter(savedStatusFilter as StatusFilter);
    const savedViewMode = localStorage.getItem('todoViewMode');
    if (savedViewMode) setViewMode(savedViewMode as ViewMode);
  }, []);

  useEffect(() => { localStorage.setItem('todoItems', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('todoFolders', JSON.stringify(folders)); }, [folders]);
  useEffect(() => { localStorage.setItem('todoShowCompleted', JSON.stringify(showCompleted)); }, [showCompleted]);
  useEffect(() => { 
    localStorage.setItem('todoDateFilter', dateFilter); 
    localStorage.setItem('todoPriorityFilter', priorityFilter);
    localStorage.setItem('todoStatusFilter', statusFilter);
  }, [dateFilter, priorityFilter, statusFilter]);
  useEffect(() => { localStorage.setItem('todoViewMode', viewMode); }, [viewMode]);

  const handleCreateFolder = (name: string, color: string) => {
    const newFolder: Folder = { id: Date.now().toString(), name, color, isDefault: false, createdAt: new Date() };
    setFolders([...folders, newFolder]);
  };

  const handleEditFolder = (folderId: string, name: string, color: string) => {
    setFolders(folders.map(f => f.id === folderId ? { ...f, name, color } : f));
  };

  const handleDeleteFolder = (folderId: string) => {
    setItems(items.map(item => item.folderId === folderId ? { ...item, folderId: undefined } : item));
    setFolders(folders.filter(f => f.id !== folderId));
    if (selectedFolderId === folderId) setSelectedFolderId(null);
  };

  const handleAddTask = async (task: Omit<TodoItem, 'id' | 'completed'>) => {
    const newItem: TodoItem = { id: Date.now().toString(), completed: false, ...task };
    if (newItem.reminderTime) {
      try { await notificationManager.scheduleTaskReminder(newItem); } catch (error) { console.error('Failed to schedule notification:', error); }
    }
    setItems([newItem, ...items]);
  };

  const handleBatchAddTasks = (taskTexts: string[]) => {
    const newItems: TodoItem[] = taskTexts.map((text, idx) => ({
      id: `${Date.now()}-${idx}`,
      text,
      completed: false,
      folderId: selectedFolderId || undefined,
    }));
    setItems([...newItems, ...items]);
    toast.success(`Added ${newItems.length} task(s)`);
  };

  const updateItem = async (itemId: string, updates: Partial<TodoItem>) => {
    setItems(items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)));
  };

  const deleteItem = async (itemId: string) => {
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
    setItems(items.filter((item) => item.id !== itemId));
  };

  const duplicateTask = async (task: TodoItem) => {
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
    const duplicatedTask: TodoItem = { ...task, id: Date.now().toString(), completed: false, text: `${task.text} (Copy)` };
    setItems([duplicatedTask, ...items]);
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) newSet.delete(taskId);
      else newSet.add(taskId);
      return newSet;
    });
  };

  const handleDuplicate = (option: DuplicateOption) => {
    const filteredItems = selectedFolderId ? items.filter(i => i.folderId === selectedFolderId) : items;
    let toDuplicate: TodoItem[] = [];

    if (option === 'uncompleted') {
      toDuplicate = filteredItems.filter(i => !i.completed);
    } else {
      toDuplicate = filteredItems;
    }

    const duplicated = toDuplicate.map((item, idx) => ({
      ...item,
      id: `${Date.now()}-${idx}`,
      completed: option === 'all-reset' ? false : item.completed,
      text: `${item.text} (Copy)`
    }));

    setItems([...duplicated, ...items]);
    toast.success(`Duplicated ${duplicated.length} task(s)`);
  };

  const handleSelectAction = (action: SelectAction) => {
    const selectedItems = items.filter(i => selectedTaskIds.has(i.id));
    
    switch (action) {
      case 'move':
        setIsMoveToFolderOpen(true);
        break;
      case 'delete':
        setItems(items.filter(i => !selectedTaskIds.has(i.id)));
        setSelectedTaskIds(new Set());
        setIsSelectionMode(false);
        toast.success(`Deleted ${selectedItems.length} task(s)`);
        break;
      case 'complete':
        setItems(items.map(i => selectedTaskIds.has(i.id) ? { ...i, completed: true } : i));
        setSelectedTaskIds(new Set());
        setIsSelectionMode(false);
        toast.success(`Completed ${selectedItems.length} task(s)`);
        break;
      case 'pin':
        toast.success(`Pinned ${selectedItems.length} task(s)`);
        setSelectedTaskIds(new Set());
        setIsSelectionMode(false);
        break;
      case 'priority':
        setIsPrioritySheetOpen(true);
        break;
      case 'duplicate':
        const duplicated = selectedItems.map((item, idx) => ({
          ...item,
          id: `${Date.now()}-${idx}`,
          completed: false,
          text: `${item.text} (Copy)`
        }));
        setItems([...duplicated, ...items]);
        setSelectedTaskIds(new Set());
        setIsSelectionMode(false);
        toast.success(`Duplicated ${selectedItems.length} task(s)`);
        break;
      case 'convert':
        convertToNotes(selectedItems);
        break;
    }
    setIsSelectActionsOpen(false);
  };

  const handleMoveToFolder = (folderId: string | null) => {
    setItems(items.map(i => selectedTaskIds.has(i.id) ? { ...i, folderId: folderId || undefined } : i));
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
    toast.success(`Moved ${selectedTaskIds.size} task(s)`);
  };

  const handleSetPriority = (priority: Priority) => {
    setItems(items.map(i => selectedTaskIds.has(i.id) ? { ...i, priority } : i));
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
    toast.success(`Updated priority for ${selectedTaskIds.size} task(s)`);
  };

  const convertToNotes = (tasksToConvert: TodoItem[]) => {
    const existingNotes: Note[] = JSON.parse(localStorage.getItem('notes') || '[]');
    
    const newNotes: Note[] = tasksToConvert.map((task, idx) => ({
      id: `${Date.now()}-${idx}`,
      type: 'regular' as const,
      title: task.text,
      content: task.description || '',
      voiceRecordings: [],
      images: task.imageUrl ? [task.imageUrl] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    localStorage.setItem('notes', JSON.stringify([...newNotes, ...existingNotes]));
    setItems(items.filter(i => !tasksToConvert.some(t => t.id === i.id)));
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
    toast.success(`Converted ${tasksToConvert.length} task(s) to notes`);
  };

  const processedItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Folder filter
      const folderMatch = selectedFolderId ? item.folderId === selectedFolderId : true;
      
      // Priority filter
      const priorityMatch = priorityFilter === 'all' ? true : item.priority === priorityFilter;
      
      // Status filter
      let statusMatch = true;
      if (statusFilter === 'completed') statusMatch = item.completed;
      else if (statusFilter === 'uncompleted') statusMatch = !item.completed;
      
      // Date filter
      let dateMatch = true;
      if (dateFilter !== 'all') {
        const today = startOfDay(new Date());
        const itemDate = item.dueDate ? new Date(item.dueDate) : null;
        
        switch (dateFilter) {
          case 'today':
            dateMatch = itemDate ? isToday(itemDate) : false;
            break;
          case 'tomorrow':
            dateMatch = itemDate ? isTomorrow(itemDate) : false;
            break;
          case 'this-week':
            dateMatch = itemDate ? isThisWeek(itemDate) : false;
            break;
          case 'overdue':
            dateMatch = itemDate ? isBefore(itemDate, today) && !item.completed : false;
            break;
          case 'has-date':
            dateMatch = !!itemDate;
            break;
          case 'no-date':
            dateMatch = !itemDate;
            break;
        }
      }
      
      return folderMatch && priorityMatch && statusMatch && dateMatch;
    });

    // Sort by date (tasks with dates first, then by date)
    filtered = [...filtered].sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dateA - dateB;
    });

    return filtered;
  }, [items, selectedFolderId, priorityFilter, statusFilter, dateFilter]);

  const uncompletedItems = processedItems.filter(item => !item.completed);
  const completedItems = processedItems.filter(item => item.completed);

  const handleClearFilters = () => {
    setSelectedFolderId(null);
    setDateFilter('all');
    setPriorityFilter('all');
    setStatusFilter('all');
  };

  const getPriorityBorderColor = (priority?: Priority) => {
    switch (priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-orange-500';
      case 'low': return 'border-green-500';
      default: return 'border-primary';
    }
  };

  const renderTaskItem = (item: TodoItem) => (
    viewMode === 'flat' ? (
      <div key={item.id} className="flex items-start gap-3 py-2 px-1 border-b border-border/50">
        {isSelectionMode && (
          <Checkbox checked={selectedTaskIds.has(item.id)} onCheckedChange={() => handleSelectTask(item.id)} className="h-5 w-5 mt-0.5" />
        )}
        <Checkbox
          checked={item.completed}
          onCheckedChange={async (checked) => {
            if (checked && !item.completed) {
              try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
            }
            updateItem(item.id, { completed: !!checked });
          }}
          className={cn(
            "h-5 w-5 rounded-sm border-2 mt-0.5",
            item.completed 
              ? "border-muted-foreground/50" 
              : getPriorityBorderColor(item.priority)
          )}
        />
        <div className="flex-1 min-w-0" onClick={() => setSelectedTask(item)}>
          <span className={cn("text-sm block", item.completed && "text-muted-foreground")}>
            {item.text}
          </span>
          {item.coloredTags && item.coloredTags.length > 0 && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {item.coloredTags.slice(0, 4).map((tag) => (
                <span 
                  key={tag.name}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded-full"
                  style={{ 
                    backgroundColor: `${tag.color}20`, 
                    color: tag.color 
                  }}
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag.name}
                </span>
              ))}
              {item.coloredTags.length > 4 && (
                <span className="text-[10px] text-muted-foreground">+{item.coloredTags.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    ) : (
      <TaskItem key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} onTaskClick={setSelectedTask} onImageClick={setSelectedImage} isSelected={selectedTaskIds.has(item.id)} isSelectionMode={isSelectionMode} onSelect={handleSelectTask} />
    )
  );

  return (
    <TodoLayout title="Today">
      <main className="container mx-auto px-4 py-3 pb-32">
        <div className="max-w-2xl mx-auto">
          {/* Folders */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2"><FolderIcon className="h-5 w-5" />Folders</h2>
              <div className="flex items-center gap-2">
                {isSelectionMode && (
                  <Button variant="default" size="sm" onClick={() => { setIsSelectionMode(false); setSelectedTaskIds(new Set()); }}>
                    Cancel
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg z-50">
                    <DropdownMenuItem onClick={() => setShowCompleted(!showCompleted)} className="cursor-pointer">
                      {showCompleted ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showCompleted ? 'Hide Completed' : 'Show Completed'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsFilterSheetOpen(true)} className="cursor-pointer">
                      <Filter className="h-4 w-4 mr-2" />Filter
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsDuplicateSheetOpen(true)} className="cursor-pointer">
                      <Copy className="h-4 w-4 mr-2" />Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsBatchTaskOpen(true)} className="cursor-pointer">
                      <ListPlus className="h-4 w-4 mr-2" />Add Multiple Tasks
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setIsSelectionMode(true); setIsSelectActionsOpen(true); }} className="cursor-pointer">
                      <MousePointer2 className="h-4 w-4 mr-2" />Select
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsFolderManageOpen(true)} className="cursor-pointer">
                      <FolderPlus className="h-4 w-4 mr-2" />Create Folder
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsFolderManageOpen(true)} className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />Manage Folders
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setViewMode(viewMode === 'card' ? 'flat' : 'card')} className="cursor-pointer">
                      {viewMode === 'card' ? <LayoutList className="h-4 w-4 mr-2" /> : <LayoutGrid className="h-4 w-4 mr-2" />}
                      {viewMode === 'card' ? 'Flat Layout' : 'Card Layout'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button onClick={() => setSelectedFolderId(null)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all whitespace-nowrap", !selectedFolderId ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted border-border")}>
                <FolderIcon className="h-4 w-4" />All Tasks
              </button>
              {folders.map((folder) => (
                <button key={folder.id} onClick={() => setSelectedFolderId(folder.id)} className="flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all whitespace-nowrap" style={{ backgroundColor: selectedFolderId === folder.id ? folder.color : 'transparent', color: selectedFolderId === folder.id ? 'white' : 'inherit', borderColor: folder.color }}>
                  {folder.name}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {isSelectionMode && selectedTaskIds.size > 0 && (
            <div className="fixed bottom-20 left-4 right-4 z-40 bg-card border rounded-lg shadow-lg p-4">
              <p className="text-sm mb-3 font-medium">{selectedTaskIds.size} task(s) selected</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsSelectActionsOpen(true)}>Actions</Button>
                <Button variant="outline" size="sm" onClick={() => { setItems(items.filter(i => !selectedTaskIds.has(i.id))); setSelectedTaskIds(new Set()); setIsSelectionMode(false); }}>
                  <Trash2 className="h-4 w-4 mr-2" />Delete
                </Button>
              </div>
            </div>
          )}

          {/* Tasks */}
          {processedItems.length === 0 ? (
            <div className="text-center py-20"><p className="text-muted-foreground">No tasks yet. Tap "Add Task" to get started!</p></div>
          ) : (
            <div className="space-y-4">
              {uncompletedItems.length > 0 && (
                <div className="space-y-2">{uncompletedItems.map(renderTaskItem)}</div>
              )}

              {showCompleted && completedItems.length > 0 && (
                <Collapsible open={isCompletedOpen} onOpenChange={setIsCompletedOpen}>
                  <div className="bg-muted/50 rounded-xl p-3 border border-border/30">
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between px-2 py-2 hover:bg-muted/60 rounded-lg transition-colors">
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">COMPLETED</span>
                        <div className="flex items-center gap-2 text-muted-foreground"><span className="text-sm font-medium">{completedItems.length}</span>{isCompletedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">{completedItems.map(renderTaskItem)}</CollapsibleContent>
                  </div>
                </Collapsible>
              )}
            </div>
          )}
        </div>
      </main>

      <Button onClick={async () => { try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {} setIsInputOpen(true); }} className="fixed bottom-20 left-4 right-4 z-30 h-12 text-base font-semibold" size="lg">
        <Plus className="h-5 w-5" />Add Task
      </Button>

      <TaskInputSheet isOpen={isInputOpen} onClose={() => setIsInputOpen(false)} onAddTask={handleAddTask} folders={folders} selectedFolderId={selectedFolderId} onCreateFolder={handleCreateFolder} />
      <TaskDetailSheet isOpen={!!selectedTask} task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={(updatedTask) => { updateItem(updatedTask.id, updatedTask); setSelectedTask(updatedTask); }} onDelete={deleteItem} onDuplicate={duplicateTask} />
      <TaskFilterSheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} folders={folders} selectedFolderId={selectedFolderId} onFolderChange={setSelectedFolderId} dateFilter={dateFilter} onDateFilterChange={setDateFilter} priorityFilter={priorityFilter} onPriorityFilterChange={setPriorityFilter} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} onClearAll={handleClearFilters} />
      <DuplicateOptionsSheet isOpen={isDuplicateSheetOpen} onClose={() => setIsDuplicateSheetOpen(false)} onSelect={handleDuplicate} />
      <FolderManageSheet isOpen={isFolderManageOpen} onClose={() => setIsFolderManageOpen(false)} folders={folders} onCreateFolder={handleCreateFolder} onEditFolder={handleEditFolder} onDeleteFolder={handleDeleteFolder} />
      <MoveToFolderSheet isOpen={isMoveToFolderOpen} onClose={() => setIsMoveToFolderOpen(false)} folders={folders} onSelect={handleMoveToFolder} />
      <SelectActionsSheet isOpen={isSelectActionsOpen} onClose={() => setIsSelectActionsOpen(false)} selectedCount={selectedTaskIds.size} onAction={handleSelectAction} />
      <PrioritySelectSheet isOpen={isPrioritySheetOpen} onClose={() => setIsPrioritySheetOpen(false)} onSelect={handleSetPriority} />
      <BatchTaskSheet isOpen={isBatchTaskOpen} onClose={() => setIsBatchTaskOpen(false)} onAddTasks={handleBatchAddTasks} />

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Task Image</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center"><img src={selectedImage || ''} alt="Task attachment" className="max-w-full max-h-[70vh] object-contain rounded-lg" /></div>
        </DialogContent>
      </Dialog>
    </TodoLayout>
  );
};

export default Today;
