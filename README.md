# Todo.txt TypeScript Parser

A comprehensive TypeScript parser for todo.txt format files with extension support and subtask handling.

## Features

- Parse and serialize todo.txt format (priorities, dates, projects, contexts)
- Custom key:value extensions with automatic parsing and typing
- Subtask support with indentation-based hierarchy
- Task management utils (add, remove, update, mark/unmark)
- Full TypeScript support
- Property inheritance from parent to subtasks with configurable inheritance control
- Standalone TodoTxtParser and TodoTxtSerializer classes
- Built-in task filters and sorting functions
- Comprehensive error handling with specific error types

## Installation

```bash
npm install todotxt-ts
```

## Quick Start

```typescript
import { TodoTxt, TodoTxtExtension, DateExtension } from "todotxt-ts";

const todo = new TodoTxt({
    extensions: [
        // auto-parse extension "due" with auto-typing to date,
        {
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
        },
    ],
    filePath: "todo.txt",
    autoSave: true,
});

// Load existing tasks
await todo.load();

// Add new tasks
await todo.add("(A) 2023-10-24 Call Mom +Family @phone due:2023-10-25 estimate:1h");
await todo.add(["    Schedule follow-up call", "(B) Schedule Goodwill pickup +GarageSale @phone"]);

// List tasks with filters and sorting
const tasks = todo.list(TaskFilters.incomplete(), TaskSorts.byPriority("ASC"));

// Mark task as complete
await todo.mark(0);

// Update task
await todo.update(0, { priority: "B" });

// Save changes
await todo.save();
```

## API Reference

### TodoTxt

Main class for parsing and serializing todo.txt content.

#### Constructor

```typescript
new TodoTxt(options?: TodoOptions)

interface TodoOptions {
    filePath?: string;                // File path for load/save (default: "todo.txt")
    autoSave?: boolean;               // Auto-save after changes (default: false)
    extensions?: TodoTxtExtension[];  // List of extensions
    handleSubtasks?: boolean;         // Handle subtasks (default: true)
}
```

#### Methods

```typescript
load(filePath?: string): Promise<void>;                             // Load tasks from file
save(filePath?: string): Promise<void>;                             // Save tasks to file
list(filter?: TaskFilter, sorter?: TaskSorter): Task[];             // Get filtered/sorted tasks
add(taskInputs: string | string[] | Task | Task[]): Promise<void>;  // Add new tasks
insert(index: number, taskInput: string | Task): Promise<void>;     // Insert task at position
remove(numbers: number | number[]): Promise<void>;                  // Remove tasks by index
mark(numbers: number | number[]): Promise<void>;                    // Mark tasks as complete
unmark(numbers: number | number[]): Promise<void>;                  // Mark tasks as incomplete
update(index: number, values: Partial<Task>): Promise<void>;        // Update task properties
setAutoSave(autoSave: boolean): void;                               // Enable/disable auto-save
```

### Task Interface

```typescript
interface Task {
    raw: string;                // Original line
    completed: boolean;         // Task completion status
    priority?: Priority;        // A-Z priority
    creationDate?: Date;        // Task creation date
    completionDate?: Date;      // Task completion date
    description: string;        // Task description
    projects: string[];         // +project tags
    contexts: string[];         // @context tags
    extensions: TaskExtensions; // Custom extensions
    subtasks: Task[];           // Nested subtasks
    indentLevel: number;        // Indentation level
    parent?: Task;              // Parent task reference
}
```

### TodoTxtExtension

```typescript
interface TodoTxtExtension<T extends ExtensionValue = ExtensionValue> {
    key: string;                                 // Extension key (e.g., 'due')
    parsingFunction?: (value: string) => T;      // Custom parser
    serializingFunction?: (value: T) => string;  // Custom serializer
    inherit?: boolean;                           // Inherit by subtasks (default: true)
    shadow?: boolean;                            // Override parent value (default: false)
}

interface ExtensionValue {
    toString(): string;
    equals(other: ExtensionValue): boolean;
    compareTo(other: ExtensionValue): number;
    value: any;
}
```

