import { Orchestrator } from "../msg";
import { Message } from "../msg-base";
import { getResultType, Test, TestDefinition, TestResult, NOT_APPLICABLE } from "./test";

export interface MessageTest extends Test<Message[]> {
    request: Message;
    expectedResponse: Message;
}

export interface MessageTestResult extends TestResult {
    response?: Message;
}

export interface StepDefinition extends TestDefinition {
    responseCount: number;
    timeout?: number;
    requestMessages: Message[];
}

export class Step implements Test<void> {
    constructor(
        private orchestrator: Orchestrator<Message>,
        public definition: StepDefinition,
        ...tests: Test<Message[]>[]

    ) {
        this.tests = tests;
    }
    private tests: Test<Message[]>[];

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
        for (let test of this.tests) {
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

export const TEST_CASE_ERROR: TestResult = Object.freeze({
    resultType: "Fail",
    description: "Test case not run due to unspecified error."
});

export const MISSING_EXPECTED_RESPONSE: TestResult = Object.freeze({
    resultType: "Fail",
    description: "Test case is missing the expected response in testForExpected()"
});

export function testForExpected(testCase: MessageTest, messages: Message[]): MessageTestResult {
    if (!testCase.expectedResponse) return MISSING_EXPECTED_RESPONSE;
    const response = getResponseByValue(testCase.expectedResponse, messages);
    return response ? {
        test: testCase,
        resultType: "Pass",
        response: response
    } : {
        test: testCase,
        resultType: "Fail",
        description: "Expected response not received.",
    }
}

export function getResponseByCorrelation(expectedMessage: Message, messages: Message[]): Message | null {
    for (let message of messages) {
        if (expectedMessage.header.corrId === message.header.corrId) return message;
    }
    return null;
}

export function getResponseByValue(expectedMessage: Message, messages: Message[]): Message | null {
    for (let message of messages) {
        if (isExpected(expectedMessage.header, message.header)
            && isExpected(expectedMessage.body, message.body)) return message;
    }
    return null;
}

export function isExpected(expected: Record<string, any>, actual: Record<string, any>) {
    for (let prop in expected) {
        if (expected[prop] !== actual[prop]) return false;
    }
    return true;
}