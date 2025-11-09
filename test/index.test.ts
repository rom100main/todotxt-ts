import * as fs from "fs";
import * as path from "path";

import { TodoTxt, TaskFilters, TaskSorts, Task } from "../src/index";

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

        test("should add subtask to correct parent", async () => {
            await todoTxt.add(["Parent task", "    Child task 1", "        Grandchild task", "    Child task 2"]);
            await todoTxt.add("    Child task 3");
            await todoTxt.add(["    Child task 4", "    Child task 5"]);
            await todoTxt.add("        Grandchild task 2");
            await todoTxt.add("Parent task 2");
            await todoTxt.add(["    Child task 6", "    Child task 7"]);
            await todoTxt.add("Parent task 3");
            await todoTxt.add(["    Child task 8"]);

            const tasks = todoTxt.list();
            const parentTask = tasks.find((t) => t.description === "Parent task");
            const grandchildTask = tasks.find((t) => t.description === "Grandchild task");
            const childTask5 = tasks.find((t) => t.description === "Child task 5");
            const parentTask2 = tasks.find((t) => t.description === "Parent task 2");
            const parentTask3 = tasks.find((t) => t.description === "Parent task 3");

            expect(parentTask?.subtasks).toHaveLength(5);
            expect(grandchildTask?.parent?.description).toBe("Child task 1");
            expect(childTask5?.subtasks).toHaveLength(1);
            expect(parentTask2?.subtasks).toHaveLength(2);
            expect(parentTask3?.subtasks).toHaveLength(1);
        });
    });

    describe("mark", () => {
        beforeEach(async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);
        });

        test("should mark a single task as completed", async () => {
            await todoTxt.mark(0);
            const tasks = todoTxt.list();
            expect(tasks[0].completed).toBe(true);
            expect(tasks[0].completionDate).toBeInstanceOf(Date);
        });

        test("should mark multiple tasks as completed", async () => {
            await todoTxt.mark([0, 2]);
            const tasks = todoTxt.list();
            expect(tasks[0].completed).toBe(true);
            expect(tasks[2].completed).toBe(true);
            expect(tasks[1].completed).toBe(false);
        });

        test("should mark task using negative index", async () => {
            await todoTxt.mark(-1);
            const tasks = todoTxt.list();
            expect(tasks[2].completed).toBe(true);
            expect(tasks[2].completionDate).toBeInstanceOf(Date);
        });

        test("should mark multiple tasks using negative indices", async () => {
            await todoTxt.mark([-1, -3]);
            const tasks = todoTxt.list();
            expect(tasks[0].completed).toBe(true);
            expect(tasks[2].completed).toBe(true);
            expect(tasks[1].completed).toBe(false);
        });

        test("should mark tasks using mixed positive and negative indices", async () => {
            await todoTxt.mark([0, -1]);
            const tasks = todoTxt.list();
            expect(tasks[0].completed).toBe(true);
            expect(tasks[2].completed).toBe(true);
            expect(tasks[1].completed).toBe(false);
        });
    });

    describe("unmark", () => {
        beforeEach(async () => {
            await todoTxt.add(["x 2025-01-02 2025-01-01 Completed task 1", "x Completed task 2", "Task 3"]);
        });

        test("should unmark a single task", async () => {
            await todoTxt.unmark(0);
            const tasks = todoTxt.list();
            expect(tasks[0].completed).toBe(false);
            expect(tasks[0].completionDate).toBeUndefined();
        });

        test("should unmark multiple tasks", async () => {
            await todoTxt.unmark([0, 1]);
            const tasks = todoTxt.list();
            expect(tasks[0].completed).toBe(false);
            expect(tasks[1].completed).toBe(false);
            expect(tasks[2].completed).toBe(false);
        });

        test("should unmark task using negative index", async () => {
            await todoTxt.unmark(-2);
            const tasks = todoTxt.list();
            expect(tasks[1].completed).toBe(false);
            expect(tasks[1].completionDate).toBeUndefined();
        });

        test("should unmark multiple tasks using negative indices", async () => {
            await todoTxt.unmark([-1, -2]);
            const tasks = todoTxt.list();
            expect(tasks[0].completed).toBe(true);
            expect(tasks[1].completed).toBe(false);
            expect(tasks[2].completed).toBe(false);
        });

        test("should unmark tasks using mixed positive and negative indices", async () => {
            await todoTxt.unmark([0, -1]);
            const tasks = todoTxt.list();
            expect(tasks[0].completed).toBe(false);
            expect(tasks[1].completed).toBe(true);
            expect(tasks[2].completed).toBe(false);
        });
    });

    describe("remove", () => {
        test("should remove a single task", async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);
            await todoTxt.remove(1);
            const tasks = todoTxt.list();
            expect(tasks).toHaveLength(2);
            expect(tasks.map((t) => t.description)).toEqual(["Task 1", "Task 3"]);
        });

        test("should remove multiple tasks", async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);
            await todoTxt.remove([0, 2]);
            const tasks = todoTxt.list();
            expect(tasks).toHaveLength(1);
            expect(tasks[0].description).toBe("Task 2");
        });

        test("should remove task using negative index", async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);
            await todoTxt.remove(-1);
            const tasks = todoTxt.list();
            expect(tasks).toHaveLength(2);
            expect(tasks.map((t) => t.description)).toEqual(["Task 1", "Task 2"]);
        });

        test("should remove multiple tasks using negative indices", async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);
            await todoTxt.remove([-1, -3]);
            const tasks = todoTxt.list();
            expect(tasks).toHaveLength(1);
            expect(tasks[0].description).toBe("Task 2");
        });

        test("should remove tasks using mixed positive and negative indices", async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);
            await todoTxt.remove([0, -1]);
            const tasks = todoTxt.list();
            expect(tasks).toHaveLength(1);
            expect(tasks[0].description).toBe("Task 2");
        });

        test("should remove task with subtasks", async () => {
            await todoTxt.add(["Parent task", "    Child task 1", "    Child task 2"]);
            await todoTxt.remove(1);
            const tasks = todoTxt.list();
            const parentTask = tasks.find((t) => t.description === "Parent task");
            expect(parentTask?.subtasks).toHaveLength(1);
            expect(parentTask?.subtasks[0].description).toBe("Child task 2");
            expect(tasks.find((t) => t.description === "Child task 1")).toBeUndefined();
        });

        test("should remove all subtasks if parent task is removed", async () => {
            await todoTxt.add(["Parent task", "    Child task 1", "    Child task 2"]);
            await todoTxt.remove(0);
            const tasks = todoTxt.list();
            expect(tasks).toHaveLength(0);
        });
    });

    describe("update", () => {
        beforeEach(async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);
        });

        test("should update a single task", async () => {
            await todoTxt.update(0, { description: "Updated task 1" });
            const tasks = todoTxt.list();
            expect(tasks[0].description).toBe("Updated task 1");
        });

        test("should update multiple tasks", async () => {
            await todoTxt.update([
                { index: 0, values: { priority: "A" } },
                { index: 2, values: { priority: "A" } },
            ]);
            const tasks = todoTxt.list();
            expect(tasks[0].priority).toBe("A");
            expect(tasks[2].priority).toBe("A");
            expect(tasks[1].priority).toBeUndefined();
        });

        test("should update task using negative index", async () => {
            await todoTxt.update(-1, { description: "Updated task 3" });
            const tasks = todoTxt.list();
            expect(tasks[2].description).toBe("Updated task 3");
        });

        test("should update multiple tasks using negative indices", async () => {
            await todoTxt.update([
                { index: -1, values: { priority: "A" } },
                { index: -3, values: { priority: "B" } },
            ]);
            const tasks = todoTxt.list();
            expect(tasks[0].priority).toBe("B");
            expect(tasks[2].priority).toBe("A");
            expect(tasks[1].priority).toBeUndefined();
        });

        test("should update tasks using mixed positive and negative indices", async () => {
            await todoTxt.update([
                { index: 0, values: { priority: "A" } },
                { index: -1, values: { description: "Updated task 3" } },
            ]);
            const tasks = todoTxt.list();
            expect(tasks[0].priority).toBe("A");
            expect(tasks[2].description).toBe("Updated task 3");
            expect(tasks[1].priority).toBeUndefined();
        });

        test("should update multiple properties", async () => {
            await todoTxt.update(1, {
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

    describe("insert", () => {
        test("should insert task at specific index", async () => {
            await todoTxt.add(["Task1", "Task2", "Task3"]);
            await todoTxt.insert(0, "Task1_1");
            const tasks = todoTxt.list();
            expect(tasks.map((t) => t.description)).toEqual(["Task1", "Task1_1", "Task2", "Task3"]);
        });

        test("should insert task using negative index", async () => {
            await todoTxt.add(["Task1", "Task2", "Task3"]);
            await todoTxt.insert(-1, "Task2_1");
            const tasks = todoTxt.list();
            expect(tasks.map((t) => t.description)).toEqual(["Task1", "Task2", "Task2_1", "Task3"]);
        });

        test("should insert task at end using negative index equal to length", async () => {
            await todoTxt.add(["Task1", "Task2", "Task3"]);
            await todoTxt.insert(-3, "NewTask");
            const tasks = todoTxt.list();
            expect(tasks.map((t) => t.description)).toEqual(["Task1", "Task2", "Task3", "NewTask"]);
        });

        test("should insert task at beginning using large negative index", async () => {
            await todoTxt.add(["Task1", "Task2", "Task3"]);
            await todoTxt.insert(-10, "FirstTask");
            const tasks = todoTxt.list();
            expect(tasks.map((t) => t.description)).toEqual(["FirstTask", "Task1", "Task2", "Task3"]);
        });

        test("should handle subtask insertion", async () => {
            await todoTxt.add(["Task1", "Task2"]);
            await todoTxt.insert(0, "    Inserted Task");
            const tasks = todoTxt.list();
            const task1 = tasks.find((t) => t.description === "Task1");
            expect(task1?.subtasks[0].description).toBe("Inserted Task");
        });

        test("should handle subtask insertion with negative index", async () => {
            await todoTxt.add(["Task1", "Task2"]);
            await todoTxt.insert(-2, "    Inserted Task");
            const tasks = todoTxt.list();
            const task1 = tasks.find((t) => t.description === "Task1");
            expect(task1?.subtasks[0].description).toBe("Inserted Task");
        });

        test("should handle subtask insertion and reparenting", async () => {
            await todoTxt.add(["Task1", "    SubTask1", "Task2"]);
            await todoTxt.insert(0, "Task1_1");
            const tasks = todoTxt.list();
            const task1 = tasks.find((t) => t.description === "Task1");
            const task1_1 = tasks.find((t) => t.description === "Task1_1");
            const subTask1 = tasks.find((t) => t.description === "SubTask1");
            expect(task1?.subtasks.length).toBe(0);
            expect(task1_1?.subtasks[0].description).toBe("SubTask1");
            expect(subTask1?.parent?.description).toBe("Task1_1");
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

    describe("filter", () => {
        beforeEach(async () => {
            await todoTxt.add([
                "(A) High priority task",
                "Low priority task",
                "x Completed task",
                "Parent task",
                "    Child task 1",
                "    Child task 2",
                "        Grandchild task",
                "Another parent",
                "    Another child",
            ]);
        });

        test("should filter tasks at all levels", () => {
            const filtered = todoTxt.filter(TaskFilters.byPriority("A"));

            expect(filtered).toHaveLength(1);
            expect(filtered[0].description).toBe("High priority task");
        });

        test("should filter completed tasks at all levels", () => {
            const filtered = todoTxt.filter(TaskFilters.completed());

            expect(filtered).toHaveLength(1);
            expect(filtered[0].description).toBe("Completed task");
        });

        test("should filter tasks containing specific text", () => {
            const textFilter = (task: Task) => task.description.includes("Child");
            const filtered = todoTxt.filter(textFilter);

            expect(filtered).toHaveLength(2);
            expect(filtered[0].description).toBe("Parent task");
            expect(filtered[0].subtasks).toHaveLength(2);
            expect(filtered[0].subtasks[0].description).toBe("Child task 1");
            expect(filtered[0].subtasks[1].description).toBe("Child task 2");
            expect(filtered[0].subtasks[1].subtasks).toHaveLength(1);
            expect(filtered[0].subtasks[1].subtasks[0].description).toBe("Grandchild task");

            expect(filtered[1].description).toBe("Another parent");
            expect(filtered[1].subtasks).toHaveLength(1);
            expect(filtered[1].subtasks[0].description).toBe("Another child");
        });

        test("should return empty array when no tasks match filter", () => {
            const filtered = todoTxt.filter(TaskFilters.byPriority("Z"));

            expect(filtered).toHaveLength(0);
        });

        test("should preserve parent-child relationships when filtering", () => {
            const parentFilter = (task: Task) => task.description.includes("Parent");
            const filtered = todoTxt.filter(parentFilter);

            expect(filtered).toHaveLength(2);

            const parentTask = filtered[0];
            expect(parentTask.description).toBe("Parent task");
            expect(parentTask.subtasks).toHaveLength(2);
            expect(parentTask.subtasks[0].description).toBe("Child task 1");
            expect(parentTask.subtasks[1].description).toBe("Child task 2");
            expect(parentTask.subtasks[1].subtasks[0].description).toBe("Grandchild task");

            const anotherParent = filtered[1];
            expect(anotherParent.description).toBe("Another parent");
            expect(anotherParent.subtasks).toHaveLength(1);
            expect(anotherParent.subtasks[0].description).toBe("Another child");
        });
    });

    describe("sort", () => {
        beforeEach(async () => {
            await todoTxt.add([
                "Z task",
                "A task",
                "Parent task",
                "    C child",
                "    A child",
                "    B child",
                "        Z grandchild",
                "        A grandchild",
                "Another parent",
                "    B child",
                "    A child",
            ]);
        });

        test("should sort tasks alphabetically at all levels", () => {
            const sorted = todoTxt.sort(TaskSorts.byDescription());

            expect(sorted).toHaveLength(3);
            expect(sorted[0].description).toBe("A task");
            expect(sorted[1].description).toBe("Another parent");
            expect(sorted[2].description).toBe("Parent task");

            // Check subtasks are sorted
            const anotherParent = sorted[1];
            expect(anotherParent.subtasks.map((t) => t.description)).toEqual(["A child", "B child"]);

            const parentTask = sorted[2];
            expect(parentTask.subtasks.map((t) => t.description)).toEqual(["A child", "B child", "C child"]);

            // Check grandchild is sorted
            const bChild = parentTask.subtasks[1];
            expect(bChild.subtasks.map((t) => t.description)).toEqual(["A grandchild", "Z grandchild"]);
        });

        test("should sort by description length at all levels", () => {
            const lengthSorter = (a: Task, b: Task) => a.description.length - b.description.length;
            const sorted = todoTxt.sort(lengthSorter);

            expect(sorted).toHaveLength(3);
            expect(sorted[0].description).toBe("A task");
            expect(sorted[1].description).toBe("Z task");
            expect(sorted[2].description).toBe("Parent task");

            // Check subtasks are sorted by length
            const parentTask = sorted[2];
            expect(parentTask.subtasks.map((t) => t.description)).toEqual(["A child", "B child", "C child"]);
        });

        test("should maintain hierarchical structure after sorting", () => {
            const sorted = todoTxt.sort(TaskSorts.byDescription());

            // Verify parent-child relationships are maintained
            const parentTask = sorted.find((t) => t.description === "Parent task");
            expect(parentTask?.subtasks).toHaveLength(3);

            const aChild = parentTask?.subtasks.find((t) => t.description === "A child");
            expect(aChild?.subtasks).toHaveLength(0);

            const bChild = parentTask?.subtasks.find((t) => t.description === "B child");
            expect(bChild?.subtasks).toHaveLength(2);
        });
    });

    describe("subtasks", () => {
        test("should handle tasks with subtasks when loading from file", async () => {
            // Create a file with subtasks
            const content = `Parent task
  Child task 1
  Child task 2
    Grandchild task`;
            await fs.promises.writeFile(testFilePath, content, "utf8");

            await todoTxt.load(testFilePath);

            const tasks = todoTxt.list();
            expect(tasks).toHaveLength(4);

            const parentTask = tasks.find((t) => t.description === "Parent task");
            expect(parentTask?.subtasks).toHaveLength(2);
        });

        test("should flatten tasks for numbering", async () => {
            // Create a file with subtasks
            const content = `Parent task
  Child task`;
            await fs.promises.writeFile(testFilePath, content, "utf8");

            await todoTxt.load(testFilePath);

            // Should be able to mark child task by number
            await todoTxt.mark(1);
            const tasks = todoTxt.list();
            const childTask = tasks.find((t) => t.description === "Child task");
            expect(childTask?.completed).toBe(true);
        });
    });
});
