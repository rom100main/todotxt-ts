import { TodoTxtParser, TodoTxtExtension } from '../src/index';

describe('TodoTxtParser', () => {
  let parser: TodoTxtParser;

  beforeEach(() => {
    parser = new TodoTxtParser();
  });

  describe('Basic parsing', () => {
    test('should parse a simple task', () => {
      const task = parser.parseLine('Simple task');
      expect(task.description).toBe('Simple task');
      expect(task.completed).toBe(false);
      expect(task.priority).toBeUndefined();
      expect(task.projects).toEqual([]);
      expect(task.contexts).toEqual([]);
    });

    test('should parse a task with priority', () => {
      const task = parser.parseLine('(A) Task with priority');
      expect(task.priority).toBe('A');
      expect(task.description).toBe('Task with priority');
    });

    test('should parse a task with creation date', () => {
      const task = parser.parseLine('2023-10-24 Task with date');
      expect(task.creationDate).toEqual(new Date(2023, 9, 24));
      expect(task.description).toBe('Task with date');
    });

    test('should parse a task with priority and creation date', () => {
      const task = parser.parseLine('(B) 2023-10-24 Task with both');
      expect(task.priority).toBe('B');
      expect(task.creationDate).toEqual(new Date(2023, 9, 24));
      expect(task.description).toBe('Task with both');
    });

    test('should parse a completed task', () => {
      const task = parser.parseLine('x 2023-10-24 Completed task');
      expect(task.completed).toBe(true);
      expect(task.completionDate).toEqual(new Date(2023, 9, 24));
      expect(task.description).toBe('Completed task');
    });

    test('should parse a task with projects and contexts', () => {
      const task = parser.parseLine('Task +Project1 +Project2 @context1 @context2');
      expect(task.projects).toEqual(['Project1', 'Project2']);
      expect(task.contexts).toEqual(['context1', 'context2']);
    });
  });

  describe('Extension parsing', () => {
    test('should parse extensions without custom parser', () => {
      const task = parser.parseLine('Task due:2023-10-25 priority:high');
      expect(task.extensions).toEqual({
        due: '2023-10-25',
        priority: 'high'
      });
    });

    test('should parse extensions with custom parser', () => {
      parser.addExtension({
        key: 'due',
        parsingFunction: (value: string) => new Date(value),
        inheritShadow: false
      });

      const task = parser.parseLine('Task due:2023-10-25');
      expect(task.extensions.due).toBeInstanceOf(Date);
      expect(task.extensions.due.getFullYear()).toBe(2023);
      expect(task.extensions.due.getMonth()).toBe(9);
      expect(task.extensions.due.getDate()).toBe(25);
    });

    test('should parse extensions with both parser and serializer', () => {
      parser.addExtension({
        key: 'estimate',
        parsingFunction: (value: string) => {
          if (value.endsWith('h')) {
            return parseInt(value.slice(0, -1)); // Return hours
          }
          if (value.endsWith('m')) {
            return parseInt(value.slice(0, -1)) / 60; // Convert minutes to hours
          }
          return parseInt(value);
        },
        serializingFunction: (hours: number) => `${hours}h`,
        inheritShadow: false
      });

      const task = parser.parseLine('Task estimate:2h');
      expect(task.extensions.estimate).toBe(2); // 2 hours
    });
  });

  describe('Subtask parsing', () => {
    test('should parse tasks with subtasks', () => {
      const content = `Main task +Project
    Subtask 1
    Subtask 2
Another task`;

      const tasks = parser.parseFile(content);
      expect(tasks).toHaveLength(2);
      expect(tasks[0].subtasks).toHaveLength(2);
      expect(tasks[0].subtasks[0].description).toBe('Subtask 1');
      expect(tasks[0].subtasks[1].description).toBe('Subtask 2');
    });

    test('should inherit parent properties', () => {
      const content = `(A) Main task +Project @home due:2023-10-25
    Subtask`;

      const tasks = parser.parseFile(content);
      const subtask = tasks[0].subtasks[0];
      
      // Subtasks don't inherit priority by default
      expect(subtask.priority).toBeUndefined();
      expect(subtask.projects).toEqual(['Project']);
      expect(subtask.contexts).toEqual(['home']);
      expect(subtask.extensions.due).toBe('2023-10-25');
    });
  });

  describe('File parsing', () => {
    test('should parse multiple lines', () => {
      const content = `(A) Task 1
Task 2
x 2023-10-24 Completed task`;

      const tasks = parser.parseFile(content);
      expect(tasks).toHaveLength(3);
      expect(tasks[0].priority).toBe('A');
      expect(tasks[1].description).toBe('Task 2');
      expect(tasks[2].completed).toBe(true);
    });
  });
});