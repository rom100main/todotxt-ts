# Contributing

We welcome contributions! Here's how you can get involved:

## Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Project Guidelines

- Use TypeScript with strict type checking
- Follow the existing code style
- Add JSDoc comments for public methods
- Run linter before committing (`npm run lint:fix`)
- Write clear, descriptive commit messages, use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) style

## Testing

Before submitting a pull request, please ensure that:

1. The project builds without errors (`npm run build`)
2. You run the linter and fix any issues (`npm run lint`)
3. All tests pass (`npm test`)
4. The code follows the project guidelines
5. New functionality includes appropriate tests

## Development Setup

### Prerequisites

- Node.js
- npm
- Git

### Installation

1. Install dependencies:
    ```bash
    npm install
    ```

### Development Workflow

1. Start the development server:

    ```bash
    npm run dev
    ```

2. Make changes to the source code in the `src/` directory.

3. The project will be automatically compiled.

## Project Structure

```
todotxt-ts/
├── src/                      # Source code
│   ├── errors.ts             # Error classes
│   ├── extension-handler.ts  # Extension processing
│   ├── filters.ts            # Task filtering functions
│   ├── index.ts              # Main exports
│   ├── parser.ts             # Todo.txt parser
│   ├── serializer.ts         # Todo.txt serializer
│   ├── sorts.ts              # Task sorting functions
│   ├── task.ts               # Task interface and utilities
│   ├── types.ts              # TypeScript type definitions
│   └── utils.ts              # Utility functions
├── test/                     # Test files
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation
```

## Architecture

### Core Components

1. **TodoTxt** (`src/index.ts`): Main class that provides the high-level API for parsing, serializing, and managing todo.txt files.

2. **TodoTxtParser** (`src/parser.ts`): Handles parsing of todo.txt format into Task objects.

3. **TodoTxtSerializer** (`src/serializer.ts`): Converts Task objects back to todo.txt format.

4. **ExtensionHandler** (`src/extension-handler.ts`): Manages custom key:value extensions with automatic parsing and serialization.

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.
