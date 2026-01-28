import { Message } from "./msg-base";
import { ResultType } from "./test";

export interface Test {
    name: string;
    type: string;
    onFailure: "stop" | "continue";
    description?: string;
    sourceRef?: string;
}

export type TestCase<T = void> = (data?: T) => TestResult;
export type TestFactory = (definition: Test) => TestCase

export interface TestResult {
    resultType: ResultType;
    duration?: number;
    test: Test;
    description?: string;
    childResults?: TestResult[];
}

export function throwTestError(test: Test, error: string) {
    throw new Error(`Error in test "${test.name}": ${error}`);
}

interface Lib {
    [key: string]: Function | Lib;
}

const lib: Lib = {
}

const testTypes: Record<string, TestFactory> = {
    "assert": AssertionFactory
}

export function registerTestFactory(type: string, factory: TestFactory) {
    if (testTypes[type]) throw new Error(`Factory type "${type}" is already registered.`);
    testTypes[type] = factory;
}

export function createTest(definition: Test) {
    const type = definition?.type;
    if (!type) throwTestError(definition, "Missing test type.");
    const fac = testTypes[definition?.type];
    if (!fac) throwTestError(definition, `Test Type "${type}" not found.`);
    return fac(definition);
}

export interface Assertion<T = any> extends Test {
    assertion: string;
    data?: T;
}

export function AssertionFactory(def: Assertion): TestCase {
    const assert = new Function("lib", "test", "data", "return " + def.assertion)
    return function assertionTest(data?: any) {
        data = data || def.data;
        if (!data) throw new Error("No data for assertion test: " + JSON.stringify(def));
        const res = assert(lib, def, data);
        return {
            test: def,
            resultType: res ? "Pass" : "Fail",
            ...(res ? {} : { description: "Assertion Failed" })
        }
    }
}

export interface MessageTest extends Test {
    request: Message;
    expectedResponse: Message;
}

export interface MessageTestResult extends TestResult {
    test: MessageTest;
    response?: Message;
}


export function testForExpected(testCase: MessageTest, messages: Message[]): MessageTestResult {
    if (!testCase.expectedResponse) throw new Error("Expected Response is missing");
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


////////////////

const tests: Assertion[] = [
    {
        name: "test1",
        type: "assert",
        onFailure: "stop",
        data: 5,
        assertion: "data > 3"
    }
]