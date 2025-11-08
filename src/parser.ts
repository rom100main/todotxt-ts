import { ParseError, ValidationError } from "./errors";
import { ExtensionHandler } from "./extension-handler";
import { TaskBuilder } from "./task";
import { Task, ParseOptions } from "./types";

export class TodoTxtParser {
    private extensionHandler = new ExtensionHandler();
    private handleSubtasks = true;

    constructor(options?: ParseOptions) {
        this.extensionHandler = options?.extensionHandler ?? new ExtensionHandler();
        this.handleSubtasks = options?.handleSubtasks ?? true;
    }

    parseFile(content: string): Task[] {
        if (typeof content !== "string") {
            throw new ValidationError("Content must be a string", "content", content);
        }

        const lines = content.split("\n").filter((line) => line.trim() !== "");

        if (!this.handleSubtasks) {
            return lines.map((line, index) => {
                try {
                    return TaskBuilder.createTask(line, this.extensionHandler);
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    throw new ParseError(`Failed to parse line ${index + 1}: ${message}`, line, index + 1);
                }
            });
        }

        return this.parseWithSubtasks(lines);
    }

    parseLine(line: string): Task {
        if (typeof line !== "string") {
            throw new ValidationError("Line must be a string", "line", line);
        }

        try {
            return TaskBuilder.createTask(line, this.extensionHandler);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new ParseError(`Failed to parse line: ${message}`, line);
        }
    }

    private parseWithSubtasks(lines: string[]): Task[] {
        const tasks: Task[] = [];
        const stack: Task[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let task: Task;

            try {
                task = TaskBuilder.createTask(line, this.extensionHandler);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                throw new ParseError(`Failed to parse line ${i + 1}: ${message}`, line, i + 1);
            }

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

                    const taskWithInheritance = TaskBuilder.createTask(line, this.extensionHandler, parent);

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
