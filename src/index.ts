import { Priority, Task, TodoTxtExtension, TaskExtensions, ParseOptions, SaveOptions } from './types';
import { ExtensionHandler } from './extension-handler';
import { TaskBuilder } from './task';
import { TodoTxtParser } from './parser';
import { TodoTxtSerializer } from './serializer';

export { Priority, Task, TodoTxtExtension, TaskExtensions, ParseOptions, SaveOptions };
export { ExtensionHandler };
export { TaskBuilder };
export { TodoTxtParser };
export { TodoTxtSerializer };

export class TodoTxt {
  private parser: TodoTxtParser;
  private serializer: TodoTxtSerializer;

  constructor(options?: ParseOptions) {
    this.parser = new TodoTxtParser(options);
    this.serializer = new TodoTxtSerializer(this.parser.getExtensionHandler());
  }

  parse(content: string): Task[] {
    return this.parser.parseFile(content);
  }

  parseLine(line: string): Task {
    return this.parser.parseLine(line);
  }

  serialize(tasks: Task[], options?: SaveOptions): string {
    return this.serializer.serializeTasks(tasks, options);
  }

  addExtension(extension: TodoTxtExtension): void {
    this.parser.addExtension(extension);
  }

  removeExtension(key: string): boolean {
    return this.parser.removeExtension(key);
  }

  getExtensionHandler(): ExtensionHandler {
    return this.parser.getExtensionHandler();
  }
}