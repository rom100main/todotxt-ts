import { TodoTxt, TodoTxtExtension } from '../src/index';

describe('TodoTxtSerializer', () => {
  let todo: TodoTxt;

  beforeEach(() => {
    todo = new TodoTxt();
  });

  test('should serialize a simple task', () => {
    const task = todo.parseLine('Simple task');
    const serialized = todo.serialize([task]);
    expect(serialized).toBe('Simple task');
  });

  test('should serialize a task with priority', () => {
    const task = todo.parseLine('(A) Task with priority');
    const serialized = todo.serialize([task]);
    expect(serialized).toBe('(A) Task with priority');
  });

  test('should serialize a task with creation date', () => {
    const task = todo.parseLine('2023-10-24 Task with date');
    const serialized = todo.serialize([task]);
    expect(serialized).toBe('2023-10-24 Task with date');
  });

  test('should serialize a completed task', () => {
    const task = todo.parseLine('x 2023-10-24 Completed task');
    const serialized = todo.serialize([task]);
    expect(serialized).toBe('x 2023-10-24 Completed task');
  });

  test('should serialize a task with extensions', () => {
    todo.addExtension({
      key: 'due',
      parsingFunction: (value: string) => new Date(value),
      inheritShadow: false
    });

    const task = todo.parseLine('Task due:2023-10-25');
    const serialized = todo.serialize([task]);
    expect(serialized).toBe('Task due:2023-10-25');
  });

  test('should serialize extensions with custom serializer', () => {
    todo.addExtension({
      key: 'estimate',
      parsingFunction: (value: string) => parseInt(value),
      serializingFunction: (value: number) => `${value}h`,
      inheritShadow: false
    });

    const task = todo.parseLine('Task estimate:2');
    const serialized = todo.serialize([task]);
    expect(serialized).toBe('Task estimate:2h');
  });

  test('should serialize tasks with subtasks', () => {
    const content = `Main task
    Subtask 1
    Subtask 2`;

    const tasks = todo.parse(content);
    const serialized = todo.serialize(tasks, { 
      includeSubtasks: true, 
      preserveIndentation: true 
    });

    const expected = `Main task
Subtask 1
Subtask 2`;
    expect(serialized).toBe(expected);
  });
});