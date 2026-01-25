# Message-Oriented Testing Framework

## Overview
This project is a TypeScript-based framework for testing and emulating TCP message-based systems. It provides abstractions for message handling, orchestrated test execution, and emulation of TCP endpoints, enabling robust integration and scenario testing without external dependencies.

## Components

### Message Abstractions
- `Message`, `Header`, and `Body` interfaces define the structure for all messages exchanged in the system. Messages are composed of a header (metadata) and a body (payload).
- `MessageSender` and `MessageReceiver` interfaces abstract sending and receiving logic, allowing for flexible implementations.
- `TimedReceiver` provides a mechanism to wait for a specific number of messages or until a timeout, supporting polling-based response collection.

### TCP Layer
- `TcpConnection` (abstract) manages buffering and message extraction for TCP streams, delegating message parsing to a `TcpReceiver`.
- `TcpReceiver` interface defines how to extract and process messages from raw TCP data.
- `TcpClient` and `TcpServer` provide concrete implementations for client and server endpoints.

### Test Framework
- `Test`, `TestDefinition`, and `TestResult` define the structure and lifecycle of tests, including result aggregation and error handling.
- `Tests` class allows grouping multiple tests and controlling execution flow based on failure policies.
- `Step`, `StepDefinition`, and `MessageTest` enable scenario-based testing, where each step can send requests, wait for responses, and verify outcomes.

### Reporting
- `reportResult` and related functions aggregate and print test results, including hierarchical breakdowns and summary statistics.

### Emulation
- `Emulator`, `ClientEmulator`, and `SutConnection` simulate TCP endpoints, translating between raw TCP buffers and high-level messages.
- Emulators are used to mimic both client and server behavior for integration and protocol testing.

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
The framework is designed for extension at multiple levels:
- **Message Types**: Add new message formats by extending the `Message` interface and implementing custom senders/receivers.
- **TCP Protocols**: Implement new `TcpReceiver` logic for different framing or protocol requirements.
- **Test Scenarios**: Author new scenario files (see `src-example/scenarios.ts`) to cover additional workflows or edge cases.
- **Reporting**: Integrate with external reporting tools by extending or replacing the `reportResult` logic.
- **Emulators**: Create new emulator classes to simulate more complex endpoint behaviors or multi-protocol environments.

## Example - src-example
The `src-example` directory demonstrates how to use the framework to emulate endpoints and run scenario-based tests:

**main.ts**
- Sets up two client emulators (`EM1`, `EM2`) and a SUT (system under test) TCP server.
- Loads a test suite from `scenarios.ts` and executes it, printing results via the reporting module.

**scenarios.ts**
- Defines message-based test cases and steps, including requests, expected responses, and failure modes.
- Demonstrates both passing and failing scenarios, as well as timeout handling.

**emulator.ts**
- Implements the logic for translating between TCP buffers and high-level messages.
- Shows how to wire emulators to orchestrators and connections.

## Orchestration
The `Orchestrator` class coordinates message sending and response collection across emulators and test steps. It manages sender/receiver registration and provides the main interface for executing test scenarios.

## Design Decisions
- **Polling for Responses**: Chosen for simplicity and reliability in asynchronous environments. Timeout precision is traded for reduced complexity.
- **Code-Defined Scenarios**: Enables maximum flexibility for developers, but may limit accessibility for non-developers.
- **Local Emulation**: Avoids external dependencies, ensuring tests are fast and reproducible.

## Future Improvements
- Add support for configuration-driven test scenarios (YAML/JSON).
- Enhance error reporting and diagnostics.
- Integrate with CI/CD pipelines for automated test execution.
- Support for more complex protocol emulation (multi-step handshakes, stateful endpoints).

## Glossary
- **Emulator**: Simulates a TCP endpoint, translating between raw buffers and structured messages.
- **Orchestrator**: Coordinates message flow and test execution.
- **Step**: A single test action, including requests, expected responses, and verification logic.
- **Test Suite**: A collection of steps and tests executed together.
