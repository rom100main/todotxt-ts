import { Task, SaveOptions } from './types';
import { ExtensionHandler } from './extension-handler';

export class TodoTxtSerializer {
  private extensionHandler: ExtensionHandler;

  constructor(extensionHandler: ExtensionHandler) {
    this.extensionHandler = extensionHandler;
  }

  serializeTasks(tasks: Task[], options: SaveOptions = {}): string {
    const lines: string[] = [];
    
    for (const task of tasks) {
      lines.push(...this.serializeTask(task, options));
    }
    
    return lines.join('\n');
  }

  serializeTask(task: Task, options: SaveOptions = {}): string[] {
    const lines: string[] = [];
    const includeSubtasks = options.includeSubtasks !== false;
    const preserveIndentation = options.preserveIndentation !== false;
    
    const line = this.serializeSingleTask(task, preserveIndentation ? task.indentLevel : 0);
    lines.push(line);
    
    if (includeSubtasks && task.subtasks.length > 0) {
      for (const subtask of task.subtasks) {
        lines.push(...this.serializeTask(subtask, options));
      }
    }
    
    return lines;
  }

  private serializeSingleTask(task: Task, indentLevel: number): string {
    const parts: string[] = [];
    
    const indent = ' '.repeat(indentLevel);
    parts.push(indent);
    
    if (task.completed) {
      parts.push('x');
      
      if (task.completionDate) {
        parts.push(this.formatDate(task.completionDate));
      }
      
      if (task.priority) {
        parts.push(`(${task.priority})`);
      }
      
      if (task.creationDate) {
        parts.push(this.formatDate(task.creationDate));
      }
    } else {
      if (task.priority) {
        parts.push(`(${task.priority})`);
      }
      
      if (task.creationDate) {
        parts.push(this.formatDate(task.creationDate));
      }
    }
    
    let description = task.description;
    
    // Remove existing extensions from description to avoid duplication
    const extensionRegex = /\s+\w+:[^\s]+/g;
    description = description.replace(extensionRegex, '');
    
    const extensionParts = this.extensionHandler.serializeExtensions(task.extensions);
    for (const extPart of extensionParts) {
      description += ` ${extPart}`;
    }
    
    parts.push(description.trim());
    
    return parts.join(' ').trim();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}