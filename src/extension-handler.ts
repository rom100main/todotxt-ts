import { TodoTxtExtension, TaskExtensions } from "./types";

export class ExtensionHandler {
    private extensions: Map<string, TodoTxtExtension> = new Map();

    constructor(extensions: TodoTxtExtension[] = []) {
        extensions.forEach((ext) => this.addExtension(ext));
    }

    addExtension(extension: TodoTxtExtension): void {
        this.extensions.set(extension.key.toLowerCase(), extension);
    }

    removeExtension(key: string): boolean {
        return this.extensions.delete(key.toLowerCase());
    }

    hasExtension(key: string): boolean {
        return this.extensions.has(key.toLowerCase());
    }

    getExtension(key: string): TodoTxtExtension | undefined {
        return this.extensions.get(key.toLowerCase());
    }

    parseExtensions(
        text: string,
        parentExtensions?: TaskExtensions,
    ): TaskExtensions {
        const extensions: TaskExtensions = { ...parentExtensions };
        const extensionRegex = /(\w+):([^\s]+)/g;
        let match;

        while ((match = extensionRegex.exec(text)) !== null) {
            const [, key, value] = match;
            const extension = this.getExtension(key);

            if (extension) {
                const parsedValue = extension.parsingFunction
                    ? extension.parsingFunction(value)
                    : value;

                extensions[key] = parsedValue;
            } else {
                extensions[key] = value;
            }
        }

        return extensions;
    }

    serializeExtensions(extensions: TaskExtensions): string[] {
        const parts: string[] = [];

        for (const [key, value] of Object.entries(extensions)) {
            if (value !== undefined && value !== null) {
                const extension = this.getExtension(key);
                let serializedValue: string;

                if (extension && extension.serializingFunction) {
                    serializedValue = extension.serializingFunction(value);
                } else {
                    // Default type conversion to string
                    if (value instanceof Date) {
                        const year = value.getFullYear();
                        const month = String(value.getMonth() + 1).padStart(
                            2,
                            "0",
                        );
                        const day = String(value.getDate()).padStart(2, "0");
                        serializedValue = `${year}-${month}-${day}`;
                    } else {
                        serializedValue = String(value);
                    }
                }

                parts.push(`${key}:${serializedValue}`);
            }
        }

        return parts;
    }

    getAllExtensions(): TodoTxtExtension[] {
        return Array.from(this.extensions.values());
    }
}
