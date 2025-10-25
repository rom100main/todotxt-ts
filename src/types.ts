import { ExtensionError } from "./errors";
import { ExtensionHandler } from "./extension-handler";

export type Priority =
    | "A"
    | "B"
    | "C"
    | "D"
    | "E"
    | "F"
    | "G"
    | "H"
    | "I"
    | "J"
    | "K"
    | "L"
    | "M"
    | "N"
    | "O"
    | "P"
    | "Q"
    | "R"
    | "S"
    | "T"
    | "U"
    | "V"
    | "W"
    | "X"
    | "Y"
    | "Z";

export interface ExtensionValue {
    toString(): string;
    equals(other: ExtensionValue): boolean;
    compareTo(other: ExtensionValue): number;
    value: any; //eslint-disable-line @typescript-eslint/no-explicit-any
}

export class DateExtension implements ExtensionValue {
    constructor(public value: Date) {}

    toString(): string {
        return this.value.toISOString().split("T")[0];
    }

    equals(other: ExtensionValue): boolean {
        if (!(other instanceof DateExtension)) {
            return false;
        }
        return this.value.getTime() === other.value.getTime();
    }

    compareTo(other: ExtensionValue): number {
        if (!(other instanceof DateExtension)) {
            throw new ExtensionError("Cannot compare DateExtension with non-DateExtension", "");
        }
        return this.value.getTime() - other.value.getTime();
    }
}

export class BooleanExtension implements ExtensionValue {
    constructor(public value: boolean) {}

    toString(): string {
        return this.value.toString();
    }

    equals(other: ExtensionValue): boolean {
        if (!(other instanceof BooleanExtension)) {
            return false;
        }
        return this.value === other.value;
    }

    compareTo(other: ExtensionValue): number {
        if (!(other instanceof BooleanExtension)) {
            throw new ExtensionError("Cannot compare BooleanExtension with non-BooleanExtension", "");
        }
        return Number(this.value) - Number(other.value);
    }
}

export class NumberExtension implements ExtensionValue {
    constructor(public value: number) {}

    toString(): string {
        return this.value.toString();
    }

    equals(other: ExtensionValue): boolean {
        if (!(other instanceof NumberExtension)) {
            return false;
        }
        return this.value === other.value;
    }

    compareTo(other: ExtensionValue): number {
        if (!(other instanceof NumberExtension)) {
            throw new ExtensionError("Cannot compare NumberExtension with non-NumberExtension", "");
        }
        return this.value - other.value;
    }
}

export class StringExtension implements ExtensionValue {
    constructor(public value: string) {}

    toString(): string {
        return this.value;
    }

    equals(other: ExtensionValue): boolean {
        return this.value.toString() === other.value.toString();
    }

    compareTo(other: ExtensionValue): number {
        return this.value.toString().localeCompare(other.value.toString());
    }
}

export class ArrayExtension implements ExtensionValue {
    constructor(public value: ExtensionValue[]) {}

    toString(): string {
        return this.value.map((v) => v.toString()).join(",");
    }

    equals(other: ExtensionValue): boolean {
        return this.value.toString() === other.value.toString();
    }

    compareTo(other: ExtensionValue): number {
        return this.value.toString().localeCompare(other.value.toString());
    }
}

export interface TodoTxtExtension<T extends ExtensionValue = ExtensionValue> {
    key: string;
    parsingFunction?: (value: string) => T;
    serializingFunction?: (value: T) => string;
    inherit?: boolean;
    shadow?: boolean;
}

export type TaskExtensions = Record<string, ExtensionValue>;

export interface Task {
    raw: string;
    completed: boolean;
    priority?: Priority;
    creationDate?: Date;
    completionDate?: Date;
    description: string;
    projects: string[];
    contexts: string[];
    extensions: TaskExtensions;
    subtasks: Task[];
    indentLevel: number;
    parent?: Task;
}

export interface TodoOptions {
    filePath?: string;
    autoSave?: boolean;
    extensions?: TodoTxtExtension[];
    handleSubtasks?: boolean;
}

export type TaskFilter = (task: Task) => boolean;
export type TaskSorter = (a: Task, b: Task) => number;

export interface ParseOptions {
    extensionHandler?: ExtensionHandler;
    handleSubtasks?: boolean;
}

export interface SaveOptions {
    includeSubtasks?: boolean;
    preserveIndentation?: boolean;
}
