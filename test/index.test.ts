import * as fs from "fs";
import * as path from "path";

import { TodoTxt, TaskFilters, TaskSorts } from "../src/index";

describe("TodoTxt", () => {
    let todoTxt: TodoTxt;
    let testFilePath: string;

    beforeEach(() => {
        todoTxt = new TodoTxt();
        testFilePath = path.join(__dirname, "test-todo.txt");
    });

    afterEach(async () => {
        try {
            await fs.promises.unlink(testFilePath);
        } catch {
            // File doesn't exist, ignore
        }
    });

    describe("Constructor", () => {
        test("should create TodoTxt instance with default options", () => {
            expect(todoTxt).toBeInstanceOf(TodoTxt);
        });

        test("should create TodoTxt instance with custom options", () => {
            const customTodo = new TodoTxt({
                filePath: testFilePath,
                autoSave: true,
                handleSubtasks: true,
            });
            expect(customTodo).toBeInstanceOf(TodoTxt);
            expect((customTodo as any).filePath).toBe(testFilePath); //eslint-disable-line @typescript-eslint/no-explicit-any
        });
    });

    describe("list", () => {
        beforeEach(async () => {
            await todoTxt.add([
                "(A) High priority task",
                "2023-10-24 Task with date",
                "x Completed task",
                "x (B) 2023-10-25 Task with priority and date",
            ]);
        });

        test("should return all tasks when no filter provided", () => {
            const tasks = todoTxt.list();
            expect(tasks).toHaveLength(4);
        });

        test("should filter tasks", () => {
            const completedTasks = todoTxt.list(TaskFilters.completed());
            expect(completedTasks).toHaveLength(2);
            expect(completedTasks[0].completed).toBe(true);
            expect(completedTasks[1].completed).toBe(true);
        });

        test("should sort tasks", () => {
            const sortedTasks = todoTxt.list(undefined, TaskSorts.byPriority());
            expect(sortedTasks).toHaveLength(4);
            expect(sortedTasks[0].priority).toBe("A");
            expect(sortedTasks[1].priority).toBe("B");
            expect(sortedTasks[2].priority).toBeUndefined();
            expect(sortedTasks[3].priority).toBeUndefined();
        });

        test("should filter and sort tasks", () => {
            const incompleteTasks = todoTxt.list(TaskFilters.incomplete(), TaskSorts.byPriority());
            expect(incompleteTasks).toHaveLength(2);
            expect(incompleteTasks[0].priority).toBe("A");
            expect(incompleteTasks[1].priority).toBeUndefined();
        });
    });

    describe("add", () => {
        test("should add a single task", async () => {
            await todoTxt.add("New task");
            const tasks = todoTxt.list();
            expect(tasks).toHaveLength(1);
            expect(tasks[0].description).toBe("New task");
        });

        test("should add multiple tasks", async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);
            const tasks = todoTxt.list();
            expect(tasks).toHaveLength(3);
            expect(tasks.map((t) => t.description)).toEqual(["Task 1", "Task 2", "Task 3"]);
        });
    });

    describe("mark", () => {
        beforeEach(async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);
        });

        test("should mark a single task as completed", async () => {
            await todoTxt.mark(1);
            const tasks = todoTxt.list();
            expect(tasks[0].completed).toBe(true);
            expect(tasks[0].completionDate).toBeInstanceOf(Date);
        });

        test("should mark multiple tasks as completed", async () => {
            await todoTxt.mark([1, 3]);
            const tasks = todoTxt.list();
            expect(tasks[0].completed).toBe(true);
            expect(tasks[2].completed).toBe(true);
            expect(tasks[1].completed).toBe(false);
        });

        test("should handle invalid task numbers gracefully", async () => {
            await todoTxt.mark(99);
            const tasks = todoTxt.list();
            expect(tasks.every((t) => !t.completed)).toBe(true);
        });
    });

    describe("unmark", () => {
        beforeEach(async () => {
            await todoTxt.add(["x 2025-01-02 2025-01-01 Completed task 1", "x Completed task 2", "Task 3"]);
        });

        test("should unmark a single task", async () => {
            await todoTxt.unmark(1);
            const tasks = todoTxt.list();
            expect(tasks[0].completed).toBe(false);
            expect(tasks[0].completionDate).toBeUndefined();
        });

        test("should unmark multiple tasks", async () => {
            await todoTxt.unmark([1, 2]);
            const tasks = todoTxt.list();
            expect(tasks[0].completed).toBe(false);
            expect(tasks[1].completed).toBe(false);
            expect(tasks[2].completed).toBe(false);
        });
    });

    describe("remove", () => {
        beforeEach(async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);
        });

        test("should remove a single task", async () => {
            await todoTxt.remove(2);
            const tasks = todoTxt.list();
            expect(tasks).toHaveLength(2);
            expect(tasks.map((t) => t.description)).toEqual(["Task 1", "Task 3"]);
        });

        test("should remove multiple tasks", async () => {
            await todoTxt.remove([1, 3]);
            const tasks = todoTxt.list();
            expect(tasks).toHaveLength(1);
            expect(tasks[0].description).toBe("Task 2");
        });

        test("should handle invalid task numbers gracefully", async () => {
            await todoTxt.remove(99);
            const tasks = todoTxt.list();
            expect(tasks).toHaveLength(3);
        });
    });

    describe("update", () => {
        beforeEach(async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);
        });

        test("should update a single task", async () => {
            await todoTxt.update(1, { description: "Updated task 1" });
            const tasks = todoTxt.list();
            expect(tasks[0].description).toBe("Updated task 1");
        });

        test("should update multiple tasks", async () => {
            await todoTxt.update([1, 3], { priority: "A" });
            const tasks = todoTxt.list();
            expect(tasks[0].priority).toBe("A");
            expect(tasks[2].priority).toBe("A");
            expect(tasks[1].priority).toBeUndefined();
        });

        test("should update multiple properties", async () => {
            await todoTxt.update(2, {
                priority: "B",
                description: "Updated task 2",
                completed: true,
            });
            const tasks = todoTxt.list();
            const task = tasks.find((t) => t.description === "Updated task 2");
            expect(task?.priority).toBe("B");
            expect(task?.completed).toBe(true);
        });
    });

    describe("save and load", () => {
        beforeEach(async () => {
            await todoTxt.add(["(A) High priority task", "2023-10-24 Task with date", "x Completed task"]);
        });

        test("should save tasks to file", async () => {
            await todoTxt.save(testFilePath);
            const exists = await fs.promises
                .access(testFilePath)
                .then(() => true)
                .catch(() => false);
            expect(exists).toBe(true);
        });

        test("should load tasks from file", async () => {
            await todoTxt.save(testFilePath);

            const newTodoTxt = new TodoTxt();
            await newTodoTxt.load(testFilePath);

            const tasks = newTodoTxt.list();
            expect(tasks).toHaveLength(3);
            expect(tasks[0].priority).toBe("A");
            expect(tasks[1].creationDate).toEqual(new Date(Date.UTC(2023, 9, 24)));
            expect(tasks[2].completed).toBe(true);
        });

        test("should throw error when saving without file path", async () => {
            const todoWithoutPath = new TodoTxt();
            await expect(todoWithoutPath.save()).rejects.toThrow("No file path specified");
        });

        test("should throw error when loading without file path", async () => {
            const todoWithoutPath = new TodoTxt();
            await expect(todoWithoutPath.load()).rejects.toThrow("No file path specified");
        });
    });

    describe("autoSave", () => {
        test("should auto-save when enabled", async () => {
            const autoSaveTodo = new TodoTxt({
                filePath: testFilePath,
                autoSave: true,
            });

            await autoSaveTodo.add("Auto-saved task");

            // Check if file was created
            const exists = await fs.promises
                .access(testFilePath)
                .then(() => true)
                .catch(() => false);
            expect(exists).toBe(true);
        });

        test("should not auto-save when disabled", async () => {
            const noAutoSaveTodo = new TodoTxt({
                filePath: testFilePath,
                autoSave: false,
            });

            await noAutoSaveTodo.add("Not auto-saved task");

            // Check if file was not created
            const exists = await fs.promises
                .access(testFilePath)
                .then(() => true)
                .catch(() => false);
            expect(exists).toBe(false);
        });

        test("should set auto-save option", () => {
            todoTxt.setAutoSave(true);
            // Since autoSave is private, we can't directly test it
            // but we can test that the method doesn't throw
            expect(() => todoTxt.setAutoSave(false)).not.toThrow();
        });
    });

    describe("subtasks", () => {
        test("should handle tasks with subtasks when loading from file", async () => {
            const todoWithSubtasks = new TodoTxt({ handleSubtasks: true });

            // Create a file with subtasks
            const content = `Parent task
  Child task 1
  Child task 2
    Grandchild task`;
            await fs.promises.writeFile(testFilePath, content, "utf8");

            await todoWithSubtasks.load(testFilePath);

            const tasks = todoWithSubtasks.list();
            expect(tasks).toHaveLength(4);

            const parentTask = tasks.find((t) => t.description === "Parent task");
            expect(parentTask?.subtasks).toHaveLength(2);
        });

        test("should flatten tasks for numbering", async () => {
            const todoWithSubtasks = new TodoTxt({ handleSubtasks: true });

            // Create a file with subtasks
            const content = `Parent task
  Child task`;
            await fs.promises.writeFile(testFilePath, content, "utf8");

            await todoWithSubtasks.load(testFilePath);

            // Should be able to mark child task by number
            await todoWithSubtasks.mark(2);
            const tasks = todoWithSubtasks.list();
            const childTask = tasks.find((t) => t.description === "Child task");
            expect(childTask?.completed).toBe(true);
        });
    });

    describe("error handling", () => {
        test("should handle invalid task numbers in mark operation", async () => {
            await todoTxt.add("Test task");
            await expect(todoTxt.mark(0)).resolves.not.toThrow();
            await expect(todoTxt.mark(-1)).resolves.not.toThrow();
        });

        test("should handle invalid task numbers in remove operation", async () => {
            await todoTxt.add("Test task");
            await expect(todoTxt.remove(0)).resolves.not.toThrow();
            await expect(todoTxt.remove(-1)).resolves.not.toThrow();
        });

        test("should handle invalid task numbers in update operation", async () => {
            await todoTxt.add("Test task");
            await expect(todoTxt.update(0, { description: "Updated" })).resolves.not.toThrow();
            await expect(todoTxt.update(-1, { description: "Updated" })).resolves.not.toThrow();
        });
    });
});
