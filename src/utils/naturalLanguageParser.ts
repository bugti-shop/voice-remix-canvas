import { addDays, addWeeks, addMonths, setHours, setMinutes, startOfDay, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday, isMonday, isTuesday, isWednesday, isThursday, isFriday, isSaturday, isSunday } from 'date-fns';

export interface ParsedTask {
  text: string;
  dueDate?: Date;
  priority?: 'high' | 'medium' | 'low';
}

// Time patterns
const timePatterns = [
  // "at 5pm", "at 5:30pm", "at 17:00"
  /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
  // "5pm", "5:30pm", "5:30 pm"
  /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,
  // "17:00", "9:30"
  /\b(\d{1,2}):(\d{2})\b/,
  // "in the morning", "in the evening", etc.
  /\bin the (morning|afternoon|evening|night)\b/i,
];

// Date patterns
const datePatterns: { pattern: RegExp; getDate: (match: RegExpMatchArray) => Date }[] = [
  { pattern: /\btoday\b/i, getDate: () => startOfDay(new Date()) },
  { pattern: /\btomorrow\b/i, getDate: () => startOfDay(addDays(new Date(), 1)) },
  { pattern: /\bday after tomorrow\b/i, getDate: () => startOfDay(addDays(new Date(), 2)) },
  { pattern: /\byesterday\b/i, getDate: () => startOfDay(addDays(new Date(), -1)) },
  { pattern: /\bthis weekend\b/i, getDate: () => {
    const today = new Date();
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
    return startOfDay(addDays(today, daysUntilSaturday));
  }},
  { pattern: /\bnext week\b/i, getDate: () => startOfDay(addWeeks(new Date(), 1)) },
  { pattern: /\bnext month\b/i, getDate: () => startOfDay(addMonths(new Date(), 1)) },
  { pattern: /\bin (\d+) days?\b/i, getDate: (m) => startOfDay(addDays(new Date(), parseInt(m[1]))) },
  { pattern: /\bin (\d+) weeks?\b/i, getDate: (m) => startOfDay(addWeeks(new Date(), parseInt(m[1]))) },
  { pattern: /\bin (\d+) months?\b/i, getDate: (m) => startOfDay(addMonths(new Date(), parseInt(m[1]))) },
  // Days of the week
  { pattern: /\b(next\s+)?monday\b/i, getDate: (m) => {
    const today = new Date();
    if (m[1] || isMonday(today)) return nextMonday(addDays(today, 1));
    return nextMonday(today);
  }},
  { pattern: /\b(next\s+)?tuesday\b/i, getDate: (m) => {
    const today = new Date();
    if (m[1] || isTuesday(today)) return nextTuesday(addDays(today, 1));
    return nextTuesday(today);
  }},
  { pattern: /\b(next\s+)?wednesday\b/i, getDate: (m) => {
    const today = new Date();
    if (m[1] || isWednesday(today)) return nextWednesday(addDays(today, 1));
    return nextWednesday(today);
  }},
  { pattern: /\b(next\s+)?thursday\b/i, getDate: (m) => {
    const today = new Date();
    if (m[1] || isThursday(today)) return nextThursday(addDays(today, 1));
    return nextThursday(today);
  }},
  { pattern: /\b(next\s+)?friday\b/i, getDate: (m) => {
    const today = new Date();
    if (m[1] || isFriday(today)) return nextFriday(addDays(today, 1));
    return nextFriday(today);
  }},
  { pattern: /\b(next\s+)?saturday\b/i, getDate: (m) => {
    const today = new Date();
    if (m[1] || isSaturday(today)) return nextSaturday(addDays(today, 1));
    return nextSaturday(today);
  }},
  { pattern: /\b(next\s+)?sunday\b/i, getDate: (m) => {
    const today = new Date();
    if (m[1] || isSunday(today)) return nextSunday(addDays(today, 1));
    return nextSunday(today);
  }},
  // Specific date formats: "Dec 25", "December 25", "25th December", "12/25"
  { pattern: /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i, 
    getDate: (m) => {
      const monthMap: { [key: string]: number } = {
        jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
        may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
        sep: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
      };
      const month = monthMap[m[1].toLowerCase()];
      const day = parseInt(m[2]);
      const date = new Date();
      date.setMonth(month, day);
      date.setHours(0, 0, 0, 0);
      // If the date is in the past, move to next year
      if (date < new Date()) {
        date.setFullYear(date.getFullYear() + 1);
      }
      return date;
    }
  },
  { pattern: /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i,
    getDate: (m) => {
      const monthMap: { [key: string]: number } = {
        jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
        may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
        sep: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
      };
      const day = parseInt(m[1]);
      const month = monthMap[m[2].toLowerCase()];
      const date = new Date();
      date.setMonth(month, day);
      date.setHours(0, 0, 0, 0);
      if (date < new Date()) {
        date.setFullYear(date.getFullYear() + 1);
      }
      return date;
    }
  },
  // MM/DD format
  { pattern: /\b(\d{1,2})\/(\d{1,2})\b/, getDate: (m) => {
    const month = parseInt(m[1]) - 1;
    const day = parseInt(m[2]);
    const date = new Date();
    date.setMonth(month, day);
    date.setHours(0, 0, 0, 0);
    if (date < new Date()) {
      date.setFullYear(date.getFullYear() + 1);
    }
    return date;
  }},
];

