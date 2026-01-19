import { Emulator, Message, Receiver, Scenario, Step, Test, TestResult } from "./model";

// ----------------------------
// Scenario Orchestrator
// ----------------------------

/**
 * A Receiver that waits until a specific number of messages has been received 
 * or a timeout threshold has been reached.
 */
class TimedReceiver implements Receiver {
    private responses?: Message[];

    receive(response: Message): void {
        this.responses?.push(response)
    }
    start() {
        this.responses = [];
    }
    async waitForResponses(responseCount: number, timeout: number) {
        if (this.responses) throw new Error("waiting on responses without a corresponding start()")
        this.responses = [];
        
        const responses = this.responses;
        const start = Date.now();
        while (responses.length < responseCount && (Date.now() - start) < timeout) {
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
        delete this.responses;
        return responses;
    }
}

export class TestOrchestrator {
    constructor(private emulators: Record<string, Emulator>, private defaultTimeout: number) {
    }
    private receiver = new TimedReceiver();

    async run(scenarios: Scenario[]): Promise<TestResult[]> {
        const results: TestResult[] = []
        for (const scenario of scenarios) {
            let result: TestResult;
            try {
                 result = await this.runScenario(scenario);
            } catch (error) {
                result = {
                    test: scenario,
                    resultType: "Fail",
                    failure: "" + error
                }
            }
            results.push(result);
        }
        return results;
    }

    private async runScenario(scenario: Scenario): Promise<TestResult> {
        const results: TestResult[] = [];
        let failed: boolean = false;
        for (let step of scenario.steps) {
            const result = await this.runStep(step);
            results.push(result);
            if (result.resultType === "Fail") {
                failed = true;
                if (step.onFailure === "stop") break;
            }
        }
        return {
            test: scenario,
            resultType: failed ? "Fail" : "Pass",
            childResults: results
        }
    }
    private async runStep(step: Step): Promise<TestResult> {
        this.receiver.start();
        for (let request of step.messages) {
            const emulator = this.emulators[request.emulatorName];
            if (emulator) emulator.send(request);
        }
        // Wait until we have enough responses or timeout
        const timeout = step.timeout || this.defaultTimeout
        const responses = await this.receiver.waitForResponses(step.responseCount, timeout);
        const results = await step.test(responses);
        if (results) return results;
        throw new Error(`Step ${step.name} didn't return any results`);
    }
}