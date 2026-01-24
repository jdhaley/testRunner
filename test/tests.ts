import { NOT_APPLICABLE, ResultType, Test, TestResult } from "../src/test";
import { Message } from "../src/msg";

export interface MessageTest extends Test<Message[]> {
    corrId?: string;
    request?: Message;
    expectedResponse?: Message;
}

export interface MessageTestResult extends TestResult {
    response?: Message;
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
        if (expectedMessage.corrId === message.corrId) return message;
    }
    return null;
}

export function getResponseByValue(expectedMessage: Message, messages: Message[]): Message | null {
    for (let message of messages) {
        if (isExpected(expectedMessage.payload, message.payload)) return message;
    }
    return null;
} 

export function isExpected(expected: Record<string, any>, actual: Record<string, any>) {
    for (let prop in expected) {
        if (expected[prop] !== actual[prop]) return false;
    }
    return true;
}


/* Creates a result & wraps it in a promise */
export function result(test: Test, rt: ResultType, desc?: string, ...results: TestResult[]): Promise<TestResult> {
    return Promise.resolve({
        resultType: rt,
        test: test,
        ...(desc && { description: desc }),
        ...(results.length > 0 && { childResults: results })
    });
}
