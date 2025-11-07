/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    TodoTxtError,
    ParseError,
    ExtensionError,
    SerializationError,
    ValidationError,
    DateError,
    PriorityError,
} from "../src/errors";
import { ExtensionHandler } from "../src/extension-handler";
import { TodoTxt } from "../src/index";
import { TodoTxtParser } from "../src/parser";
import { TodoTxtSerializer } from "../src/serializer";
import { StringExtension } from "../src/types";

describe("Custom Error Handling", () => {
    describe("TodoTxtError", () => {
        test("should create base error with message and code", () => {
            const error = new TodoTxtError("Test message", "TEST_CODE");
            expect(error.message).toBe("Test message");
            expect(error.code).toBe("TEST_CODE");
            expect(error.name).toBe("TodoTxtError");
        });

        test("should create base error with only message", () => {
            const error = new TodoTxtError("Test message");
            expect(error.message).toBe("Test message");
            expect(error.code).toBeUndefined();
            expect(error.name).toBe("TodoTxtError");
        });
    });

    describe("ParseError", () => {
        let parser: TodoTxtParser;

        beforeEach(() => {
            parser = new TodoTxtParser();
        });

        test("should create ParseError with line and line number", () => {
            const error = new ParseError("Parse failed", "invalid line", 5);
            expect(error.message).toBe("Parse failed");
            expect(error.line).toBe("invalid line");
            expect(error.lineNumber).toBe(5);
            expect(error.code).toBe("PARSE_ERROR");
            expect(error.name).toBe("ParseError");
        });

        test("should throw ParseError for invalid content type", () => {
            expect(() => parser.parseFile(null as any)).toThrow(ValidationError);
            expect(() => parser.parseFile(undefined as any)).toThrow(ValidationError);
            expect(() => parser.parseFile(123 as any)).toThrow(ValidationError);
        });

        test("should throw ParseError for invalid line type", () => {
            expect(() => parser.parseLine(null as any)).toThrow(ValidationError);
            expect(() => parser.parseLine(undefined as any)).toThrow(ValidationError);
            expect(() => parser.parseLine(123 as any)).toThrow(ValidationError);
        });

        test("should wrap parsing errors with ParseError", () => {
            const invalidLine = "x invalid-date-format task";
            expect(() => parser.parseLine(invalidLine)).not.toThrow();
        });

        test("should provide line context in ParseError", () => {
            const content = "valid task\ninvalid task with bad date 2025-13-01\nanother valid task";
            expect(() => parser.parseFile(content)).not.toThrow();
        });
    });

    describe("ExtensionError", () => {
        let extensionHandler: ExtensionHandler;

        beforeEach(() => {
            extensionHandler = new ExtensionHandler();
        });

        test("should create ExtensionError with extension key", () => {
            const error = new ExtensionError("Extension failed", "testExt");
            expect(error.message).toBe("Extension failed");
            expect(error.extensionKey).toBe("testExt");
            expect(error.code).toBe("EXTENSION_ERROR");
            expect(error.name).toBe("ExtensionError");
        });

        test("should throw ExtensionError for invalid extension object", () => {
            expect(() => extensionHandler.addExtension(null as any)).toThrow(ValidationError);
            expect(() => extensionHandler.addExtension(undefined as any)).toThrow(ValidationError);
            expect(() => extensionHandler.addExtension("invalid" as any)).toThrow(ValidationError);
        });

        test("should throw ExtensionError for extension without key", () => {
            expect(() => extensionHandler.addExtension({} as any)).toThrow(ValidationError);
            expect(() => extensionHandler.addExtension({ key: "" } as any)).toThrow(ValidationError);
            expect(() => extensionHandler.addExtension({ key: "   " } as any)).toThrow(ValidationError);
        });

        test("should throw ExtensionError for duplicate extension key", () => {
            const extension = { key: "test" };
            extensionHandler.addExtension(extension);
            expect(() => extensionHandler.addExtension(extension)).toThrow(ExtensionError);
        });

        test("should throw ExtensionError for non-existent extension removal", () => {
            expect(() => extensionHandler.removeExtension("nonexistent")).toThrow(ExtensionError);
        });

        test("should throw ExtensionError for invalid key type", () => {
            expect(() => extensionHandler.removeExtension(null as any)).toThrow(ValidationError);
            expect(() => extensionHandler.removeExtension(undefined as any)).toThrow(ValidationError);
            expect(() => extensionHandler.removeExtension(123 as any)).toThrow(ValidationError);
        });

        test("should throw ExtensionError for invalid key value", () => {
            expect(() => extensionHandler.removeExtension("")).toThrow(ValidationError);
            expect(() => extensionHandler.removeExtension("   ")).toThrow(ExtensionError);
        });

        test("should wrap parsing function errors", () => {
            const extension = {
                key: "test",
                parsingFunction: () => {
                    throw new Error("Parsing failed");
                },
            };
            extensionHandler.addExtension(extension);
            expect(() => extensionHandler.parseExtensions("test:value")).toThrow(ExtensionError);
        });

        test("should wrap serializing function errors", () => {
            const extension = {
                key: "test",
                serializingFunction: () => {
                    throw new Error("Serializing failed");
                },
            };
            extensionHandler.addExtension(extension);
            expect(() => extensionHandler.serializeExtensions({ test: new StringExtension("value") })).toThrow(
                ExtensionError,
            );
        });
    });

    describe("SerializationError", () => {
        let serializer: TodoTxtSerializer;
        let extensionHandler: ExtensionHandler;

        beforeEach(() => {
            extensionHandler = new ExtensionHandler();
            serializer = new TodoTxtSerializer(extensionHandler);
        });

        test("should create SerializationError with task", () => {
            const task = { description: "test" };
            const error = new SerializationError("Serialization failed", task);
            expect(error.message).toBe("Serialization failed");
            expect(error.task).toBe(task);
            expect(error.code).toBe("SERIALIZATION_ERROR");
            expect(error.name).toBe("SerializationError");
        });

        test("should throw ValidationError for invalid tasks array", () => {
            expect(() => serializer.serializeTasks(null as any)).toThrow(ValidationError);
            expect(() => serializer.serializeTasks(undefined as any)).toThrow(ValidationError);
            expect(() => serializer.serializeTasks("invalid" as any)).toThrow(ValidationError);
            expect(() => serializer.serializeTasks(123 as any)).toThrow(ValidationError);
        });

        test("should throw ValidationError for invalid task object", () => {
            expect(() => serializer.serializeTask(null as any)).toThrow(ValidationError);
            expect(() => serializer.serializeTask(undefined as any)).toThrow(ValidationError);
            expect(() => serializer.serializeTask("invalid" as any)).toThrow(ValidationError);
            expect(() => serializer.serializeTask(123 as any)).toThrow(ValidationError);
        });

        test("should wrap serialization errors with context", () => {
            const invalidTask = {
                description: "test",
                creationDate: new Date("invalid"),
                completed: false,
                projects: [],
                contexts: [],
                extensions: {},
                subtasks: [],
                indentLevel: 0,
                raw: "test",
            };
            expect(() => serializer.serializeTask(invalidTask)).toThrow(SerializationError);
        });

        test("should provide task index context in error", () => {
            const tasks = [
                {
                    description: "valid",
                    completed: false,
                    projects: [],
                    contexts: [],
                    extensions: {},
                    subtasks: [],
                    indentLevel: 0,
                    raw: "valid",
                },
                null as any,
                {
                    description: "valid2",
                    completed: false,
                    projects: [],
                    contexts: [],
                    extensions: {},
                    subtasks: [],
                    indentLevel: 0,
                    raw: "valid2",
                },
            ];
            expect(() => serializer.serializeTasks(tasks)).toThrow(SerializationError);
        });
    });

    describe("ValidationError", () => {
        test("should create ValidationError with field and value", () => {
            const error = new ValidationError("Validation failed", "testField", "testValue");
            expect(error.message).toBe("Validation failed");
            expect(error.field).toBe("testField");
            expect(error.value).toBe("testValue");
            expect(error.code).toBe("VALIDATION_ERROR");
            expect(error.name).toBe("ValidationError");
        });

        test("should create ValidationError with only message", () => {
            const error = new ValidationError("Validation failed");
            expect(error.message).toBe("Validation failed");
            expect(error.field).toBeUndefined();
            expect(error.value).toBeUndefined();
        });
    });

    describe("DateError", () => {
        let serializer: TodoTxtSerializer;
        let extensionHandler: ExtensionHandler;

        beforeEach(() => {
            extensionHandler = new ExtensionHandler();
            serializer = new TodoTxtSerializer(extensionHandler);
        });

        test("should create DateError with date string", () => {
            const error = new DateError("Date error", "2025-13-01");
            expect(error.message).toBe("Date error");
            expect(error.dateStr).toBe("2025-13-01");
            expect(error.code).toBe("DATE_ERROR");
            expect(error.name).toBe("DateError");
        });

        test("should throw DateError for invalid date object", () => {
            const task = {
                description: "test",
                creationDate: new Date("invalid"),
                completed: false,
                projects: [],
                contexts: [],
                extensions: {},
                subtasks: [],
                indentLevel: 0,
                raw: "test",
            };
            expect(() => serializer.serializeTask(task)).toThrow(SerializationError);
        });

        test("should throw DateError for null date", () => {
            const task = {
                description: "test",
                creationDate: null as any,
                completed: false,
                projects: [],
                contexts: [],
                extensions: {},
                subtasks: [],
                indentLevel: 0,
                raw: "test",
            };
            expect(() => serializer.serializeTask(task)).not.toThrow();
        });
    });

    describe("PriorityError", () => {
        test("should create PriorityError with priority", () => {
            const error = new PriorityError("Priority error", "AA");
            expect(error.message).toBe("Priority error");
            expect(error.priority).toBe("AA");
            expect(error.code).toBe("PRIORITY_ERROR");
            expect(error.name).toBe("PriorityError");
        });
    });

    describe("Index Out of Bounds Errors", () => {
        let todoTxt: TodoTxt;

        beforeEach(() => {
            todoTxt = new TodoTxt();
        });

        test("should throw TodoTxtError when removing task with index out of bounds (positive)", async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);

            expect(async () => await todoTxt.remove(5)).rejects.toThrow(TodoTxtError);
            expect(async () => await todoTxt.remove(5)).rejects.toThrow(
                "Index out of bounds: 5. Valid range is 0..2 or -3..-1",
            );
        });

        test("should throw TodoTxtError when removing task with index out of bounds (negative)", async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);

            expect(async () => await todoTxt.remove(-5)).rejects.toThrow(TodoTxtError);
            expect(async () => await todoTxt.remove(-5)).rejects.toThrow(
                "Index out of bounds: -5. Valid range is 0..2 or -3..-1",
            );
        });

        test("should throw TodoTxtError when removing multiple tasks with some indices out of bounds", async () => {
            await todoTxt.add(["Task 1", "Task 2", "Task 3"]);

            expect(async () => await todoTxt.remove([0, 5, -1])).rejects.toThrow(TodoTxtError);
            expect(async () => await todoTxt.remove([0, 5, -1])).rejects.toThrow(
                "Index out of bounds: 5. Valid range is 0..2 or -3..-1",
            );
        });

        test("should throw TodoTxtError when removing from empty todo list", async () => {
            expect(async () => await todoTxt.remove(0)).rejects.toThrow(TodoTxtError);
            expect(async () => await todoTxt.remove(0)).rejects.toThrow(
                "Index out of bounds: 0. Valid range is 0..-1 or -0..-1",
            );
        });

        test("should throw TodoTxtError when marking task with index out of bounds", async () => {
            await todoTxt.add(["Task 1", "Task 2"]);

            expect(async () => await todoTxt.mark(3)).rejects.toThrow(TodoTxtError);
            expect(async () => await todoTxt.mark(3)).rejects.toThrow(
                "Index out of bounds: 3. Valid range is 0..1 or -2..-1",
            );
        });

        test("should throw TodoTxtError when unmarking task with index out of bounds", async () => {
            await todoTxt.add(["Task 1", "Task 2"]);

            expect(async () => await todoTxt.unmark(-3)).rejects.toThrow(TodoTxtError);
            expect(async () => await todoTxt.unmark(-3)).rejects.toThrow(
                "Index out of bounds: -3. Valid range is 0..1 or -2..-1",
            );
        });

        test("should throw TodoTxtError when updating task with index out of bounds", async () => {
            await todoTxt.add(["Task 1", "Task 2"]);

            expect(async () => await todoTxt.update(2, { description: "Updated" })).rejects.toThrow(TodoTxtError);
            expect(async () => await todoTxt.update(2, { description: "Updated" })).rejects.toThrow(
                "Index out of bounds: 2. Valid range is 0..1 or -2..-1",
            );
        });
    });
});