// Priority patterns
const priorityPatterns: { pattern: RegExp; priority: 'high' | 'medium' | 'low' }[] = [
  { pattern: /\b(high priority|urgent|important|asap|!{2,})\b/i, priority: 'high' },
  { pattern: /\b(medium priority|normal)\b/i, priority: 'medium' },
  { pattern: /\b(low priority|later|whenever)\b/i, priority: 'low' },
  { pattern: /!{3,}/, priority: 'high' },
  { pattern: /!!/, priority: 'medium' },
  { pattern: /!$/, priority: 'low' },
];

function parseTime(text: string): { hours: number; minutes: number; matched: string } | null {
  // Check for "at X:XX am/pm" or "at Xam/pm"
  let match = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3]?.toLowerCase();
    
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    return { hours, minutes, matched: match[0] };
  }
  
  // Check for "Xpm" or "X:XXpm"
  match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3].toLowerCase();
    
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    return { hours, minutes, matched: match[0] };
  }
  
  // Check for 24-hour format "17:00"
  match = text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (match) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return { hours, minutes, matched: match[0] };
    }
  }
  
  // Check for "in the morning/afternoon/evening/night"
  match = text.match(/\bin the (morning|afternoon|evening|night)\b/i);
  if (match) {
    const timeOfDay = match[1].toLowerCase();
    let hours = 9; // default morning
    if (timeOfDay === 'afternoon') hours = 14;
    else if (timeOfDay === 'evening') hours = 18;
    else if (timeOfDay === 'night') hours = 21;
    
    return { hours, minutes: 0, matched: match[0] };
  }
  
  return null;
}

function parseDate(text: string): { date: Date; matched: string } | null {
  for (const { pattern, getDate } of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      return { date: getDate(match), matched: match[0] };
    }
  }
  return null;
}

function parsePriority(text: string): { priority: 'high' | 'medium' | 'low'; matched: string } | null {
  for (const { pattern, priority } of priorityPatterns) {
    const match = text.match(pattern);
    if (match) {
      return { priority, matched: match[0] };
    }
  }
  return null;
}

export function parseNaturalLanguageTask(input: string): ParsedTask {
  let text = input.trim();
  let dueDate: Date | undefined;
  let priority: 'high' | 'medium' | 'low' | undefined;
  
  // Parse date first
  const dateResult = parseDate(text);
  if (dateResult) {
    dueDate = dateResult.date;
    text = text.replace(dateResult.matched, '').trim();
  }
  
  // Parse time
  const timeResult = parseTime(input); // Use original input for time parsing
  if (timeResult) {
    if (dueDate) {
      dueDate = setHours(setMinutes(dueDate, timeResult.minutes), timeResult.hours);
    } else {
      // If no date specified but time is, assume today
      dueDate = setHours(setMinutes(startOfDay(new Date()), timeResult.minutes), timeResult.hours);
    }
    text = text.replace(timeResult.matched, '').trim();
  }
  
  // Parse priority
  const priorityResult = parsePriority(text);
  if (priorityResult) {
    priority = priorityResult.priority;
    text = text.replace(priorityResult.matched, '').trim();
  }
  
  // Clean up the text
  text = text
    .replace(/\s+/g, ' ')  // Multiple spaces to single
    .replace(/^\s*,\s*/, '') // Leading comma
    .replace(/\s*,\s*$/, '') // Trailing comma
    .replace(/\s+at\s*$/, '') // Trailing "at"
    .replace(/\s+on\s*$/, '') // Trailing "on"
    .replace(/\s+by\s*$/, '') // Trailing "by"
    .trim();
  
  return {
    text: text || input.trim(), // Fallback to original if empty
    dueDate,
    priority,
  };
}

// Helper to detect if input contains natural language patterns
export function hasNaturalLanguagePatterns(input: string): boolean {
  const allPatterns = [
    ...datePatterns.map(p => p.pattern),
    ...timePatterns,
    ...priorityPatterns.map(p => p.pattern),
  ];
  
  return allPatterns.some(pattern => pattern.test(input));
}
