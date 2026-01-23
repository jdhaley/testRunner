import { Message } from "./msg";
import { Orchestrator } from "./msg-receiver";
import { getResultType, Test, TestDefinition, TestResult, NOT_APPLICABLE } from "./test";

export interface StepDefinition extends TestDefinition {
    responseCount: number;
    timeout?: number;
    requestMessages: Message[];
    testCases: Test<Message[]>[];
}

export class Step implements Test<void> {
    constructor(
        public definition: StepDefinition,
        private orchestrator: Orchestrator
    ) {}
    async test(): Promise<TestResult> {
        const startTime = Date.now();
        const responses = await this.orchestrator.exec(
            this.definition.requestMessages,
            this.definition.responseCount,
            this.definition.timeout
        );
        return this.verify(responses, startTime)
    }
    async verify(responses: Message[], startTime: number): Promise<TestResult> {
        const results: TestResult[] = []
        for (let test of this.definition.testCases) {
            const result = await test.test(responses);
            if (result !== NOT_APPLICABLE) {
                results.push(result);
                if (result.resultType === "Fail") break;
            }
        }
        return {
            test: this,
            resultType: getResultType(results),
            childResults: results,
            duration: Date.now() - startTime
        };
    }
}