**Auto-detection and parsing**:  
Extensions are automatically detected from `key:value` patterns in task text.  
When no `parsingFunction` is provided, the parser attempts automatic type detection:
- Date-like strings -> `DateExtension`
- Numbers -> `NumberExtension`
- "true"/"false" -> `BooleanExtension`
- Comma-separated values -> `ArrayExtension`
- Everything else -> `StringExtension`

#### Extension Types

```typescript
DateExtension;     // Date values with ISO string serialization
StringExtension;   // String values
NumberExtension;   // Numeric values with comparison
BooleanExtension;  // Boolean values
ArrayExtension;    // Arrays of ExtensionValue objects
```

### Task Filters

```typescript
import { TaskFilters } from "todotxt-ts";

// Basic filters
TaskFilters.completed();         // Completed tasks
TaskFilters.incomplete();        // Incomplete tasks
TaskFilters.byPriority("A");     // Tasks with priority A
TaskFilters.byProject("Work");   // Tasks in project Work
TaskFilters.byContext("@home");  // Tasks with context home

// Date filters
TaskFilters.createdAfter(new Date("2023-10-01"));
TaskFilters.completedOn(new Date("2023-10-25"));

// Extension filters
TaskFilters.byExtensionField("due", new DateExtension(new Date()));

// Logical combinations
TaskFilters.and(TaskFilters.incomplete(), TaskFilters.byProject("Work"));
TaskFilters.or(TaskFilters.byPriority("A"), TaskFilters.byPriority("B"));
```

### Task Sorting

```typescript
import { TaskSorts, SortDirection } from "todotxt-ts";

// Basic sorting
TaskSorts.byPriority("ASC");      // By priority (A-Z)
TaskSorts.byDateCreated("DESC");  // By creation date
TaskSorts.byDescription("ASC");   // By description

// Advanced sorting
TaskSorts.byExtensionField("due");  // By extension value
TaskSorts.bySubtaskCount("DESC");   // By number of subtasks

// Composite sorting
TaskSorts.composite(TaskSorts.byCompletionStatus("ASC"), TaskSorts.byPriority("ASC"), TaskSorts.byDateCreated("DESC"));
```

### TodoTxtParser

Independent parser for converting todo.txt text to Task objects. Can be used standalone without the full TodoTxt class.

```typescript
import { TodoTxtParser, ExtensionHandler } from "todotxt-ts";

const parser = new TodoTxtParser({
    extensionHandler: new ExtensionHandler(),
    handleSubtasks: true,
});

// Parse single line
const task = parser.parseLine("(A) Call Mom +Family @phone due:2023-10-25");

// Parse full file content
const tasks = parser.parseFile(fileContent);
```

#### Methods

```typescript
parseLine(line: string): Task;       // Parse a single line into a Task
parseFile(content: string): Task[];  // Parse multi-line content into Task array
```

### TodoTxtSerializer

Independent serializer for converting Task objects back to todo.txt format. Can be used standalone without the full TodoTxt class.

```typescript
import { TodoTxtSerializer, ExtensionHandler } from "todotxt-ts";

const serializer = new TodoTxtSerializer(new ExtensionHandler());

// Serialize single task
const line = serializer.serializeTask(task);

// Serialize task array
const content = serializer.serializeTasks(tasks);
```

#### Methods

```typescript
serializeTask(task: Task): string;      // Convert single Task to todo.txt line
serializeTasks(tasks: Task[]): string;  // Convert Task array to multi-line content
```

### Error Handling

The library provides specific error types for different scenarios:

```typescript
TodoTxtError;        // Base error class
ParseError;          // Parsing related errors
ExtensionError;      // Extension processing errors
SerializationError;  // Serialization errors
ValidationError;     // Data validation errors
DateError;           // Date parsing errors
PriorityError;       // Priority validation errors
```

## Support

For bug reports and feature requests, please fill an issue at [GitHub repository](https://github.com/rom100main/todotxt-ts/issues).

## Changelog

See [CHANGELOG](CHANGELOG.md) for a list of changes in each version.

## Development

For development information, see [CONTRIBUTING](CONTRIBUTING.md).

## License

MIT
