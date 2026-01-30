import { Message } from "../msg-base";
import { Test, TestDefinition, TestResult, throwTestError } from "./test";
import { TestFactory } from "./test-types";

interface Lib {
    [key: string]: Function | Lib;
}

const FACTORIES: Record<string, TestFactory> = {
    "assert": AssertionFactory
}

export function registerTestFactory(type: string, factory: TestFactory) {
    if (FACTORIES[type]) throw new Error(`Factory type "${type}" is already registered.`);
    FACTORIES[type] = factory;
}

export function createTest(definition: TestDefinition) {
    const type = definition?.type;
    if (!type) throwTestError(definition, "Missing test type.");
    const fac = FACTORIES[definition?.type || ""];
    if (!fac) throwTestError(definition, `Test Type "${type}" not found.`);
    return fac(definition);
}

const LIBRARIES: Lib = {
}

export function addToLib(path: string, value: Lib | Function) {
    const tokens = path.split(".");
    let node = LIBRARIES;
    let currentPath = "";
    for (let i = 0; i < tokens.length; i++) {
        const name = tokens[i];
        currentPath = currentPath ? `${currentPath}.${name}` : name;
        if (i === tokens.length - 1) {
            if (Object.prototype.hasOwnProperty.call(node, name)) {
                throw new Error(`Node already defined at path: ${currentPath}`);
            }
            node[name] = value;
        } else {
            if (!Object.prototype.hasOwnProperty.call(node, name)) {
                node[name] = {};
            } else if (typeof node[name] !== "object" || node[name] === null) {
                throw new Error(`Cannot create intermediate node at ${currentPath}`);
            }
            node = node[name];
        }
    }
}

///////////////

export interface AssertionContext {
    lib: Lib,
    test: Test,
    data?: any
}

export interface Assertion<T = any> extends TestDefinition {
    type: "assert";
    assertion: string;
    data?: T;
}

export function AssertionFactory(def: Assertion): Test {
    const assert = new Function("lib", "test", "data", "return " + def.assertion)
    const newTest: Test ={
        definition: def,
        test(data?: any) {
            data = data || def.data;
            if (!data) throw new Error("No data for assertion test: " + JSON.stringify(def));
            const res = assert(LIBRARIES, def, data);
            return Promise.resolve({
                test: newTest,
                resultType: res ? "Pass" : "Fail",
                ...(res ? {} : { description: "Assertion Failed" })
            });
        }
    }
    return newTest;
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