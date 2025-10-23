export type Priority = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

export interface TodoTxtExtension {
  key: string;
  parsingFunction?: (value: string) => any;
  serializingFunction?: (value: any) => string;
  inheritShadow: boolean;
}

export interface TaskExtensions {
  [key: string]: any;
}

export interface Task {
  raw: string;
  completed: boolean;
  priority?: Priority;
  creationDate?: Date;
  completionDate?: Date;
  description: string;
  projects: string[];
  contexts: string[];
  extensions: TaskExtensions;
  subtasks: Task[];
  indentLevel: number;
  parent?: Task;
}

export interface ParseOptions {
  extensions?: TodoTxtExtension[];
  handleSubtasks?: boolean;
}

export interface SaveOptions {
  includeSubtasks?: boolean;
  preserveIndentation?: boolean;
}