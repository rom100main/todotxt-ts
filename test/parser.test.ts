import { TodoTxtParser, ExtensionHandler } from "../src/index";
import { Serializable } from "../src/types";

describe("TodoTxtParser", () => {
    let parser: TodoTxtParser;

    beforeEach(() => {
        parser = new TodoTxtParser();
    });

    describe("Basic parsing", () => {
        test("should parse a task with priority", () => {
            const task = parser.parseLine("(A) Task with priority");
            expect(task.priority).toBe("A");
            expect(task.description).toBe("Task with priority");
        });

        test("should parse a task with creation date", () => {
            const task = parser.parseLine("2023-10-24 Task with date");
            expect(task.creationDate).toEqual(new Date(Date.UTC(2023, 9, 24)));
            expect(task.description).toBe("Task with date");
        });

        test("should parse a task with priority and creation date", () => {
            const task = parser.parseLine("(B) 2023-10-24 Task with both");
            expect(task.priority).toBe("B");
            expect(task.creationDate).toEqual(new Date(Date.UTC(2023, 9, 24)));
            expect(task.description).toBe("Task with both");
        });

        test("should parse a completed task", () => {
            const task = parser.parseLine("x Completed task");
            expect(task.completed).toBe(true);
            expect(task.description).toBe("Completed task");
        });

        test("should parse a completed task with a completion date", () => {
            const task = parser.parseLine("x 2023-10-25 Completed task");
            expect(task.completed).toBe(true);
            expect(task.creationDate).toBeUndefined();
            expect(task.completionDate).toEqual(new Date(Date.UTC(2023, 9, 25)));
            expect(task.description).toBe("Completed task");
        });

        test("should parse a completed task with a completion date and a creation date", () => {
            const task = parser.parseLine("x 2023-10-25 2023-10-24 Completed task");
            expect(task.completed).toBe(true);
            expect(task.creationDate).toEqual(new Date(Date.UTC(2023, 9, 24)));
            expect(task.completionDate).toEqual(new Date(Date.UTC(2023, 9, 25)));
            expect(task.description).toBe("Completed task");
        });

        test("should parse a task with projects and contexts", () => {
            const task = parser.parseLine("Task +Project1 +Project2 @context1 @context2");
            expect(task.projects).toEqual(["Project1", "Project2"]);
            expect(task.contexts).toEqual(["context1", "context2"]);
        });
    });

    describe("Subtask parsing", () => {
        test("should parse tasks with subtasks", () => {
            const content = `Main task +Project
    Subtask 1
    Subtask 2
Another task`;

            const tasks = parser.parseFile(content);
            expect(tasks).toHaveLength(2);
            expect(tasks[0].subtasks).toHaveLength(2);
            expect(tasks[0].subtasks[0].description).toBe("Subtask 1");
            expect(tasks[0].subtasks[1].description).toBe("Subtask 2");
        });

        test("should inherit parent properties", () => {
            const content = `(A) Main task +Project @home
    Subtask`;

            const tasks = parser.parseFile(content);
            const subtask = tasks[0].subtasks[0];

            // Subtasks don't inherit priority by default
            expect(subtask.priority).toBeUndefined();
            expect(subtask.projects).toEqual(["Project"]);
            expect(subtask.contexts).toEqual(["home"]);
        });
    });

    describe("Extension parsing", () => {
        test("should parse extensions with both parser and serializer", () => {
            let extensionHandler = new ExtensionHandler();
            extensionHandler.addExtension({
                key: "estimate",
                parsingFunction: (value: string): number => {
                    if (value.endsWith("h")) {
                        return parseInt(value.slice(0, -1));
                    }
                    return parseInt(value);
                },
                serializingFunction: (value: Serializable) => `${value}h`,
                inherit: false,
            });
            parser = new TodoTxtParser({ extensionHandler: extensionHandler });

            const task = parser.parseLine("Task estimate:2h");
            expect(task.extensions.estimate).toBe(2); // 2 hours
        });
    });

    describe("Default extension type parsing", () => {
        test("should parse integers by default", () => {
            const task = parser.parseLine("Task priority:5 count:10 level:-3");
            expect(task.extensions.priority).toBe(5);
            expect(task.extensions.count).toBe(10);
            expect(task.extensions.level).toBe(-3);
            expect(typeof task.extensions.priority).toBe("number");
            expect(typeof task.extensions.count).toBe("number");
            expect(typeof task.extensions.level).toBe("number");
        });

        test("should parse floats by default", () => {
            const task = parser.parseLine("Task rating:4.5 temperature:-2.3 weight:0.75");
            expect(task.extensions.rating).toBe(4.5);
            expect(task.extensions.temperature).toBe(-2.3);
            expect(task.extensions.weight).toBe(0.75);
            expect(typeof task.extensions.rating).toBe("number");
            expect(typeof task.extensions.temperature).toBe("number");
            expect(typeof task.extensions.weight).toBe("number");
        });

        test("should handle mixed numeric types", () => {
            const task = parser.parseLine("Task int:42 float:3.14 text:hello date:2023-10-25");
            expect(task.extensions.int).toBe(42);
            expect(task.extensions.float).toBe(3.14);
            expect(task.extensions.text).toBe("hello");
            expect(task.extensions.date).toEqual(new Date(Date.UTC(2023, 9, 25)));
        });
    });

    describe("Extension inheritance", () => {
        test("should inherit extensions when inherit=true", () => {
            const extensionHandler = new ExtensionHandler();
            extensionHandler.addExtension({
                key: "due",
                inherit: true,
            });

            const customParser = new TodoTxtParser({ extensionHandler });
            const content = `Parent task due:2023-10-25
    Child task`;

            const tasks = customParser.parseFile(content);
            const child = tasks[0].subtasks[0];

            expect(child.extensions.due).toEqual(new Date(Date.UTC(2023, 9, 25)));
        });

        test("should not inherit extensions when inherit=false", () => {
            const extensionHandler = new ExtensionHandler();
            extensionHandler.addExtension({
                key: "inProgress",
                inherit: false,
            });

            const customParser = new TodoTxtParser({ extensionHandler });
            const content = `Parent task inProgress:yes
    Child task`;

            const tasks = customParser.parseFile(content);
            const child = tasks[0].subtasks[0];

            expect(child.extensions.inProgress).toBeUndefined();
        });

        test("should shadow parent values when shadow=true", () => {
            const extensionHandler = new ExtensionHandler();
            extensionHandler.addExtension({
                key: "due",
                inherit: true,
                shadow: true,
            });

            const customParser = new TodoTxtParser({ extensionHandler });
            const content = `Parent task due:2023-10-25
    Child task due:2023-10-24`;

            const tasks = customParser.parseFile(content);
            const child = tasks[0].subtasks[0];

            expect(child.extensions.due).toEqual(new Date(Date.UTC(2023, 9, 24)));
        });

        test("should merge values when shadow=false", () => {
            const extensionHandler = new ExtensionHandler();
            extensionHandler.addExtension({
                key: "tags",
                inherit: true,
                shadow: false,
            });

            const customParser = new TodoTxtParser({ extensionHandler });
            const content = `Parent task tags:cooking
    Child task tags:cookie`;

            const tasks = customParser.parseFile(content);
            const child = tasks[0].subtasks[0];

            expect(child.extensions.tags).toEqual(["cooking", "cookie"]);
        });
    });
});
