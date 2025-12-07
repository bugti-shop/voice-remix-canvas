import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListPlus, FolderIcon, LayoutList } from 'lucide-react';
import { TaskSection, Folder } from '@/types/note';

interface BatchTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTasks: (tasks: string[], sectionId?: string, folderId?: string) => void;
  sections?: TaskSection[];
  folders?: Folder[];
}

export const BatchTaskSheet = ({ isOpen, onClose, onAddTasks, sections = [], folders = [] }: BatchTaskSheetProps) => {
  const [text, setText] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');

  const handleAdd = () => {
    const tasks = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (tasks.length > 0) {
      onAddTasks(tasks, selectedSection || undefined, selectedFolder || undefined);
      setText('');
      setSelectedSection('');
      setSelectedFolder('');
      onClose();
    }
  };

  const taskCount = text.split('\n').filter(line => line.trim().length > 0).length;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ListPlus className="h-5 w-5" />
            Add Multiple Tasks
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter one task per line. Each line will become a separate task.
          </p>
          
          <Textarea
            placeholder="Buy groceries&#10;Call mom&#10;Finish report&#10;Schedule meeting"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[160px] resize-none"
            autoFocus
          />

          {/* Section and Folder Selection */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <LayoutList className="h-3.5 w-3.5" />
                Section
              </label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="No section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No section</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: section.color }}
                        />
                        {section.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <FolderIcon className="h-3.5 w-3.5" />
                Folder
              </label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="No folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No folder</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        {folder.color && (
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: folder.color }}
                          />
                        )}
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {taskCount} task{taskCount !== 1 ? 's' : ''} to add
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleAdd} disabled={taskCount === 0}>
                Add {taskCount > 0 ? taskCount : ''} Task{taskCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
