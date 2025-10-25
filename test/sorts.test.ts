import { TaskSorts } from "../src/sorts";
import { Task, NumberExtension, StringExtension } from "../src/types";

describe("TaskSorts", () => {
    const task1: Task = {
        raw: "(A) 2023-01-01 Task A +project1 @context1 n:1",
        completed: false,
        priority: "A",
        creationDate: new Date("2023-01-01"),
        description: "Task A +project1 @context1 n:1",
        projects: ["project1"],
        contexts: ["context1"],
        extensions: { n: new NumberExtension(1) },
        subtasks: [],
        indentLevel: 0,
    };

    const task2: Task = {
        raw: "x (B) 2023-01-03 2023-01-02 Task B +project2 @context2 n:2 custom:value",
        completed: true,
        priority: "B",
        creationDate: new Date("2023-01-02"),
        completionDate: new Date("2023-01-03"),
        description: "Task B +project2 @context2 n:2 custom:value",
        projects: ["project2"],
        contexts: ["context2"],
        extensions: { n: new NumberExtension(2), custom: new StringExtension("value") },
        subtasks: [],
        indentLevel: 0,
    };

    describe("byPriority", () => {
        test("should sort by priority ASC", () => {
            const sorter = TaskSorts.byPriority("ASC");
            expect(sorter(task1, task2)).toBeLessThan(0);
            expect(sorter(task2, task1)).toBeGreaterThan(0);
        });

        test("should sort by priority DESC", () => {
            const sorter = TaskSorts.byPriority("DESC");
            expect(sorter(task1, task2)).toBeGreaterThan(0);
            expect(sorter(task2, task1)).toBeLessThan(0);
        });
    });

    describe("byDateCreated", () => {
        test("should sort by creation date ASC", () => {
            const sorter = TaskSorts.byDateCreated("ASC");
            expect(sorter(task1, task2)).toBeLessThan(0);
            expect(sorter(task2, task1)).toBeGreaterThan(0);
        });

        test("should sort by creation date DESC", () => {
            const sorter = TaskSorts.byDateCreated("DESC");
            expect(sorter(task1, task2)).toBeGreaterThan(0);
            expect(sorter(task2, task1)).toBeLessThan(0);
        });
    });

    describe("byDateCompleted", () => {
        test("should sort by completion date ASC", () => {
            const sorter = TaskSorts.byDateCompleted("ASC");
            expect(sorter(task1, task2)).toBeGreaterThan(0); // task1 has no completion date
            expect(sorter(task2, task1)).toBeLessThan(0);
        });

        test("should sort by completion date DESC", () => {
            const sorter = TaskSorts.byDateCompleted("DESC");
            expect(sorter(task1, task2)).toBeLessThan(0);
            expect(sorter(task2, task1)).toBeGreaterThan(0);
        });
    });

    describe("byContext", () => {
        test("should sort by context ASC", () => {
            const sorter = TaskSorts.byContext("ASC");
            expect(sorter(task1, task2)).toBeLessThan(0);
            expect(sorter(task2, task1)).toBeGreaterThan(0);
        });

        test("should sort by context DESC", () => {
            const sorter = TaskSorts.byContext("DESC");
            expect(sorter(task1, task2)).toBeGreaterThan(0);
            expect(sorter(task2, task1)).toBeLessThan(0);
        });
    });

    describe("byProject", () => {
        test("should sort by project ASC", () => {
            const sorter = TaskSorts.byProject("ASC");
            expect(sorter(task1, task2)).toBeLessThan(0);
            expect(sorter(task2, task1)).toBeGreaterThan(0);
        });

        test("should sort by project DESC", () => {
            const sorter = TaskSorts.byProject("DESC");
            expect(sorter(task1, task2)).toBeGreaterThan(0);
            expect(sorter(task2, task1)).toBeLessThan(0);
        });
    });

    describe("byExtensionField", () => {
        test("should sort by extension field ASC", () => {
            const sorter = TaskSorts.byExtensionField("custom", "ASC");
            expect(sorter(task1, task2)).toBeGreaterThan(0); // task1 has no extension, task2 has "value"
            expect(sorter(task2, task1)).toBeLessThan(0);
        });

        test("should sort by extension field DESC", () => {
            const sorter = TaskSorts.byExtensionField("custom", "DESC");
            expect(sorter(task1, task2)).toBeLessThan(0); // task1 has no extension, should come first in DESC
            expect(sorter(task2, task1)).toBeGreaterThan(0);
        });
    });

    describe("byCompletionStatus", () => {
        test("should sort by completion status ASC", () => {
            const sorter = TaskSorts.byCompletionStatus("ASC");
            expect(sorter(task1, task2)).toBeLessThan(0); // false (0) vs true (1)
            expect(sorter(task2, task1)).toBeGreaterThan(0);
        });

        test("should sort by completion status DESC", () => {
            const sorter = TaskSorts.byCompletionStatus("DESC");
            expect(sorter(task1, task2)).toBeGreaterThan(0);
            expect(sorter(task2, task1)).toBeLessThan(0);
        });
    });

    describe("composite", () => {
        test("should combine multiple sorters", () => {
            const sorter = TaskSorts.composite(TaskSorts.byCompletionStatus("ASC"), TaskSorts.byPriority("ASC"));
            // First by completion status, then by priority
            expect(sorter(task1, task2)).toBeLessThan(0);
        });
    });

    describe("then", () => {
        test("should chain two sorters", () => {
            const sorter = TaskSorts.then(TaskSorts.byCompletionStatus("ASC"), TaskSorts.byPriority("ASC"));
            expect(sorter(task1, task2)).toBeLessThan(0);
        });
    });
});
