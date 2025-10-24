import { ExtensionHandler } from "./extension-handler";
import { TodoTxtParser } from "./parser";
import { TodoTxtSerializer } from "./serializer";
import { TaskBuilder } from "./task";
import { Priority, Task, TodoTxtExtension, TaskExtensions, TodoOptions, SaveOptions } from "./types";

export { Priority, Task, TodoTxtExtension, TaskExtensions };
export { ExtensionHandler };
export { TaskBuilder };
export { TodoTxtParser };
export { TodoTxtSerializer };

export class TodoTxt {
    private parser: TodoTxtParser;
    private serializer: TodoTxtSerializer;
    private extensionHandler: ExtensionHandler;

    constructor(options?: TodoOptions) {
        this.extensionHandler = new ExtensionHandler(options?.extensions);
        this.parser = new TodoTxtParser({
            extensionHandler: this.extensionHandler,
            handleSubtasks: options?.handleSubtasks,
        });
        this.serializer = new TodoTxtSerializer(this.extensionHandler);
    }

    parse(content: string): Task[] {
        return this.parser.parseFile(content);
    }

    parseLine(line: string): Task {
        return this.parser.parseLine(line);
    }

    serialize(tasks: Task[], options?: SaveOptions): string {
        return this.serializer.serializeTasks(tasks, options?.includeSubtasks, options?.preserveIndentation);
    }

    addExtension(extension: TodoTxtExtension): void {
        this.extensionHandler.addExtension(extension);
    }

    removeExtension(key: string): boolean {
        return this.extensionHandler.removeExtension(key);
    }

    getExtensionHandler(): ExtensionHandler {
        return this.extensionHandler;
    }
}
