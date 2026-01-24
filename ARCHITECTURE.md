# Architecture & Design Document

## Overview
This project is a TypeScript-based framework for testing and emulating TCP message-based systems. It provides abstractions for message handling, orchestrated test execution, and emulation of TCP endpoints, enabling robust integration and scenario testing without external dependencies.

## Major Components

### 1. Core Logic (`src/`)
- **msg.ts**: Defines the `Message` structure and related types.
- **msg-receiver.ts**: Implements `TimedReceiver` and `Orchestrator` for receiving and coordinating message flows, including timeout and response counting logic.
- **tcp.ts**: Handles TCP server and connection abstractions, including graceful and forced shutdowns.
- **test-msg-step.ts**: Defines `Step` and `StepDefinition` for atomic test actions, supporting expected response counts and timeouts.
- **test.ts**: Provides the `Test`, `TestResult`, and `Tests` abstractions for composing and running test suites.

### 2. Utilities & Emulation (`snip/`)
- **x-emulator.ts, x-tcp-msg.ts, x-tcp-utils.ts**: Helpers for constructing, parsing, and emulating TCP messages and endpoints.

### 3. Test Scenarios (`test/`)
- **scenarios.ts**: Defines test scenarios as sequences of steps, using the abstractions from `src/`.
- **main.ts**: Entrypoint for running test scenarios.
- **emulator.ts**: Emulation scripts for integration testing.

## Data Flow
1. Test scenarios are defined as sequences of `Step` objects, each specifying request messages, expected response count, and timeout.
2. The `Orchestrator` sends requests and waits for responses using a polling mechanism with a timeout.
3. Responses are verified against test cases, and results are aggregated.
4. Emulators simulate TCP endpoints, enabling end-to-end testing without real network dependencies.

## Use Cases
- **Integration Testing**: Validate message flows and system behavior by simulating real-world TCP interactions.
- **Protocol Emulation**: Test client/server logic against emulated endpoints for robustness.
- **Regression Testing**: Automate scenario-based tests to catch protocol or logic regressions.
- **Development Debugging**: Run emulators and test steps interactively to debug message handling.

## Caveats & Limitations
- **Timeout Precision**: The polling-based timeout in `TimedReceiver` may exceed the specified timeout by up to the polling interval (default 50ms).
- **Error Handling**: Minimal error reporting; failures may not always provide actionable diagnostics.
- **Test Authoring**: Scenarios are code-defined; non-developers may find it hard to author or modify tests.
- **No Built-in CI**: No continuous integration or automated test reporting out of the box.
- **No External Service Integration**: All emulation is local; not suitable for tests requiring real external systems.

## Extensibility
- Add new message types in `src/msg.ts` and corresponding utilities in `snip/`.
- Define new test scenarios in `test/scenarios.ts` using the `Step` and `Tests` abstractions.
- Extend emulation logic in `snip/x-emulator.ts` or `test/emulator.ts` for new protocols or behaviors.

## Example Workflow
1. Add a new scenario in `test/scenarios.ts`.
2. Run `tsc` to build the project.
3. Execute tests with `node test/main.js`.
4. Review results and debug using emulators as needed.

---
For further details, see: `src/test.ts`, `src/msg-receiver.ts`, `test/scenarios.ts`, `snip/x-emulator.ts`.
