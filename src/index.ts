import * as fs from "fs";

import {
    TodoTxtError,
    ParseError,
    ExtensionError,
    SerializationError,
    ValidationError,
    DateError,
    PriorityError,
} from "./errors";
import { ExtensionHandler } from "./extension-handler";
import { TodoTxtParser } from "./parser";
import { TodoTxtSerializer } from "./serializer";
import { TaskBuilder } from "./task";
import {
    Priority,
    Task,
    TodoTxtExtension,
    TaskFilter,
    TaskSorter,
    TaskExtensions,
    TodoOptions,
    SaveOptions,
    ExtensionValue,
    DateExtension,
    ArrayExtension,
    NumberExtension,
    StringExtension,
    BooleanExtension,
    ParseOptions,
} from "./types";

export {
    Priority,
    TaskFilter,
    TaskSorter,
    Task,
    TodoTxtExtension,
    TaskExtensions,
    TodoOptions,
    SaveOptions,
    ExtensionValue,
    DateExtension,
    ArrayExtension,
    NumberExtension,
    StringExtension,
    BooleanExtension,
    ParseOptions,
};
export { TaskFilters } from "./filters";
export { TaskSorts, SortDirection } from "./sorts";
export { ExtensionHandler };
export { TaskBuilder };
export { TodoTxtParser };
export { TodoTxtSerializer };
export { TodoTxtError, ParseError, ExtensionError, SerializationError, ValidationError, DateError, PriorityError };

export class TodoTxt {
    private parser: TodoTxtParser;
    private serializer: TodoTxtSerializer;
    private extensionHandler: ExtensionHandler;
    private tasks: Task[] = [];
    private filePath?: string;
    private autoSave: boolean;

    constructor(options?: TodoOptions) {
        this.extensionHandler = new ExtensionHandler(options?.extensions);
        this.parser = new TodoTxtParser({
            extensionHandler: this.extensionHandler,
            handleSubtasks: options?.handleSubtasks,
        });
        this.serializer = new TodoTxtSerializer(this.extensionHandler);
        this.filePath = options?.filePath;
        this.autoSave = options?.autoSave ?? false;
    }

    private flattenTasks(tasks: Task[]): Task[] {
        const result: Task[] = [];
        for (const task of tasks) {
            result.push(task);
            if (task.subtasks && task.subtasks.length > 0) {
                result.push(...this.flattenTasks(task.subtasks));
            }
        }
        return result;
    }

    private findTasksByNumbers(numbers: number[]): Task[] {
        const flatTasks = this.flattenTasks(this.tasks);
        return numbers.filter((n) => n >= 1 && n <= flatTasks.length).map((n) => flatTasks[n - 1]);
    }

    private async saveIfNeeded(): Promise<void> {
        if (this.autoSave && this.filePath) {
            await this.save(this.filePath);
        }
    }

    list(filter?: TaskFilter, sorter?: TaskSorter): Task[] {
        let flatTasks = this.flattenTasks(this.tasks);

        if (filter) {
            flatTasks = flatTasks.filter(filter);
        }

        if (sorter) {
            flatTasks.sort(sorter);
        }

        return flatTasks;
    }

    async add(taskInputs: string | string[]): Promise<void> {
        const inputs = Array.isArray(taskInputs) ? taskInputs : [taskInputs];

        for (const input of inputs) {
            const task = this.parser.parseLine(input);
            this.tasks.push(task);
        }

        await this.saveIfNeeded();
    }

    async mark(numbers: number | number[]): Promise<void> {
        const nums = Array.isArray(numbers) ? numbers : [numbers];
        const tasks = this.findTasksByNumbers(nums);

        for (const task of tasks) {
            task.completed = true;
            if (!task.completionDate) {
                task.completionDate = new Date();
            }
        }

        await this.saveIfNeeded();
    }

    async unmark(numbers: number | number[]): Promise<void> {
        const nums = Array.isArray(numbers) ? numbers : [numbers];
        const tasks = this.findTasksByNumbers(nums);

        for (const task of tasks) {
            task.completed = false;
            task.completionDate = undefined;
        }

        await this.saveIfNeeded();
    }

    async remove(numbers: number | number[]): Promise<void> {
        const nums = Array.isArray(numbers) ? numbers : [numbers];
        const tasksToRemove = this.findTasksByNumbers(nums);

        for (const taskToRemove of tasksToRemove) {
            if (taskToRemove.parent) {
                const parentIndex = taskToRemove.parent.subtasks.indexOf(taskToRemove);
                if (parentIndex > -1) {
                    taskToRemove.parent.subtasks.splice(parentIndex, 1);
                }
            } else {
                const rootIndex = this.tasks.indexOf(taskToRemove);
                if (rootIndex > -1) {
                    this.tasks.splice(rootIndex, 1);
                }
            }
        }

        await this.saveIfNeeded();
    }

    async update(numbers: number | number[], updates: Partial<Task>): Promise<void> {
        const nums = Array.isArray(numbers) ? numbers : [numbers];
        const tasks = this.findTasksByNumbers(nums);

        for (const task of tasks) {
            Object.assign(task, updates);
        }

        await this.saveIfNeeded();
    }

    async save(filePath?: string): Promise<void> {
        const targetPath = filePath || this.filePath;
        if (!targetPath) {
            throw new Error("No file path specified");
        }

        const content = this.serializer.serializeTasks(this.tasks);
        await fs.promises.writeFile(targetPath, content, "utf8");

        if (!this.filePath) {
            this.filePath = targetPath;
        }
    }

    async load(filePath?: string): Promise<void> {
        const targetPath = filePath || this.filePath;
        if (!targetPath) {
            throw new Error("No file path specified");
        }

        const content = await fs.promises.readFile(targetPath, "utf8");
        this.tasks = this.parser.parseFile(content);

        if (!this.filePath) {
            this.filePath = targetPath;
        }
    }

    setAutoSave(autoSave: boolean): void {
        this.autoSave = autoSave;
    }
}
