import { Task, ParseOptions } from "./types";
import { ExtensionHandler } from "./extension-handler";
import { TaskBuilder } from "./task";

export class TodoTxtParser {
    private extensionHandler: ExtensionHandler;
    private handleSubtasks: boolean;

    constructor(options?: ParseOptions) {
        this.extensionHandler = options?.extensionHandler
            ? options.extensionHandler
            : new ExtensionHandler();
        this.handleSubtasks = options?.handleSubtasks
            ? options.handleSubtasks
            : true;
    }

    parseFile(content: string): Task[] {
        const lines = content.split("\n").filter((line) => line.trim() !== "");

        if (!this.handleSubtasks) {
            return lines.map((line) =>
                TaskBuilder.createTask(line, this.extensionHandler),
            );
        }

        return this.parseWithSubtasks(lines);
    }

    parseLine(line: string): Task {
        return TaskBuilder.createTask(line, this.extensionHandler);
    }

    private parseWithSubtasks(lines: string[]): Task[] {
        const tasks: Task[] = [];
        const stack: Task[] = [];

        for (const line of lines) {
            const task = TaskBuilder.createTask(line, this.extensionHandler);

            if (stack.length === 0) {
                tasks.push(task);
                stack.push(task);
                continue;
            }

            let parentFound = false;

            for (let i = stack.length - 1; i >= 0; i--) {
                if (task.indentLevel > stack[i].indentLevel) {
                    const parent = stack[i];
                    task.parent = parent;

                    const taskWithInheritance = TaskBuilder.createTask(
                        line,
                        this.extensionHandler,
                        parent,
                    );

                    parent.subtasks.push(taskWithInheritance);

                    stack.splice(i + 1);
                    stack.push(taskWithInheritance);
                    parentFound = true;
                    break;
                }
            }

            if (!parentFound) {
                tasks.push(task);
                stack.splice(0);
                stack.push(task);
            }
        }

        return tasks;
    }
}
