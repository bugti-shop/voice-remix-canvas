import { useRef } from "react";
import { ArrowLeft, Download, FileText, Layers, Database, Bell, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Documentation = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Hidden in print */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b print:hidden">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Technical Documentation</h1>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </header>

      {/* Content */}
      <div ref={contentRef} className="max-w-4xl mx-auto p-6 space-y-8 print:p-0">
        {/* Title Page */}
        <div className="text-center py-12 print:py-8">
          <h1 className="text-4xl font-bold text-primary mb-4">Npd App</h1>
          <p className="text-xl text-muted-foreground mb-2">Technical Documentation</p>
          <p className="text-sm text-muted-foreground">Version 1.0.0</p>
          <p className="text-sm text-muted-foreground mt-4">
            Offline-First Productivity Application
          </p>
        </div>

        <Separator />

        {/* Table of Contents */}
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Table of Contents
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Application Overview</li>
            <li>Architecture Pattern (MVVM)</li>
            <li>Data Flow Diagram</li>
            <li>Component Architecture</li>
            <li>Database Schema</li>
            <li>Feature Documentation</li>
            <li>SDK & Dependencies</li>
            <li>Activity Flow</li>
            <li>Kotlin Concepts (Android)</li>
          </ol>
        </section>

        <Separator className="print:my-8" />

        {/* 1. Application Overview */}
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Application Overview</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                <div>
                  <h3 className="font-semibold text-primary">Objective</h3>
                  <p className="text-muted-foreground">
                    To provide an offline-first, all-in-one productivity solution that combines 
                    note-taking, task management, and personal organization tools without requiring 
                    internet connectivity or user accounts.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary">Problem Solved</h3>
                  <p className="text-muted-foreground">
                    Users need a unified space for capturing ideas, managing tasks, and staying 
                    organized without the complexity of multiple apps, subscriptions, or constant 
                    internet dependency.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary">Key Features</h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Rich text notes with voice recording and sketching</li>
                    <li>Task management with priorities and due dates</li>
                    <li>Local notifications and reminders</li>
                    <li>Calendar integration for planning</li>
                    <li>100% offline functionality</li>
                    <li>Dark/Light theme support</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="print:my-8" />

        {/* 2. MVVM Architecture */}
        <section className="print:break-before-page">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Layers className="h-6 w-6" />
            2. Architecture Pattern (MVVM)
          </h2>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Model-View-ViewModel Pattern</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap">{`
┌─────────────────────────────────────────────────────────────┐
│                         VIEW LAYER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  NotesPage  │  │  TodoPage   │  │ SettingsPage│          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │ User Actions                      │
│                          ▼                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Events / State Updates
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      VIEWMODEL LAYER                         │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  NotesViewModel │  │  TasksViewModel │                   │
│  │  ─────────────  │  │  ─────────────  │                   │
│  │  - notes state  │  │  - tasks state  │                   │
│  │  - folders      │  │  - filters      │                   │
│  │  - search query │  │  - sort order   │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           └──────────┬─────────┘                             │
│                      │ Repository Calls                      │
│                      ▼                                       │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     REPOSITORY LAYER                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Data Repository (Single Source)         │    │
│  │  ─────────────────────────────────────────────────  │    │
│  │  - CRUD operations                                   │    │
│  │  - Data validation                                   │    │
│  │  - Cache management                                  │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       MODEL LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ LocalStorage │  │   IndexedDB  │  │  Device APIs │       │
│  │  (Settings)  │  │ (Notes/Tasks)│  │ (Haptics/etc)│       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                `}</pre>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">View Layer</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                React components that render UI and handle user interactions. 
                Subscribes to ViewModel state changes.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">ViewModel Layer</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Manages UI state, processes user actions, and communicates 
                with repositories. Uses React hooks for state management.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Model Layer</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Data sources including LocalStorage, IndexedDB, and native 
                device APIs via Capacitor.
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="print:my-8" />

        {/* 3. Data Flow */}
        <section className="print:break-before-page">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Database className="h-6 w-6" />
            3. Data Flow Diagram
          </h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Unidirectional Data Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap">{`
    ┌──────────────────────────────────────────────────────────┐
    │                    USER INTERACTION                       │
    │         (Click, Type, Swipe, Voice Command)               │
    └─────────────────────────┬────────────────────────────────┘
                              │
                              ▼
    ┌──────────────────────────────────────────────────────────┐
    │                    ACTION DISPATCH                        │
    │    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
    │    │ CREATE_NOTE │  │ UPDATE_TASK │  │ DELETE_ITEM │     │
    │    └─────────────┘  └─────────────┘  └─────────────┘     │
    └─────────────────────────┬────────────────────────────────┘
                              │
                              ▼
    ┌──────────────────────────────────────────────────────────┐
    │                   STATE MANAGEMENT                        │
    │              (React useState / useReducer)                │
    │                                                           │
    │    ┌────────────────────────────────────────────────┐    │
    │    │  State = {                                      │    │
    │    │    notes: [...],                                │    │
    │    │    tasks: [...],                                │    │
    │    │    folders: [...],                              │    │
    │    │    settings: {...}                              │    │
    │    │  }                                              │    │
    │    └────────────────────────────────────────────────┘    │
    └─────────────────────────┬────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
    ┌─────────────────────┐       ┌─────────────────────┐
    │   PERSIST TO DISK   │       │    RE-RENDER UI     │
    │   ───────────────   │       │    ────────────     │
    │   localStorage      │       │   Components with   │
    │   IndexedDB         │       │   updated props     │
    └─────────────────────┘       └─────────────────────┘
                `}</pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Note Creation Flow Example</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap">{`
    User clicks "New Note"
           │
           ▼
    ┌─────────────────┐
    │ NoteEditor      │  ← Opens with empty state
    │ Component       │
    └────────┬────────┘
             │ User types content
             ▼
    ┌─────────────────┐
    │ onChange Event  │  ← Captures input
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ setNote(data)   │  ← Updates local state
    └────────┬────────┘
             │ User clicks "Save"
             ▼
    ┌─────────────────┐
    │ saveNote()      │  ← Validates data
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ localStorage    │  ← Persists to disk
    │ .setItem()      │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Navigate back   │  ← Returns to notes list
    │ to Notes List   │
    └─────────────────┘
                `}</pre>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="print:my-8" />

        {/* 4. Component Architecture */}
        <section className="print:break-before-page">
          <h2 className="text-2xl font-bold mb-4">4. Component Architecture</h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Component Tree</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap">{`
App
├── QueryClientProvider (React Query)
│   └── TooltipProvider
│       └── AppContent
│           ├── Toaster (Notifications)
│           ├── Sonner (Toast messages)
│           └── BrowserRouter
│               └── Routes
│                   │
│                   ├── "/" → Index (Home/Notes)
│                   │   ├── BottomNavigation
│                   │   ├── NoteCard[]
│                   │   ├── NoteEditor
│                   │   │   ├── RichTextEditor
│                   │   │   ├── VoiceRecorder
│                   │   │   └── SketchEditor
│                   │   └── FolderManager
│                   │
│                   ├── "/todo/today" → Today
│                   │   ├── TodoLayout
│                   │   │   └── TodoBottomNavigation
│                   │   ├── TaskItem[]
│                   │   ├── TaskInputSheet
│                   │   └── TaskDetailSheet
│                   │
│                   ├── "/todo/upcoming" → Upcoming
│                   │   └── (similar to Today)
│                   │
│                   ├── "/calendar" → NotesCalendar
│                   │   ├── Calendar
│                   │   └── DailyPlanner
│                   │
│                   ├── "/settings" → Settings
│                   │   ├── ThemeToggle
│                   │   └── PreferenceForms
│                   │
│                   └── "/reminders" → Reminders
│                       └── ReminderList
                `}</pre>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="print:my-8" />

        {/* 5. Database Schema */}
        <section className="print:break-before-page">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Database className="h-6 w-6" />
            5. Database Schema (Local Storage)
          </h2>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Notes Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <pre>{`interface Note {
  id: string;              // Unique identifier
  title: string;           // Note title
  content: string;         // HTML content
  plainText: string;       // Plain text for search
  folderId: string | null; // Parent folder
  isPinned: boolean;       // Pin status
  isArchived: boolean;     // Archive status
  color: string;           // Background color
  audioUrl?: string;       // Voice recording
  sketchData?: string;     // Drawing data
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
  reminder?: string;       // Reminder datetime
  tags: string[];          // Tag labels
}`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <pre>{`interface Task {
  id: string;              // Unique identifier
  title: string;           // Task title
  description?: string;    // Optional details
  completed: boolean;      // Completion status
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;        // Due date
  dueTime?: string;        // Due time
  reminder?: string;       // Reminder datetime
  subtasks: Subtask[];     // Child tasks
  tags: string[];          // Tag labels
  category?: string;       // Category name
  recurrence?: string;     // Repeat pattern
  createdAt: string;       // ISO timestamp
  completedAt?: string;    // Completion timestamp
}`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Folder Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <pre>{`interface Folder {
  id: string;              // Unique identifier
  name: string;            // Folder name
  color: string;           // Folder color
  icon?: string;           // Optional icon
  parentId?: string;       // Nested folder support
  createdAt: string;       // ISO timestamp
}`}</pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="print:my-8" />

        {/* 6. Feature Documentation */}
        <section className="print:break-before-page">
          <h2 className="text-2xl font-bold mb-4">6. Feature Documentation</h2>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📝 Notes Module</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Rich Text Editor</h4>
                  <p className="text-sm text-muted-foreground">
                    Full-featured text editor with formatting options including bold, italic, 
                    underline, lists, headings, and code blocks. Uses contenteditable with 
                    custom commands.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Voice Recording</h4>
                  <p className="text-sm text-muted-foreground">
                    Captures audio using MediaRecorder API. Displays waveform visualization 
                    during recording. Saves as base64-encoded audio data.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Sketch/Drawing</h4>
                  <p className="text-sm text-muted-foreground">
                    Canvas-based drawing tool with multiple brush sizes and colors. 
                    Supports undo/redo operations. Exports as PNG data URL.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Folder Organization</h4>
                  <p className="text-sm text-muted-foreground">
                    Hierarchical folder structure for organizing notes. Supports drag-and-drop 
                    movement between folders. Color-coded folders.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>✅ Tasks Module</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Task Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Create, edit, and complete tasks with priorities (Low, Medium, High, Urgent). 
                    Supports due dates, times, and subtasks.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Today View</h4>
                  <p className="text-sm text-muted-foreground">
                    Focused view showing only tasks due today. Quick-add functionality 
                    with natural language parsing for dates.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Upcoming View</h4>
                  <p className="text-sm text-muted-foreground">
                    Shows future tasks organized by date. Helps with planning and 
                    time management.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Drag & Drop Reordering</h4>
                  <p className="text-sm text-muted-foreground">
                    Uses @hello-pangea/dnd for smooth drag-and-drop task reordering. 
                    Persists order to local storage.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔔 Notifications Module</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Local Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Uses Capacitor Local Notifications plugin for scheduling reminders. 
                    Supports exact alarm scheduling on Android.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Reminder System</h4>
                  <p className="text-sm text-muted-foreground">
                    Set reminders for notes and tasks. Options for specific time or 
                    relative timing (e.g., "1 hour before").
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📅 Calendar Module</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Calendar View</h4>
                  <p className="text-sm text-muted-foreground">
                    Monthly calendar displaying notes and tasks by date. Uses react-day-picker 
                    for the calendar component.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Daily Planner</h4>
                  <p className="text-sm text-muted-foreground">
                    Time-block view for detailed daily planning. Shows scheduled tasks 
                    and notes in timeline format.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>⚙️ Settings Module</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Theme Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Dark and light mode support. Uses CSS variables and Tailwind for 
                    consistent theming across components.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Preferences</h4>
                  <p className="text-sm text-muted-foreground">
                    User preferences stored in localStorage including default views, 
                    notification settings, and UI preferences.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="print:my-8" />

        {/* 7. SDK & Dependencies */}
        <section className="print:break-before-page">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            7. SDK & Dependencies
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-3 text-left">SDK/Library</th>
                  <th className="border border-border p-3 text-left">Version</th>
                  <th className="border border-border p-3 text-left">Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-3 font-mono">@capacitor/core</td>
                  <td className="border border-border p-3">^7.4.4</td>
                  <td className="border border-border p-3">Native mobile runtime bridge</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-mono">@capacitor/android</td>
                  <td className="border border-border p-3">^7.4.4</td>
                  <td className="border border-border p-3">Android platform support</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-mono">@capacitor/ios</td>
                  <td className="border border-border p-3">^7.4.4</td>
                  <td className="border border-border p-3">iOS platform support</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-mono">@capacitor/local-notifications</td>
                  <td className="border border-border p-3">^7.0.3</td>
                  <td className="border border-border p-3">Schedule local reminders</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-mono">@capacitor/haptics</td>
                  <td className="border border-border p-3">^7.0.2</td>
                  <td className="border border-border p-3">Tactile feedback on interactions</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-mono">react</td>
                  <td className="border border-border p-3">^18.3.1</td>
                  <td className="border border-border p-3">UI component framework</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-mono">react-router-dom</td>
                  <td className="border border-border p-3">^6.30.1</td>
                  <td className="border border-border p-3">Client-side routing</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-mono">@tanstack/react-query</td>
                  <td className="border border-border p-3">^5.83.0</td>
                  <td className="border border-border p-3">Data fetching and caching</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-mono">date-fns</td>
                  <td className="border border-border p-3">^3.6.0</td>
                  <td className="border border-border p-3">Date manipulation utilities</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-mono">@hello-pangea/dnd</td>
                  <td className="border border-border p-3">^18.0.1</td>
                  <td className="border border-border p-3">Drag and drop functionality</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-mono">recharts</td>
                  <td className="border border-border p-3">^2.15.4</td>
                  <td className="border border-border p-3">Analytics charts and graphs</td>
                </tr>
                <tr>
                  <td className="border border-border p-3 font-mono">lucide-react</td>
                  <td className="border border-border p-3">^0.462.0</td>
                  <td className="border border-border p-3">Icon library</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <Separator className="print:my-8" />

        {/* 8. Activity Flow */}
        <section className="print:break-before-page">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Bell className="h-6 w-6" />
            8. Activity Flow (Kotlin Equivalent)
          </h2>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Navigation Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
                <pre className="whitespace-pre-wrap">{`
MainActivity (Home)
    │
    ├──► NotesFragment
    │       │
    │       ├──► NoteEditorActivity
    │       │       ├── RichTextFragment
    │       │       ├── VoiceRecorderFragment
    │       │       └── SketchFragment
    │       │
    │       └──► FolderManagerActivity
    │
    ├──► TodoFragment
    │       │
    │       ├──► TodayFragment
    │       │       └── TaskDetailActivity
    │       │
    │       ├──► UpcomingFragment
    │       │       └── TaskDetailActivity
    │       │
    │       └──► CalendarFragment
    │
    ├──► RemindersFragment
    │
    └──► SettingsActivity
            ├── AppearanceFragment
            ├── NotificationsFragment
            └── AboutFragment
                `}</pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lifecycle Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                <pre>{`// App Launch Sequence
onCreate()    → Initialize app, load preferences
onStart()     → Prepare UI components
onResume()    → Load data from storage, schedule notifications

// Background Handling
onPause()     → Save current state
onStop()      → Persist unsaved changes
onDestroy()   → Clean up resources

// Data Persistence
onSaveInstanceState()    → Save transient UI state
onRestoreInstanceState() → Restore UI state`}</pre>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="print:my-8" />

        {/* 9. Kotlin Concepts */}
        <section className="print:break-before-page">
          <h2 className="text-2xl font-bold mb-4">9. Kotlin Concepts Used</h2>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Classes & Null Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <pre>{`// Data class with null safety
data class Note(
    val id: String,
    val title: String,
    val content: String,
    val folderId: String? = null,  // Nullable
    val reminder: LocalDateTime? = null
)

// Safe call operator
note.reminder?.let { scheduleNotification(it) }

// Elvis operator for defaults
val folderName = folder?.name ?: "Uncategorized"`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coroutines & Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <pre>{`// Coroutine for async database operations
class NotesViewModel : ViewModel() {
    private val _notes = MutableStateFlow<List<Note>>(emptyList())
    val notes: StateFlow<List<Note>> = _notes.asStateFlow()
    
    fun loadNotes() {
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                val result = repository.getAllNotes()
                _notes.value = result
            }
        }
    }
}

