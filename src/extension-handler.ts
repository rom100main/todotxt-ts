import { TodoTxtExtension, TaskExtensions, Task } from "./types";
import { ListUtils, DateUtils } from "./utils";

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
                        if (ListUtils.isList(parentValue) || ListUtils.isList(parsedValue)) {
                            const parentList = ListUtils.isList(parentValue) ? parentValue : [parentValue];
                            const currentList = ListUtils.isList(parsedValue) ? parsedValue : [parsedValue];
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

    private parseValueByType(value: string): any {
        if (DateUtils.isDate(value)) {
            return DateUtils.parseDate(value);
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

    private serializeValueByType(value: any): string {
        if (value instanceof Date) {
            return DateUtils.formatDate(value);
        }

        if (ListUtils.isList(value)) {
            return ListUtils.serializeList(value);
        }

        if (value != null && typeof (value as any).toString === "function") {
            try {
                const str = (value as any).toString();
                if (typeof str === "string") {
                    return str;
                }
            } catch {
                // If toString throws, fall through to fallback
            }
        }

        return String(value);
    }

    getAllExtensions(): TodoTxtExtension[] {
        return Array.from(this.extensions.values());
    }
}
