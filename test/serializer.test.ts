import { TodoTxtParser, TodoTxtSerializer, ExtensionHandler } from "../src/index";
import { ExtensionValue, NumberExtension } from "../src/types";

describe("TodoTxtSerializer", () => {
    let parser: TodoTxtParser;
    let serializer: TodoTxtSerializer;
    let extensionHandler: ExtensionHandler;

    beforeEach(() => {
        extensionHandler = new ExtensionHandler();
        parser = new TodoTxtParser({ extensionHandler });
        serializer = new TodoTxtSerializer(extensionHandler);
    });

    test("should serialize a simple task", () => {
        const task = parser.parseLine("Simple task");
        const serialized = serializer.serializeTasks([task]);
        expect(serialized).toBe("Simple task");
    });

    test("should serialize a task with priority", () => {
        const task = parser.parseLine("(A) Task with priority");
        const serialized = serializer.serializeTasks([task]);
        expect(serialized).toBe("(A) Task with priority");
    });

    test("should serialize a task with creation date", () => {
        const task = parser.parseLine("2023-10-24 Task with date");
        const serialized = serializer.serializeTasks([task]);
        expect(serialized).toBe("2023-10-24 Task with date");
    });

    test("should serialize a completed task", () => {
        const task = parser.parseLine("x 2023-10-24 Completed task");
        const serialized = serializer.serializeTasks([task]);
        expect(serialized).toBe("x 2023-10-24 Completed task");
    });

    test("should auto serialize a task with extensions", () => {
        const task = parser.parseLine("Task due:2023-10-25 new:true n:1 f:0.1 l:1,2,3");
        const serialized = serializer.serializeTasks([task]);
        expect(serialized).toBe("Task due:2023-10-25 new:true n:1 f:0.1 l:1,2,3");
    });

    test("should serialize extensions with custom serializer", () => {
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

        const task = parser.parseLine("Task estimate:2h");
        const serialized = serializer.serializeTasks([task]);
        expect(serialized).toBe("Task estimate:2h");
    });

    test("should serialize tasks with subtasks", () => {
        const content = `Main task
    Subtask 1
    Subtask 2`;

        const tasks = parser.parseFile(content);
        const serialized = serializer.serializeTasks(tasks);

        const expected = `Main task
Subtask 1
Subtask 2`;
        expect(serialized).toBe(expected);
    });
});
