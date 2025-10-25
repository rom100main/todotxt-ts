import { SerializationError, ValidationError, DateError } from "./errors";
import { ExtensionHandler } from "./extension-handler";
import { Task } from "./types";
import { DateUtils } from "./utils";

export class TodoTxtSerializer {
    private extensionHandler: ExtensionHandler;

    constructor(extensionHandler: ExtensionHandler) {
        this.extensionHandler = extensionHandler;
    }

    serializeTasks(tasks: Task[], includeSubtasks = true, preserveIndentation = true): string {
        if (!Array.isArray(tasks)) {
            throw new ValidationError("Tasks must be an array", "tasks", tasks);
        }

        const lines: string[] = [];

        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            try {
                lines.push(...this.serializeTask(task, includeSubtasks, preserveIndentation));
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                throw new SerializationError(`Failed to serialize task at index ${i}: ${message}`, task);
            }
        }

        return lines.join("\n");
    }

    serializeTask(task: Task, includeSubtasks = true, preserveIndentation = true): string[] {
        if (!task || typeof task !== "object") {
            throw new ValidationError("Task must be an object", "task", task);
        }

        const lines: string[] = [];

        try {
            const line = this.serializeSingleTask(task, preserveIndentation ? task.indentLevel : 0);
            lines.push(line);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new SerializationError(`Failed to serialize task: ${message}`, task);
        }

        if (includeSubtasks && task.subtasks && task.subtasks.length > 0) {
            for (let i = 0; i < task.subtasks.length; i++) {
                const subtask = task.subtasks[i];
                try {
                    lines.push(...this.serializeTask(subtask, includeSubtasks, preserveIndentation));
                } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    throw new SerializationError(`Failed to serialize subtask at index ${i}: ${message}`, subtask);
                }
            }
        }

        return lines;
    }

    private serializeSingleTask(task: Task, indentLevel = 0): string {
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
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw new DateError("Invalid date object", date?.toString());
        }

        try {
            return DateUtils.formatDate(date);
        } catch {
            throw new DateError(`Failed to format date: ${date.toString()}`, date.toString());
        }
    }
}
