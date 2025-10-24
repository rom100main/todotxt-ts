# Todo.txt TypeScript Parser

A comprehensive TypeScript parser for todo.txt format files with extension support and subtask handling.

## Features

- Parse and serialize todo.txt format (priorities, dates, projects, contexts)
- Custom key:value extensions with automatic type parsing
- Subtask support with indentation-based hierarchy
- Property inheritance from parent to subtasks
- Extension inheritance control (inherit, shadow)
- Full TypeScript support

## Installation

```bash
npm install todotxt-ts
```

## Quick Start

```typescript
import { TodoTxt, TodoTxtExtension } from 'todotxt-ts';

const todo = new TodoTxt({
  extensions: [
    {
      key: 'due',
      parsingFunction: (value: string) => new Date(value),
      serializingFunction: (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      },
      inherit: true,
      shadow: true
    }
  ]
});

const content = `(A) 2023-10-24 Call Mom +Family @phone due:2023-10-25
    Schedule follow-up call
(B) Schedule Goodwill pickup +GarageSale @phone`;

const tasks = todo.parse(content);
console.log(tasks);

const serialized = todo.serialize(tasks);
console.log(serialized);
```

## API Reference

### TodoTxt

Main class for parsing and serializing todo.txt content.

#### Constructor

```typescript
new TodoTxt(options?: TodoOptions)

interface TodoOptions {
    extensions?: TodoTxtExtension[];  // List of extensions
    handleSubtasks?: boolean;         // Handle subtasks (default: true)
}
```

#### Methods

- `parse(content: string): Task[]` - Parse todo.txt content into tasks
- `parseLine(line: string): Task` - Parse a single line into a task
- `serialize(tasks: Task[], options?: SaveOptions): string` - Serialize tasks back to todo.txt format
- `addExtension(extension: TodoTxtExtension): void` - Add a custom extension
- `removeExtension(key: string): boolean` - Remove an extension

### Task Interface

```typescript
interface Task {
  raw: string;                 // Original line
  completed: boolean;          // Task completion status
  priority?: Priority;         // A-Z priority
  creationDate?: Date;         // Task creation date
  completionDate?: Date;       // Task completion date
  description: string;         // Task description
  projects: string[];          // +project tags
  contexts: string[];          // @context tags
  extensions: TaskExtensions;  // Custom extensions
  subtasks: Task[];            // Nested subtasks
  indentLevel: number;         // Indentation level
  parent?: Task;               // Parent task reference
}
```

### TodoTxtExtension

```typescript
interface interface TodoTxtExtension<T extends Serializable = Serializable> {
  key: string;                                 // Extension key (e.g., 'due')
  parsingFunction?: (value: string) => T;      // Custom parser
  serializingFunction?: (value: T) => string;  // Custom serializer
  inherit?: boolean;                           // Inherit by subtasks (default: true)
  shadow?: boolean;                            // Override parent value (default: false)
}

interface Serializable {
    toString(): string;
}
```

## Subtask Support

The parser supports subtasks using indentation:

```txt
Main task +Project @home due:2023-10-25
    Subtask 1  // Inherits +Project, @home, and due:2023-10-25
    Subtask 2  // Inherits parent properties
        Nested subtask
```

## Save Options

```typescript
interface SaveOptions {
  includeSubtasks?: boolean;      // Include subtasks in output (default: true)
  preserveIndentation?: boolean;  // Keep original indentation (default: true)
}
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## License

MIT
