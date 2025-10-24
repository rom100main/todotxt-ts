import { TodoTxtExtension, TaskExtensions, Task, Serializable } from "./types";
import { ListUtils, DateUtils } from "./utils";

export class ExtensionHandler {
    private extensions = new Map<string, TodoTxtExtension>();

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

    parseExtensions(text: string, parent?: Task): TaskExtensions {
        const extensions: TaskExtensions = {};

        // Inherit from parent if exists
        if (parent) {
            for (const [key, value] of Object.entries(parent.extensions)) {
                const extension = this.getExtension(key);

                // Default behavior: inherit if no extension defined
                if (!extension) {
                    extensions[key] = value;
                    continue;
                }

                if (extension.inherit === false) {
                    continue;
                }

                // inherit is true (or undefined, defaults to true)
                // shadow logic will be handled when parsing current extensions
                extensions[key] = value;
            }
        }

        // Parse current task extensions and apply inheritance/shadow logic
        const extensionRegex = /(\w+):([^\s]+)/g;
        let match;

        while ((match = extensionRegex.exec(text)) !== null) {
            const [, key, value] = match;
            const extension = this.getExtension(key);

            const parsedValue = extension?.parsingFunction
                ? extension.parsingFunction(value)
                : this.parseValueByType(value);

            if (extension) {
                if (extension.inherit === false) {
                    extensions[key] = parsedValue;
                } else if (extension.shadow) {
                    extensions[key] = parsedValue;
                } else {
                    // merge with parent using list logic
                    const parentValue = extensions[key];
                    if (parentValue !== undefined) {
                        if (Array.isArray(parentValue) || Array.isArray(parsedValue)) {
                            const parentList = Array.isArray(parentValue) ? parentValue : [parentValue];
                            const currentList = Array.isArray(parsedValue) ? parsedValue : [parsedValue];
                            const mergedList = [...parentList, ...currentList].filter(
                                (item, index, self) => self.indexOf(item) === index,
                            );
                            extensions[key] = mergedList.length === 1 ? mergedList[0] : mergedList;
                        } else {
                            // Both are single values, create list
                            const mergedList = [parentValue, parsedValue].filter(
                                (item, index, self) => self.indexOf(item) === index,
                            );
                            extensions[key] = mergedList.length === 1 ? mergedList[0] : mergedList;
                        }
                    } else {
                        // No parent value, just use current
                        extensions[key] = parsedValue;
                    }
                }
            } else {
                // No extension definition, just overwrite
                extensions[key] = parsedValue;
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
                    serializedValue = this.serializeValueByType(value);
                }

                parts.push(`${key}:${serializedValue}`);
            }
        }

        return parts;
    }

    private parseValueByType(value: string): Serializable {
        if (DateUtils.isDate(value)) {
            return DateUtils.parseDate(value);
        }

        const lower = value.toLowerCase();
        if (lower === "true" || lower === "false") {
            return lower === "true";
        }
        if (lower === "yes" || lower === "no") {
            return lower === "yes";
        }
        if (lower === "y" || lower === "n") {
            return lower === "y";
        }
        if (lower === "on" || lower === "off") {
            return lower === "on";
        }

        if (/^-?\d+$/.test(value)) {
            return parseInt(value, 10);
        }

        if (/^-?\d*\.\d+$/.test(value)) {
            return parseFloat(value);
        }

        if (value.includes(",")) {
            return ListUtils.parseList(value);
        }

        return value;
    }

    private serializeValueByType(value: Serializable): string {
        if (value instanceof Date) {
            return DateUtils.formatDate(value);
        }

        if (Array.isArray(value)) {
            return ListUtils.serializeList(value);
        }

        return value.toString();
    }

    getAllExtensions(): TodoTxtExtension[] {
        return Array.from(this.extensions.values());
    }
}
