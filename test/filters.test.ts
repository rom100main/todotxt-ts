import { TaskFilters } from "../src/filters";
import { Task, DateExtension } from "../src/types";

describe("TaskFilters", () => {
    const mockTask: Task = {
        raw: "(A) 2023-01-01 Test task +project @context due:2023-12-31",
        completed: false,
        priority: "A",
        creationDate: new Date("2023-01-01"),
        description: "Test task +project @context due:2023-12-31",
        projects: ["project"],
        contexts: ["context"],
        extensions: { due: new DateExtension(new Date("2023-12-31")) },
        subtasks: [],
        indentLevel: 0,
    };

    describe("byContext", () => {
        test("should filter tasks by context", () => {
            const filter = TaskFilters.byContext("context");
            expect(filter(mockTask)).toBe(true);
            expect(filter({ ...mockTask, contexts: [] })).toBe(false);
        });
    });

    describe("byProject", () => {
        test("should filter tasks by project", () => {
            const filter = TaskFilters.byProject("project");
            expect(filter(mockTask)).toBe(true);
            expect(filter({ ...mockTask, projects: [] })).toBe(false);
        });
    });

    describe("byPriority", () => {
        test("should filter tasks by priority", () => {
            const filter = TaskFilters.byPriority("A");
            expect(filter(mockTask)).toBe(true);
            expect(filter({ ...mockTask, priority: "B" })).toBe(false);
        });
    });

    describe("byCompletionStatus", () => {
        test("should filter tasks by completion status", () => {
            const completedFilter = TaskFilters.byCompletionStatus(true);
            expect(completedFilter(mockTask)).toBe(false);
            expect(completedFilter({ ...mockTask, completed: true })).toBe(true);
        });
    });

    describe("byExtensionField", () => {
        test("should filter tasks by extension field", () => {
            const filter = TaskFilters.byExtensionField("due", new DateExtension(new Date("2023-12-31")));
            expect(filter(mockTask)).toBe(true);
            expect(filter({ ...mockTask, extensions: {} })).toBe(false);
        });

        test("should filter tasks by extension field existence", () => {
            const filter = TaskFilters.byExtensionField("due");
            expect(filter(mockTask)).toBe(true);
            expect(filter({ ...mockTask, extensions: {} })).toBe(false);
        });
    });

    describe("Logical operators", () => {
        test("should combine filters with AND", () => {
            const filter = TaskFilters.and(TaskFilters.byContext("context"), TaskFilters.byProject("project"));
            expect(filter(mockTask)).toBe(true);
            expect(filter({ ...mockTask, contexts: [] })).toBe(false);
        });

        test("should combine filters with OR", () => {
            const filter = TaskFilters.or(TaskFilters.byContext("context"), TaskFilters.byContext("other"));
            expect(filter(mockTask)).toBe(true);
            expect(filter({ ...mockTask, contexts: ["other"] })).toBe(true);
            expect(filter({ ...mockTask, contexts: [] })).toBe(false);
        });

        test("should negate a filter", () => {
            const filter = TaskFilters.not(TaskFilters.byContext("context"));
            expect(filter(mockTask)).toBe(false);
            expect(filter({ ...mockTask, contexts: [] })).toBe(true);
        });
    });
});
