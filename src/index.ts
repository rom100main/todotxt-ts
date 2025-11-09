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
    private parser = new TodoTxtParser();
    private serializer = new TodoTxtSerializer();
    private extensionHandler = new ExtensionHandler();
    private tasks: Task[] = [];
    private filePath = "todo.txt";
    private autoSave = false;
    private handleSubtasks = true;

    constructor(options?: TodoOptions) {
        this.extensionHandler = new ExtensionHandler(options?.extensions);
        this.parser = new TodoTxtParser({
            extensionHandler: this.extensionHandler,
            handleSubtasks: options?.handleSubtasks,
        });
        this.serializer = new TodoTxtSerializer(this.extensionHandler);
        this.filePath = options?.filePath ?? "todo.txt";
        this.autoSave = options?.autoSave ?? false;
        this.handleSubtasks = options?.handleSubtasks ?? true;
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
        const result: Task[] = [];

        for (const original of numbers) {
            let n = original;
            if (n < 0) {
                n = flatTasks.length + n;
            }

            if (n < 0 || n >= flatTasks.length) {
                throw new TodoTxtError(
                    `Index out of bounds: ${original}. Valid range is 0..${flatTasks.length - 1} or -${flatTasks.length}..-1`,
                );
            }

            result.push(flatTasks[n]);
        }

        return result;
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

    async add(taskInputs: string | string[] | Task | Task[]): Promise<void> {
        const inputs = Array.isArray(taskInputs) ? taskInputs : [taskInputs];
        const tasks = inputs.map((input) => (typeof input === "string" ? this.parser.parseLine(input) : input));

        if (this.handleSubtasks) {
            this.addTasksWithSubtasks(tasks);
        } else {
            tasks.forEach((task) => this.tasks.push(task));
        }

        await this.saveIfNeeded();
    }

    private addTasksWithSubtasks(tasks: Task[]): void {
        const stack: Task[] = [];

        for (const task of tasks) {
            if (stack.length === 0) {
                if (task.indentLevel > 0) {
                    const parent = this.findParentInExistingTasks(task);
                    if (parent) {
                        task.parent = parent;
                        parent.subtasks.push(task);
                        stack.push(task);
                        continue;
                    }
                }
                this.tasks.push(task);
                stack.push(task);
                continue;
            }

            let parentFound = false;

            for (let i = stack.length - 1; i >= 0; i--) {
                if (task.indentLevel > stack[i].indentLevel) {
                    const parent = stack[i];
                    task.parent = parent;
                    parent.subtasks.push(task);
                    stack.splice(i + 1);
                    stack.push(task);
                    parentFound = true;
                    break;
                }
            }

            if (!parentFound) {
                // Try to find parent in existing tasks
                const parent = this.findParentInExistingTasks(task);
                if (parent) {
                    task.parent = parent;
                    parent.subtasks.push(task);
                    stack.splice(0);
                    stack.push(task);
                } else {
                    this.tasks.push(task);
                    stack.splice(0);
                    stack.push(task);
                }
            }
        }
    }

    private findParentInExistingTasks(task: Task): Task | null {
        const allTasks = this.flattenTasks(this.tasks);
        let bestParent: Task | null = null;
        let highestIndentLevel = -1;

        for (const existingTask of allTasks) {
            if (task.indentLevel > existingTask.indentLevel && existingTask.indentLevel > highestIndentLevel) {
                bestParent = existingTask;
                highestIndentLevel = existingTask.indentLevel;
            }
        }

        return bestParent;
    }

    async insert(index: number, taskInput: string | Task): Promise<void> {
        const task = typeof taskInput === "string" ? this.parser.parseLine(taskInput) : taskInput;

        const flatTasks = this.flattenTasks(this.tasks);

        const originalIndex = index;
        if (index < 0) {
            index = flatTasks.length + index;
        }
        if (index < 0) {
            index = 0;
        }

        if (index >= flatTasks.length || (originalIndex === -flatTasks.length && task.indentLevel === 0)) {
            this.add(task);
        } else if (this.handleSubtasks) {
            const allRawTasks = flatTasks.map((t) => t.raw);
            let insertIndex: number;
            if (task.indentLevel > 0) {
                insertIndex = index + 1;
            } else {
                insertIndex = originalIndex >= 0 ? index + 1 : index;
            }
            allRawTasks.splice(insertIndex, 0, task.raw);

            this.tasks = this.parser.parseFile(allRawTasks.join("\n"));
        } else {
            const insertIndex = originalIndex >= 0 ? index + 1 : index;
            this.tasks.splice(insertIndex, 0, task);
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

    async update(
        indexOrUpdates: number | { index: number; values: Partial<Task> }[],
        values?: Partial<Task>,
    ): Promise<void> {
        if (typeof indexOrUpdates === "number") {
            if (!values) {
                throw new TodoTxtError("Values parameter is required when using index number");
            }
            const task = this.findTasksByNumbers([indexOrUpdates])[0];
            if (task) {
                Object.assign(task, values);
            }
        } else {
            for (const { index, values: updateValues } of indexOrUpdates) {
                const task = this.findTasksByNumbers([index])[0];
                if (task) {
                    Object.assign(task, updateValues);
                }
            }
        }

        await this.saveIfNeeded();
    }

    async save(filePath?: string): Promise<void> {
        const targetPath = filePath || this.filePath;
        if (!targetPath) {
            throw new TodoTxtError("No file path specified");
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
            throw new TodoTxtError("No file path specified");
        }

        try {
            const content = await fs.promises.readFile(targetPath, "utf8");
            this.tasks = this.parser.parseFile(content);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new TodoTxtError("Failed to load file: " + message);
        }

        if (!this.filePath) {
            this.filePath = targetPath;
        }
    }

    setAutoSave(autoSave: boolean): void {
        this.autoSave = autoSave;
    }
}
