import { Test, TestDefinition, TestResult } from "./test";
import { reportResult } from "./test-report";
import { registerTestFactory } from "./test-types";

export interface Expects extends TestDefinition {
    expects: Expect[]
}

export interface Expect {
    typeName: string;
    not?: boolean;
    //ANY value (path, array, etc)
    value: any;
    //Custom failure message
    failureMessage?: string;
}

export interface ExpectType {
    name: string;
    args: Arg[];
    //The default failure message
    failureMessage: string;
    //The function that is run. Returns a failure message when the test fails.
    run(value: any, expect: any): boolean;
}

export type type = "number" | "string" | "object" | "array" | "boolean" | "date" | "any" | "scalar";
export interface Arg {
    name?: string;
    type: type;
    //Validates the argument, returning an error message on failure, when the test is loaded or compiled.
    validate?: string;
}

export function addExpectType(type: ExpectType) {
    if (TYPES[type.name]) throw new Error(`Expectation type "${type.name}" is already defined.`);
    TYPES[type.name] = type;
}

const TYPES: Record<string, ExpectType> = {}

// Test runner for Expects TestDefinition
export function ExpectsTestFactory(def: Expects): Test<any> {
    const newTest: Test = {
        definition: def,
        async test(data?: any): Promise<TestResult> {
            const results: string[] = [];
            for (const exp of def.expects) {
                const result = runExpectation(exp, data);
                if (result) results.push(result);
            }

            if (results.length) {
                return {
                    resultType: "Fail",
                    description: results.join("\n"),
                    test: newTest,
                }
            } else {
                return {
                    resultType: "Pass",
                    test: newTest
                }
            }
        }
    }
    return newTest;
}

registerTestFactory("expects", ExpectsTestFactory);

function runExpectation(exp: Expect, data: any): string {
    const type = TYPES[exp.typeName];
    if (!type) throw new Error(`Expectation "${exp.typeName}" is not defined.`);
    let pass: boolean;
    try {
        pass = type.run(data, exp.value);
        // Support for not
        if (exp.not) pass = !pass
        return pass ? "" : createDescription(exp, type, data);
    } catch (e) {
        throw new ExpectError(exp, type, data, e);
    }
}

function createDescription(exp: Expect, type: ExpectType, value: any) {
    let desc = `Expected value "${value}" to `;
    if (exp.not) desc += "not ";
    const failure = exp.failureMessage || type.failureMessage;
    desc += failure;
    if (!failure.endsWith(".")) desc += ` "${exp.value}"`;
    return desc;
}

export class ExpectError extends Error {
    constructor(
        public expectation: Expect,
        public type: ExpectType,
        public data: any,
        error: string | Error
    ) {
        super(typeof error === "string" ? error : "Error: " + error.message);
    }
}
