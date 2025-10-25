import { Task, TaskSorter } from "./types";

export type SortDirection = "ASC" | "DESC";

export class TaskSorts {
    private static reverseSort(sorter: TaskSorter): TaskSorter {
        return (a: Task, b: Task) => sorter(b, a);
    }

    static byContext(direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            const aContexts = a.contexts.join(",").toLowerCase();
            const bContexts = b.contexts.join(",").toLowerCase();
            return aContexts.localeCompare(bContexts);
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static byProject(direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            const aProjects = a.projects.join(",").toLowerCase();
            const bProjects = b.projects.join(",").toLowerCase();
            return aProjects.localeCompare(bProjects);
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static byDateCreated(direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            if (!a.creationDate && !b.creationDate) return 0;
            if (!a.creationDate) return 1;
            if (!b.creationDate) return -1;
            return a.creationDate.getTime() - b.creationDate.getTime();
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static byDateCompleted(direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            if (!a.completionDate && !b.completionDate) return 0;
            if (!a.completionDate) return 1;
            if (!b.completionDate) return -1;
            return a.completionDate.getTime() - b.completionDate.getTime();
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static byPriority(direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            if (!a.priority && !b.priority) return 0;
            if (!a.priority) return 1;
            if (!b.priority) return -1;
            return a.priority.localeCompare(b.priority);
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static byExtensionField(key: string, direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            const aValue = a.extensions[key];
            const bValue = b.extensions[key];
            if (!aValue && !bValue) return 0;
            if (!aValue) return 1;
            if (!bValue) return -1;
            return aValue.compareTo(bValue);
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static byDescription(direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            return a.description.toLowerCase().localeCompare(b.description.toLowerCase());
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static byCompletionStatus(direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            return Number(a.completed) - Number(b.completed);
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static byIndentLevel(direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            return a.indentLevel - b.indentLevel;
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static byRaw(direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            return a.raw.toLowerCase().localeCompare(b.raw.toLowerCase());
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static byContextCount(direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            return a.contexts.length - b.contexts.length;
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static byProjectCount(direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            return a.projects.length - b.projects.length;
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static bySubtaskCount(direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            return a.subtasks.length - b.subtasks.length;
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static byExtensionCount(direction: SortDirection = "ASC"): TaskSorter {
        const sorter = (a: Task, b: Task) => {
            return Object.keys(a.extensions).length - Object.keys(b.extensions).length;
        };
        return direction === "DESC" ? TaskSorts.reverseSort(sorter) : sorter;
    }

    static composite(...sorters: TaskSorter[]): TaskSorter {
        return (a: Task, b: Task) => {
            for (const sorter of sorters) {
                const result = sorter(a, b);
                if (result !== 0) return result;
            }
            return 0;
        };
    }

    static then(primary: TaskSorter, secondary: TaskSorter): TaskSorter {
        return TaskSorts.composite(primary, secondary);
    }
}
