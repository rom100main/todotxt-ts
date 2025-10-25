import { TodoTxtParser, ExtensionHandler } from "../src/index";
import { ExtensionValue, NumberExtension } from "../src/types";

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
                parsingFunction: (value: string): NumberExtension => {
                    let numValue: number;
                    if (value.endsWith("h")) {
                        numValue = parseInt(value.slice(0, -1));
                    } else {
                        numValue = parseInt(value);
                    }
                    return new NumberExtension(numValue);
                },
                serializingFunction: (value: ExtensionValue) => `${value}h`,
                inherit: false,
            });
            parser = new TodoTxtParser({ extensionHandler: extensionHandler });

            const task = parser.parseLine("Task estimate:2h");
            expect(task.extensions.estimate.value).toBe(2); // 2 hours
        });
    });

    describe("Default extension type parsing", () => {
        test("should parse strings by default", () => {
            const task = parser.parseLine("Task name:Romain");
            expect(task.extensions.name.value).toBe("Romain");
            expect(typeof task.extensions.name.value).toBe("string");
        });

        test("should parse integers by default", () => {
            const task = parser.parseLine("Task priority:5 count:10 level:-3");
            expect(task.extensions.priority.value).toBe(5);
            expect(task.extensions.count.value).toBe(10);
            expect(task.extensions.level.value).toBe(-3);
            expect(typeof task.extensions.priority.value).toBe("number");
            expect(typeof task.extensions.count.value).toBe("number");
            expect(typeof task.extensions.level.value).toBe("number");
        });

        test("should parse floats by default", () => {
            const task = parser.parseLine("Task rating:4.5 temperature:-2.3 weight:0.75");
            expect(task.extensions.rating.value).toBe(4.5);
            expect(task.extensions.temperature.value).toBe(-2.3);
            expect(task.extensions.weight.value).toBe(0.75);
            expect(typeof task.extensions.rating.value).toBe("number");
            expect(typeof task.extensions.temperature.value).toBe("number");
            expect(typeof task.extensions.weight.value).toBe("number");
        });

        test("should parse booleans by default", () => {
            const task = parser.parseLine("Task true:true false:false yes:yes no:no y:y n:n on:on off:off");
            expect(task.extensions.true.value).toBe(true);
            expect(task.extensions.false.value).toBe(false);
            expect(task.extensions.yes.value).toBe(true);
            expect(task.extensions.no.value).toBe(false);
            expect(task.extensions.y.value).toBe(true);
            expect(task.extensions.n.value).toBe(false);
            expect(task.extensions.on.value).toBe(true);
            expect(task.extensions.off.value).toBe(false);
            expect(typeof task.extensions.true.value).toBe("boolean");
            expect(typeof task.extensions.false.value).toBe("boolean");
            expect(typeof task.extensions.yes.value).toBe("boolean");
            expect(typeof task.extensions.no.value).toBe("boolean");
            expect(typeof task.extensions.y.value).toBe("boolean");
            expect(typeof task.extensions.n.value).toBe("boolean");
            expect(typeof task.extensions.on.value).toBe("boolean");
            expect(typeof task.extensions.off.value).toBe("boolean");
        });

        test("should parse dates by default", () => {
            const task = parser.parseLine("Task due:2023-10-25 start:2023-01-01 end:2023-12-31");
            expect(task.extensions.due.value).toEqual(new Date(Date.UTC(2023, 9, 25)));
            expect(task.extensions.start.value).toEqual(new Date(Date.UTC(2023, 0, 1)));
            expect(task.extensions.end.value).toEqual(new Date(Date.UTC(2023, 11, 31)));
            expect(task.extensions.due.value instanceof Date).toBe(true);
            expect(task.extensions.start.value instanceof Date).toBe(true);
            expect(task.extensions.end.value instanceof Date).toBe(true);
        });

        test("should parse lists by default", () => {
            const task = parser.parseLine("Task tags:home,work,urgent numbers:1,2,3 letters:a,b,c");
            expect(Array.isArray(task.extensions.tags.value)).toBe(true);
            expect(task.extensions.tags.value.map((item: ExtensionValue) => item.value)).toEqual([
                "home",
                "work",
                "urgent",
            ]);
            expect(Array.isArray(task.extensions.numbers.value)).toBe(true);
            expect(task.extensions.numbers.value.map((item: ExtensionValue) => item.value)).toEqual([1, 2, 3]);
            expect(Array.isArray(task.extensions.letters.value)).toBe(true);
            expect(task.extensions.letters.value.map((item: ExtensionValue) => item.value)).toEqual(["a", "b", "c"]);
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

            expect(child.extensions.due.value).toEqual(new Date(Date.UTC(2023, 9, 25)));
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

            expect(child.extensions.due.value).toEqual(new Date(Date.UTC(2023, 9, 24)));
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

            expect(child.extensions.tags.value.map((item: ExtensionValue) => item.value)).toEqual([
                "cooking",
                "cookie",
            ]);
        });
    });
});
