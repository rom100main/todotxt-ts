import { Task, TaskFilter, Priority, ExtensionValue } from "./types";

export class TaskFilters {
    static byContext(context: string): TaskFilter {
        return (task: Task) => task.contexts.includes(context);
    }

    static byContexts(contexts: string[]): TaskFilter {
        return (task: Task) => contexts.some((context) => task.contexts.includes(context));
    }

    static byProject(project: string): TaskFilter {
        return (task: Task) => task.projects.includes(project);
    }

    static byProjects(projects: string[]): TaskFilter {
        return (task: Task) => projects.some((project) => task.projects.includes(project));
    }

    static byPriority(priority: Priority): TaskFilter {
        return (task: Task) => task.priority === priority;
    }

    static byPriorities(priorities: Priority[]): TaskFilter {
        return (task: Task) => (task.priority ? priorities.includes(task.priority) : false);
    }

    static byCompletionStatus(completed: boolean): TaskFilter {
        return (task: Task) => task.completed === completed;
    }

    static byExtensionField(key: string, value?: ExtensionValue): TaskFilter {
        return (task: Task) => {
            if (value === undefined) {
                return key in task.extensions;
            }
            const taskValue = task.extensions[key];
            return taskValue ? taskValue.equals(value) : false;
        };
    }

    static byExtensionFields(extensions: Record<string, ExtensionValue>): TaskFilter {
        return (task: Task) => {
            return Object.entries(extensions).every(([key, value]) => {
                if (value === undefined) {
                    return key in task.extensions;
                }
                const taskValue = task.extensions[key];
                return taskValue ? taskValue.equals(value) : false;
            });
        };
    }

    static completed(): TaskFilter {
        return TaskFilters.byCompletionStatus(true);
    }

    static incomplete(): TaskFilter {
        return TaskFilters.byCompletionStatus(false);
    }

    static hasPriority(): TaskFilter {
        return (task: Task) => task.priority !== undefined;
    }

    static noPriority(): TaskFilter {
        return (task: Task) => task.priority === undefined;
    }

    static hasContext(): TaskFilter {
        return (task: Task) => task.contexts.length > 0;
    }

    static noContext(): TaskFilter {
        return (task: Task) => task.contexts.length === 0;
    }

    static hasProject(): TaskFilter {
        return (task: Task) => task.projects.length > 0;
    }

    static noProject(): TaskFilter {
        return (task: Task) => task.projects.length === 0;
    }

    static createdAfter(date: Date): TaskFilter {
        return (task: Task) => (task.creationDate ? task.creationDate > date : false);
    }

    static createdBefore(date: Date): TaskFilter {
        return (task: Task) => (task.creationDate ? task.creationDate < date : false);
    }

    static createdOn(date: Date): TaskFilter {
        return (task: Task) => {
            if (!task.creationDate) return false;
            return task.creationDate.toDateString() === date.toDateString();
        };
    }

    static completedAfter(date: Date): TaskFilter {
        return (task: Task) => (task.completionDate ? task.completionDate > date : false);
    }

    static completedBefore(date: Date): TaskFilter {
        return (task: Task) => (task.completionDate ? task.completionDate < date : false);
    }

    static completedOn(date: Date): TaskFilter {
        return (task: Task) => {
            if (!task.completionDate) return false;
            return task.completionDate.toDateString() === date.toDateString();
        };
    }

    static and(...filters: TaskFilter[]): TaskFilter {
        return (task: Task) => filters.every((filter) => filter(task));
    }

    static or(...filters: TaskFilter[]): TaskFilter {
        return (task: Task) => filters.some((filter) => filter(task));
    }

    static not(filter: TaskFilter): TaskFilter {
        return (task: Task) => !filter(task);
    }
}