// Collecting Flow in Fragment
lifecycleScope.launch {
    viewModel.notes.collect { notes ->
        adapter.submitList(notes)
    }
}`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Higher-Order Functions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <pre>{`// Filtering and mapping
val highPriorityTasks = tasks
    .filter { it.priority == Priority.HIGH }
    .sortedByDescending { it.dueDate }
    .map { it.toDisplayModel() }

// Grouping by date
val tasksByDate = tasks.groupBy { 
    it.dueDate?.toLocalDate() 
}

// Finding items
val overdueTask = tasks.find { 
    it.dueDate?.isBefore(LocalDateTime.now()) == true 
}`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sealed Classes & Extension Functions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <pre>{`// Sealed class for UI states
sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}

// Extension function for date formatting
fun LocalDateTime.toDisplayString(): String {
    return if (this.toLocalDate() == LocalDate.now()) {
        "Today at \${this.format(timeFormatter)}"
    } else {
        this.format(dateTimeFormatter)
    }
}

// Usage
when (val state = viewModel.state.value) {
    is UiState.Loading -> showProgress()
    is UiState.Success -> showData(state.data)
    is UiState.Error -> showError(state.message)
}`}</pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-sm text-muted-foreground print:mt-12">
          <Separator className="mb-6" />
          <p>Npd App - Technical Documentation</p>
          <p>Generated on {new Date().toLocaleDateString()}</p>
          <p className="mt-2">© 2024 All Rights Reserved</p>
        </footer>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-before-page {
            break-before: page;
          }
          .print\\:my-8 {
            margin-top: 2rem;
            margin-bottom: 2rem;
          }
          .print\\:p-0 {
            padding: 0;
          }
          .print\\:py-8 {
            padding-top: 2rem;
            padding-bottom: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Documentation;
