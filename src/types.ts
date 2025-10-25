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

export interface Serializable {
    toString(): string;
}

export interface TodoTxtExtension<T extends Serializable = Serializable> {
    key: string;
    parsingFunction?: (value: string) => T;
    serializingFunction?: (value: T) => string;
    inherit?: boolean;
    shadow?: boolean;
}

export type TaskExtensions = Record<string, Serializable>;

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
