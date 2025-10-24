import { ExtensionHandler } from "./extension-handler";
import { Task } from "./types";

export class TodoTxtSerializer {
    private extensionHandler: ExtensionHandler;

    constructor(extensionHandler: ExtensionHandler) {
        this.extensionHandler = extensionHandler;
    }

    serializeTasks(tasks: Task[], includeSubtasks: boolean = true, preserveIndentation: boolean = true): string {
        const lines: string[] = [];

        for (const task of tasks) {
            lines.push(...this.serializeTask(task, includeSubtasks, preserveIndentation));
        }

        return lines.join("\n");
    }

    serializeTask(task: Task, includeSubtasks: boolean = true, preserveIndentation: boolean = true): string[] {
        const lines: string[] = [];

        const line = this.serializeSingleTask(task, preserveIndentation ? task.indentLevel : 0);
        lines.push(line);

        if (includeSubtasks && task.subtasks.length > 0) {
            for (const subtask of task.subtasks) {
                lines.push(...this.serializeTask(subtask, includeSubtasks, preserveIndentation));
            }
        }

        return lines;
    }

    private serializeSingleTask(task: Task, indentLevel: number = 0): string {
        const parts: string[] = [];

        const indent = " ".repeat(indentLevel);
        parts.push(indent);

        if (task.completed) {
            parts.push("x");

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
        description = description.replace(extensionRegex, "");

        const extensionParts = this.extensionHandler.serializeExtensions(task.extensions);
        for (const extPart of extensionParts) {
            description += ` ${extPart}`;
        }

        parts.push(description.trim());

        return parts.join(" ").trim();
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
}
