export class TodoTxtError extends Error {
    constructor(
        message: string,
        public readonly code?: string,
    ) {
        super(message);
        this.name = "TodoTxtError";
    }
}

export class ParseError extends TodoTxtError {
    constructor(
        message: string,
        public readonly line?: string,
        public readonly lineNumber?: number,
    ) {
        super(message, "PARSE_ERROR");
        this.name = "ParseError";
    }
}

export class ExtensionError extends TodoTxtError {
    constructor(
        message: string,
        public readonly extensionKey?: string,
    ) {
        super(message, "EXTENSION_ERROR");
        this.name = "ExtensionError";
    }
}

export class SerializationError extends TodoTxtError {
    constructor(
        message: string,
        public readonly task?: unknown,
    ) {
        super(message, "SERIALIZATION_ERROR");
        this.name = "SerializationError";
    }
}

export class ValidationError extends TodoTxtError {
    constructor(
        message: string,
        public readonly field?: string,
        public readonly value?: unknown,
    ) {
        super(message, "VALIDATION_ERROR");
        this.name = "ValidationError";
    }
}

export class DateError extends TodoTxtError {
    constructor(
        message: string,
        public readonly dateStr?: string,
    ) {
        super(message, "DATE_ERROR");
        this.name = "DateError";
    }
}

export class PriorityError extends TodoTxtError {
    constructor(
        message: string,
        public readonly priority?: string,
    ) {
        super(message, "PRIORITY_ERROR");
        this.name = "PriorityError";
    }
}
