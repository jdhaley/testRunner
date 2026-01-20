import { Scenario, Step, TestResult } from "./model";
import { Orchestrator } from "./orchestrator";

export class Tester {
    constructor(private orchestrator: Orchestrator) {
    }

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
        const responses = await this.orchestrator.exec(step.messages, step.responseCount, step.timeout);
        const results = await step.test(responses);
        if (results) return results;

        throw new Error(`Step ${step.name} didn't return any results`);
    }
}