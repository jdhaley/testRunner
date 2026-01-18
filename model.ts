import express from "express";

// ----------------------------
// Domain models
// ----------------------------

export type Payload = Record<string, any>;

export interface Message {
  name: string;
  payload: Payload;
}

export interface ExpectedResponse {
  name: string;
  timeoutMs: number;
  validator: (msg: Message) => boolean;
}

export interface Step {
  outboundMessages: Message[];
  expectedResponses: ExpectedResponse[];
  verifications?: ((messages: Message[]) => boolean)[];
}

export interface Scenario {
  name: string;
  steps: Step[];
}

export interface TestResult {
  successes: string[];
  failures: string[];
}

// ----------------------------
// Infrastructure abstractions
// ----------------------------

class MessageBus {
  private listeners: ((msg: Message) => void)[] = [];

  subscribe(cb: (msg: Message) => void) {
    this.listeners.push(cb);
  }

  emit(msg: Message) {
    for (const cb of this.listeners) {
      cb(msg);
    }
  }
}

class SUT {
  async start(): Promise<void> {}
  async stop(): Promise<void> {}

  async send(msg: Message): Promise<void> {
    // send message to DLPS
  }
}

// ----------------------------
// Scenario Orchestrator
// ----------------------------

class ScenarioOrchestrator {
  private results: TestResult = { successes: [], failures: [] };

  constructor(private sut: SUT, private bus: MessageBus) {}

  async run(scenarios: Scenario[]): Promise<TestResult> {
    await this.sut.start();

    try {
      for (const scenario of scenarios) {
        await this.runScenario(scenario);
      }
    } finally {
      await this.sut.stop();
    }

    return this.results;
  }

  private async runScenario(scenario: Scenario) {
    for (let stepIndex = 0; stepIndex < scenario.steps.length; stepIndex++) {
      const step = scenario.steps[stepIndex];
      const failuresBefore = this.results.failures.length;
      const received: Message[] = [];

      this.bus.subscribe((msg) => received.push(msg));

      // 5. Send outbound messages
      for (const msg of step.outboundMessages) {
        await this.sut.send(msg);
      }

      // 6–8. Await expected responses
      for (const expected of step.expectedResponses) {
        await this.awaitResponse(expected, received, scenario.name, stepIndex);
      }

      // 9. Run verifications
      if (step.verifications) {
        for (const verify of step.verifications) {
          try {
            if (verify(received)) {
              this.results.successes.push(
                `${scenario.name} step ${stepIndex}: verification passed`
              );
            } else {
              this.results.failures.push(
                `${scenario.name} step ${stepIndex}: verification failed`
              );
            }
          } catch (err) {
            this.results.failures.push(
              `${scenario.name} step ${stepIndex}: verification error`
            );
          }
        }
      }

      // 10. Stop scenario on step failure
      if (this.results.failures.length > failuresBefore) {
        break;
      }
    }
  }

  private async awaitResponse(
    expected: ExpectedResponse,
    received: Message[],
    scenarioName: string,
    stepIndex: number
  ) {
    const deadline = Date.now() + expected.timeoutMs;

    while (Date.now() < deadline) {
      for (const msg of received) {
        if (msg.name === expected.name && expected.validator(msg)) {
          this.results.successes.push(
            `${scenarioName} step ${stepIndex}: received ${expected.name}`
          );
          return;
        }
      }
      await new Promise((r) => setTimeout(r, 50));
    }

    this.results.failures.push(
      `${scenarioName} step ${stepIndex}: timeout waiting for ${expected.name}`
    );
  }
}

// ----------------------------
// Express trigger (CI/CD entry)
// ----------------------------

const app = express();
app.use(express.json());

const sut = new SUT();
const bus = new MessageBus();
const orchestrator = new ScenarioOrchestrator(sut, bus);

app.post("/run", async (req, res) => {
  const scenarios: Scenario[] = req.body.scenarios;
  const results = await orchestrator.run(scenarios);
  res.json(results);
});

app.listen(3000);
