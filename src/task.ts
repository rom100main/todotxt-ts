import { Task, Priority, TaskExtensions } from './types';
import { ExtensionHandler } from './extension-handler';

export class TaskBuilder {
  static createTask(
    raw: string,
    extensionHandler: ExtensionHandler,
    parentExtensions?: TaskExtensions,
    parent?: Task
  ): Task {
    const trimmed = raw.trim();
    const indentLevel = this.getIndentLevel(raw);
    
    const task: Task = {
      raw,
      completed: false,
      description: '',
      projects: [],
      contexts: [],
      extensions: {},
      subtasks: [],
      indentLevel,
      parent
    };

    if (trimmed.startsWith('x ')) {
      task.completed = true;
      this.parseCompletedTask(trimmed, task);
    } else {
      this.parseIncompleteTask(trimmed, task);
    }

    this.extractProjectsAndContexts(task);
    
    let inheritedExtensions = parentExtensions || {};
    if (parent) {
      inheritedExtensions = this.inheritParentValues(parent, inheritedExtensions, extensionHandler);
    }
    
    task.extensions = extensionHandler.parseExtensions(task.description, inheritedExtensions);
    
    if (parent) {
      this.inheritParentProperties(task, parent);
    }

    return task;
  }

  private static inheritParentValues(
    parent: Task,
    parentExtensions: TaskExtensions,
    extensionHandler: ExtensionHandler
  ): TaskExtensions {
    const inherited: TaskExtensions = {};
    
    for (const [key, value] of Object.entries(parent.extensions)) {
      const extension = extensionHandler.getExtension(key);
      if (!extension || !extension.inheritShadow) {
        inherited[key] = value;
      }
    }
    
    return { ...inherited, ...parentExtensions };
  }

  private static inheritParentProperties(task: Task, parent: Task): void {
    if (task.projects.length === 0) {
      task.projects = [...parent.projects];
    }
    
    if (task.contexts.length === 0) {
      task.contexts = [...parent.contexts];
    }
    
    // Subtasks don't inherit priority by default
    // This can be customized if needed
  }

  private static getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }

  private static parseCompletedTask(line: string, task: Task): void {
    const parts = line.split(' ');
    
    if (parts.length >= 2) {
      const completionDateStr = parts[1];
      task.completionDate = this.parseDate(completionDateStr);
      
      let remainingParts = parts.slice(2);
      
      if (remainingParts.length > 0 && this.isPriority(remainingParts[0])) {
        task.priority = remainingParts[0].slice(1, -1) as Priority;
        remainingParts = remainingParts.slice(1);
      }
      
      if (remainingParts.length > 0 && this.isDate(remainingParts[0])) {
        task.creationDate = this.parseDate(remainingParts[0]);
        remainingParts = remainingParts.slice(1);
      }
      
      task.description = remainingParts.join(' ');
    }
  }

  private static parseIncompleteTask(line: string, task: Task): void {
    const parts = line.split(' ');
    let remainingParts = [...parts];
    
    if (remainingParts.length > 0 && this.isPriority(remainingParts[0])) {
      task.priority = remainingParts[0].slice(1, -1) as Priority;
      remainingParts = remainingParts.slice(1);
    }
    
    if (remainingParts.length > 0 && this.isDate(remainingParts[0])) {
      task.creationDate = this.parseDate(remainingParts[0]);
      remainingParts = remainingParts.slice(1);
    }
    
    task.description = remainingParts.join(' ');
  }

  private static extractProjectsAndContexts(task: Task): void {
    const projectRegex = /\+(\w+)/g;
    const contextRegex = /@(\w+)/g;
    
    let match;
    while ((match = projectRegex.exec(task.description)) !== null) {
      task.projects.push(match[1]);
    }
    
    while ((match = contextRegex.exec(task.description)) !== null) {
      task.contexts.push(match[1]);
    }
  }

  private static isPriority(token: string): boolean {
    return /^\([A-Z]\)$/.test(token);
  }

  private static isDate(token: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(token);
  }

  private static parseDate(dateStr: string): Date | undefined {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return undefined;
  }
}