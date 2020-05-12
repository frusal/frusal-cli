# CLI script to manage frusal.com workspace access library

Provides statically typed access to the data and schema at frusal.com workspace.

🚧 *The project is in development and is not available for general public yet.*

*Facilitates usage of [browser][br], [node][no] or [flexible][fl] frusal libraries. Follow one of those links to see some code examples, or see the tutorials listed below.*

## Overview

Frusal CLI script has two basic functions:

1. Initially configures your project through the wizard style interactive UI
2. Continuously updates local declarations to match online workspace schema

This would enable your application to access frusal.com workspace data and schema (class structure). Both can be changed through the API with type validation.

An IDE like [Visual Studio Code] would use our live declarations to performs source code static analysis, type validation and auto completion (IntelliSense).

The CLI could be ran in _watch_ mode, which would update the declarations live.

## Prerequisites

- Installed [Node.js], which includes `npm` and `npx` command line tools.
- A project using `package.json` to manage its dependencies.

## First Launch

Run in your project directory:

```txt
npx frusal
```

On the first run, frusal CLI takes you though interactive configuration wizard which results in `frusal.json` file creation. Further adjustments are to be done by editing this file directly.

*Some tutorials referenced below, shows examples of the actual UI in use.*

## Configuration

Once logged on, your access token is stored in a `.npm-frusal` file typically located in your home directory. Though, the file location is first searched up the directory ancestry which allows to override the default location. For instance, it can be added to your source control system.

The other set of parameters required to generate stubs and declarations is stored in `frusal.json`. This file is in your project root, next to package.json. It is initially created on the first run of this CLI, and maintained by directly editing it. The up-to-date set of options could be found in the source code [here](./src/config.ts).

## Usage

Common parameters to the CLI are `status`, `login`, `update`, `watch` and `help`.

The most important parameter calls to create the actual declarations and stubs (concrete classes to add custom logic in):

```txt
npx frusal update
```

The up-to-date parameter list and functions could be found in the source code [here](./src/main.ts).

## Tutorials

- [Angular Tutorial]
- [React Tutorial]
- [Node.js Tutorial]

## Notes

You can access frusal.com workspace by using the library directly. This CLI and declarations it generates is just a convenience which helps to produce better quality code, quicker.

This npm package can be used as a node library itself. It is convenient for use in scripts, like database or schema population scripts. See this usage [example](https://github.com/frusal/frusal-example-schema-by-javascript#readme).

[Visual Studio Code]: https://code.visualstudio.com/
[Node.js]: https://nodejs.org/
[Angular Tutorial]: https://github.com/frusal/frusal-tutorial-angular#readme
[React Tutorial]: https://github.com/frusal/frusal-tutorial-react#readme
[Node.js Tutorial]: https://github.com/frusal/frusal-tutorial-node#readme

[br]: https://www.npmjs.com/package/@frusal/library-for-browser
[no]: https://www.npmjs.com/package/@frusal/library-for-node
[fl]: https://www.npmjs.com/package/@frusal/library
