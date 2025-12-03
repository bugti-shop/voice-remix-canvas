import { useState, useEffect } from 'react';
import { TodoItem, Folder, Priority } from '@/types/note';
import { Plus, FolderIcon, Edit2, X, CheckSquare, Trash2, FolderInput, Flag, Filter, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TaskItem } from '@/components/TaskItem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
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

const STORAGE_KEY = 'nota-todo-items';
const FOLDERS_KEY = 'nota-folders';

const Today = () => {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<TodoItem | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);
  const [completedOpen, setCompletedOpen] = useState(true);

  useEffect(() => {
    loadItems();
    loadFolders();
  }, []);

  const loadItems = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setItems(JSON.parse(saved));
    }
  };

  const loadFolders = () => {
    const saved = localStorage.getItem(FOLDERS_KEY);
    if (saved) {
      setFolders(JSON.parse(saved));
    }
  };

  const saveItems = (newItems: TodoItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    setItems(newItems);
  };

  const updateItem = (itemId: string, updates: Partial<TodoItem>) => {
    const updateItemInList = (items: TodoItem[]): TodoItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, ...updates };
        }
        if (item.subtasks && item.subtasks.length > 0) {
          return { ...item, subtasks: updateItemInList(item.subtasks) };
        }
        return item;
      });
    };
    saveItems(updateItemInList(items));
  };

  const deleteItem = (itemId: string) => {
    const deleteItemFromList = (items: TodoItem[]): TodoItem[] => {
      return items
        .filter(item => item.id !== itemId)
        .map(item => ({
          ...item,
          subtasks: item.subtasks ? deleteItemFromList(item.subtasks) : undefined
        }));
    };
    saveItems(deleteItemFromList(items));
  };

  const handleBulkDelete = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {}
    
    const newItems = items.filter(item => !selectedItems.has(item.id));
    saveItems(newItems);
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const filteredItems = items.filter(item => {
    if (selectedFolderId && item.folderId !== selectedFolderId) return false;
    if (selectedPriority !== 'all' && item.priority !== selectedPriority) return false;
    return true;
  });

  const pendingItems = filteredItems.filter(item => !item.completed);
  const completedItems = filteredItems.filter(item => item.completed);

  return (
    <TodoLayout title="Today">
      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FolderIcon className="h-4 w-4" />
                {selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : 'All Folders'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-1">
                <Button
                  variant={selectedFolderId === null ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedFolderId(null)}
                >
                  All Folders
                </Button>
                {folders.map(folder => (
                  <Button
                    key={folder.id}
                    variant={selectedFolderId === folder.id ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    {folder.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Flag className="h-4 w-4" />
                {selectedPriority === 'all' ? 'All Priorities' : selectedPriority}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-1">
                {['all', 'high', 'medium', 'low', 'none'].map(p => (
                  <Button
                    key={p}
                    variant={selectedPriority === p ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start capitalize"
                    onClick={() => setSelectedPriority(p as Priority | 'all')}
                  >
                    {p === 'all' ? 'All Priorities' : p}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {isSelectionMode && selectedItems.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="ml-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedItems.size})
            </Button>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="space-y-2 mb-6">
          {pendingItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Tasks</h2>
              <p className="text-muted-foreground">Add a task to get started</p>
            </div>
          ) : (
            pendingItems.map(item => (
              <TaskItem
                key={item.id}
                item={item}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onTaskClick={setSelectedTask}
                onImageClick={setImageViewerUrl}
                isSelected={selectedItems.has(item.id)}
                isSelectionMode={isSelectionMode}
                onSelect={(id) => {
                  const newSelected = new Set(selectedItems);
                  if (newSelected.has(id)) {
                    newSelected.delete(id);
                  } else {
                    newSelected.add(id);
                  }
                  setSelectedItems(newSelected);
                }}
              />
            ))
          )}
        </div>

        {/* Completed Tasks */}
        {completedItems.length > 0 && (
          <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 mb-2">
                {completedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Completed ({completedItems.length})
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              {completedItems.map(item => (
                <TaskItem
                  key={item.id}
                  item={item}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                  onTaskClick={setSelectedTask}
                  onImageClick={setImageViewerUrl}
                  isSelected={selectedItems.has(item.id)}
                  isSelectionMode={isSelectionMode}
                  onSelect={(id) => {
                    const newSelected = new Set(selectedItems);
                    if (newSelected.has(id)) {
                      newSelected.delete(id);
                    } else {
                      newSelected.add(id);
                    }
                    setSelectedItems(newSelected);
                  }}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* FAB */}
        <Button
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
          onClick={async () => {
            try {
              await Haptics.impact({ style: ImpactStyle.Medium });
            } catch {}
            // Add task logic
          }}
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Tasks</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedItems.size} task(s)? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </TodoLayout>
  );
};

export default Today;
