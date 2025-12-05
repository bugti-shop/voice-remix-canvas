export type NoteType = 'sticky' | 'lined' | 'regular' | 'sketch' | 'code' | 'mindmap';

export type Priority = 'high' | 'medium' | 'low' | 'none';
export type RepeatType = 'none' | 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'monthly' | 'custom';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: Priority;
  dueDate?: Date;
  reminderTime?: Date;
  repeatType?: RepeatType;
  repeatDays?: number[];
  tags?: string[];
  folderId?: string;
  imageUrl?: string;
  description?: string;
  subtasks?: TodoItem[];
  categoryId?: string;
  googleCalendarEventId?: string;
  notificationIds?: number[];
}

export interface TaskTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  taskText: string;
  priority?: Priority;
  categoryId?: string;
  subtasks?: string[];
}

export interface TodoSection {
  id: string;
  title: string;
  color: string;
  items: TodoItem[];
}

export interface CornellSection {
  id: string;
  title: string;
  content: string;
  color: string;
}

export type StickyColor = 'yellow' | 'blue' | 'green' | 'pink' | 'orange';

export interface VoiceRecording {
  id: string;
  audioUrl: string;
  duration: number;
  timestamp: Date;
}

export interface Note {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  color?: StickyColor;
  images?: string[];
  voiceRecordings: VoiceRecording[];
  folderId?: string;
  todoItems?: TodoItem[];
  todoSections?: TodoSection[];
  todoName?: string;
  todoDate?: string;
  todoNotes?: string;
  cornellSections?: CornellSection[];
  meetingTitle?: string;
  meetingDate?: string;
  meetingTime?: string;
  meetingLocation?: string;
  isPinned?: boolean;
  pinnedOrder?: number;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  letterSpacing?: string;
  isItalic?: boolean;
  reminderEnabled?: boolean;
  reminderTime?: Date;
  reminderRecurring?: 'none' | 'daily' | 'weekly' | 'monthly';
  reminderSound?: string;
  reminderVibration?: boolean;
  notificationId?: number;
  notificationIds?: number[];
  codeContent?: string;
  codeLanguage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  noteType?: NoteType;
  isDefault: boolean;
  createdAt: Date;
  color?: string;
}
