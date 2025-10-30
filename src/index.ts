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
    private autoSave = false;
    private handleSubtasks = true;

    constructor(options?: TodoOptions) {
        this.extensionHandler = new ExtensionHandler(options?.extensions);
        this.parser = new TodoTxtParser({
            extensionHandler: this.extensionHandler,
            handleSubtasks: options?.handleSubtasks,
        });
        this.serializer = new TodoTxtSerializer(this.extensionHandler);
        this.filePath = options?.filePath;
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
                n = flatTasks.length + n + 1;
            }

            if (n < 1 || n > flatTasks.length) {
                throw new TodoTxtError(
                    `Index out of bounds: ${original}. Valid range is 1..${flatTasks.length} or -${flatTasks.length}..-1`,
                );
            }

            result.push(flatTasks[n - 1]);
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
                this.tasks.push(task);
                stack.splice(0);
                stack.push(task);
            }
        }
    }

    async insert(index: number, taskInput: string | Task): Promise<void> {
        const task = typeof taskInput === "string" ? this.parser.parseLine(taskInput) : taskInput;

        const flatTasks = this.flattenTasks(this.tasks);

        if (index < 0) {
            index = flatTasks.length + index + 1;
        }
        if (index < 0) {
            index = 0;
        }

        if (index >= flatTasks.length) {
            this.add(task);
        } else if (this.handleSubtasks) {
            // Get the raw strings of all tasks and insert the new one
            const allRawTasks = flatTasks.map((t) => t.raw);
            allRawTasks.splice(index, 0, task.raw);

            // Re-parse everything to rebuild the tree structure correctly
            this.tasks = this.parser.parseFile(allRawTasks.join("\n"));
        } else {
            this.tasks.splice(index, 0, task);
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
