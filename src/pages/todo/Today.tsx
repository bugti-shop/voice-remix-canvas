import { useState, useEffect } from 'react';
import { TodoItem, Folder, Priority } from '@/types/note';
import { Input } from '@/components/ui/input';
import { Plus, FolderIcon, Edit2, X, CheckSquare, Trash2, FolderInput, Flag, Filter, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TaskInputSheet } from '@/components/TaskInputSheet';
import { TaskDetailSheet } from '@/components/TaskDetailSheet';
import { TaskItem } from '@/components/TaskItem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { notificationManager } from '@/utils/notifications';
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
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TodoLayout } from './TodoLayout';

const Today = () => {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TodoItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [folderClickCounts, setFolderClickCounts] = useState<Record<string, number>>({});
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);

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
      setFolders(parsed.map((f: Folder) => ({
        ...f,
        createdAt: new Date(f.createdAt)
      })));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('todoItems', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('todoFolders', JSON.stringify(folders));
  }, [folders]);

  const handleCreateFolder = (name: string, color: string) => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      color,
      isDefault: false,
      createdAt: new Date(),
    };
    setFolders([...folders, newFolder]);
  };

  const handleEditFolder = () => {
    if (!folderToEdit || !editFolderName.trim()) return;
    const updatedFolders = folders.map(f =>
      f.id === folderToEdit.id ? { ...f, name: editFolderName, color: editFolderColor } : f
    );
    setFolders(updatedFolders);
    setFolderToEdit(null);
  };

  const handleDeleteFolder = () => {
    if (!folderToDelete) return;
    const updatedItems = items.map(item =>
      item.folderId === folderToDelete.id ? { ...item, folderId: undefined } : item
    );
    setItems(updatedItems);
    setFolders(folders.filter(f => f.id !== folderToDelete.id));
    if (selectedFolderId === folderToDelete.id) setSelectedFolderId(null);
    setFolderToDelete(null);
  };

  const handleAddTask = async (task: Omit<TodoItem, 'id' | 'completed'>) => {
    const newItem: TodoItem = { id: Date.now().toString(), completed: false, ...task };
    if (newItem.reminderTime) {
      try { await notificationManager.scheduleTaskReminder(newItem); } catch (error) { console.error('Failed to schedule notification:', error); }
    }
    setItems([newItem, ...items]);
  };

  const updateItem = async (itemId: string, updates: Partial<TodoItem>) => {
    const updatedItems = items.map((i) => (i.id === itemId ? { ...i, ...updates } : i));
    setItems(updatedItems);
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

  const handleBulkDelete = async () => {
    setItems(items.filter(item => !selectedTaskIds.has(item.id)));
    setSelectedTaskIds(new Set());
    setIsSelectionMode(false);
  };

  const filteredItems = items.filter(item => {
    const folderMatch = selectedFolderId ? item.folderId === selectedFolderId : true;
    const priorityMatch = selectedPriority === 'all' ? true : item.priority === selectedPriority;
    return folderMatch && priorityMatch;
  });

  const uncompletedItems = filteredItems.filter(item => !item.completed);
  const completedItems = filteredItems.filter(item => item.completed);

  return (
    <TodoLayout title="Today">
      <main className="container mx-auto px-4 py-3 pb-32">
        <div className="max-w-2xl mx-auto">
          {/* Folders */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2"><FolderIcon className="h-5 w-5" />Folders</h2>
              <Button variant={isSelectionMode ? "default" : "outline"} size="sm" onClick={() => { setIsSelectionMode(!isSelectionMode); if (isSelectionMode) setSelectedTaskIds(new Set()); }}>
                {isSelectionMode ? 'Cancel' : 'Select'}
              </Button>
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
              <Button variant="outline" size="sm" onClick={handleBulkDelete}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
            </div>
          )}

          {/* Tasks */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-20"><p className="text-muted-foreground">No tasks yet. Tap "Add Task" to get started!</p></div>
          ) : (
            <div className="space-y-4">
              {uncompletedItems.length > 0 && (
                <div className="space-y-2">
                  {uncompletedItems.map((item) => (
                    <TaskItem key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} onTaskClick={setSelectedTask} onImageClick={setSelectedImage} isSelected={selectedTaskIds.has(item.id)} isSelectionMode={isSelectionMode} onSelect={handleSelectTask} />
                  ))}
                </div>
              )}
              {completedItems.length > 0 && (
                <Collapsible open={isCompletedOpen} onOpenChange={setIsCompletedOpen}>
                  <div className="bg-muted/50 rounded-xl p-3 border border-border/30">
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between px-2 py-2 hover:bg-muted/60 rounded-lg transition-colors">
                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">COMPLETED</span>
                        <div className="flex items-center gap-2 text-muted-foreground"><span className="text-sm font-medium">{completedItems.length}</span>{isCompletedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 mt-2">
                      {completedItems.map((item) => (
                        <TaskItem key={item.id} item={item} onUpdate={updateItem} onDelete={deleteItem} onTaskClick={setSelectedTask} onImageClick={setSelectedImage} isSelected={selectedTaskIds.has(item.id)} isSelectionMode={isSelectionMode} onSelect={handleSelectTask} />
                      ))}
                    </CollapsibleContent>
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

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Task Image</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center"><img src={selectedImage || ''} alt="Task attachment" className="max-w-full max-h-[70vh] object-contain rounded-lg" /></div>
        </DialogContent>
      </Dialog>
    </TodoLayout>
  );
};

export default Today;
