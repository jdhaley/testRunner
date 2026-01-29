import { Test, TestDefinition, TestResult } from "./test";
import { reportResult } from "./test-report";
import { registerTestFactory } from "./test-types";

export interface Expects extends TestDefinition {
    expectations: Expectation[]
}

export interface Expectation {
    expect: string;
    not?: boolean;
    //ANY value (path, array, etc)
    value: any;
    //Custom failure message
    failureMessage?: string;
}

interface ExpectType {
    name: string;
    args: Arg[];
    //The default failure message
    failureMessage: string;
    //The function that is run. Returns a failure message when the test fails.
    run(value: any, expect: any): boolean;
}

type type = "number" | "string" | "object" | "array" | "boolean" | "date" | "any"
interface Arg {
    name?: string;
    type: type;
    //Validates the argument, returning an error message on failure, when the test is loaded or compiled.
    validate?: string;
}

/*
expect(actual)
  .toBe(expected)           // strict equality
  .toEqual(expected)        // deep equality
  .toContain(item)          // array contains item
  .toHaveLength(n)          // array/string length
  .toBeGreaterThan(n)       // numeric comparison
  .toBeLessThan(n)
  .toMatch(regex)           // string matches regex
  .toBeTruthy()             // value is truthy
  .toBeFalsy()              // value is falsy
  .toBeNull()               // value is null
  .toBeUndefined()          // value is undefined
  .toThrow()                // function throws error
  .toHaveProperty(key, value) // object has property
  .toAssert(expression)     // expression returns true.
*/
const TYPES: ExpectType[] = [
    {
        name: "toBe",
        args: [{ type: "any" }],
        failureMessage: "be strictly equal to",
        run(value: any, expect: any) {
            return value === expect;
        }
    },
    {
        name: "toEqual",
        args: [{ type: "any" }],
        failureMessage: "be deeply equal to",
        run(value: any, expect: any) {
            // Simple deep equality (replace with a robust deepEqual as needed)
            return JSON.stringify(value) === JSON.stringify(expect);
        }
    },
    {
        name: "toContain",
        args: [{ type: "array" }],
        failureMessage: "contain array element",
        run(value: any, expect: any) {
            return value instanceof Array && value.includes(expect);
        }
    },
    {
        name: "toContainString",
        args: [{ type: "string" }],
        failureMessage: "contain string",
        run(value: any, expect: any) {
            return ("" + value).includes(expect);
        }
    },
    {
        name: "toHaveLength",
        args: [{ type: "number" }],
        failureMessage: "have specified length of",
        run(value: any, expect: any) {
            return value != null && value.length === expect;
        }
    },
    {
        name: "toBeGreaterThan",
        args: [{ type: "number" }],
        failureMessage: "be greater than",
        run(value: any, expect: any) {
            return value > expect;
        }
    },
    {
        name: "toBeLessThan",
        args: [{ type: "number" }],
        failureMessage: "be less than",
        run(value: any, expect: any) {
            return value < expect;
        }
    },
    {
        name: "toMatch",
        args: [{ type: "string" }],
        failureMessage: "match regex",
        run(value: any, expect: any) {
            return typeof value === 'string' && new RegExp(expect).test(value);
        }
    },
    {
        name: "toBeTruthy",
        args: [],
        failureMessage: "be truthy.",
        run(value: any) {
            return !!value;
        }
    },
    {
        name: "toBeFalsy",
        args: [],
        failureMessage: "be falsy.",
        run(value: any) {
            return !value;
        }
    },
    {
        name: "toBeNull",
        args: [],
        failureMessage: "be null.",
        run(value: any) {
            return value === null;
        }
    },
    {
        name: "toBeUndefined",
        args: [],
        failureMessage: "be undefined.",
        run(value: any) {
            return value === undefined;
        }
    },
    {
        name: "toHaveProperty of",
        args: [{ type: "string" }, { type: "any", validate: "optional" }],
        failureMessage: "have property (and value, if specified):",
        run(value: any, key: string, expectedValue?: any) {
            if (typeof value !== 'object' || value === null) return false;
            if (!(key in value)) return false;
            if (arguments.length === 3) return value[key] === expectedValue;
            return true;
        }
    },
    {
        name: "toAssert",
        args: [{ type: "string" }],
        failureMessage: "assert truth for",
        run(value: any, expect: string) {
            const assert = new Function("data", "return " + expect) as (data: any) => boolean;
            return assert(value) ? true : false;
        }
    }
];

const TYPE_MAP: Record<string, ExpectType> = TYPES.reduce(
    (acc, t) => { acc[t.name] = t; return acc; },
    {} as Record<string, ExpectType>
);

// Test runner for Expects TestDefinition
export function ExpectsTestFactory(def: Expects): Test<any> {
    const newTest: Test = {
        definition: def,
        async test(data?: any): Promise<TestResult> {
            const results: string[] = [];
            for (const exp of def.expectations) {
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

function runExpectation(exp: Expectation, data: any): string {
    const type = TYPE_MAP[exp.expect];
    if (!type) throw new Error(`Expectation "${exp.expect}" is not defined.`);
    let pass: boolean;
    try {
        pass = type.run(data, exp.value);
        // Support for not
        if (exp.not) pass = !pass
        return pass ? "" : createDescription(exp, type, data);
    } catch (e) {
        throw new ExpectationError(exp, type, data, e);
    }
}

function createDescription(exp: Expectation, type: ExpectType, value: any) {
    let desc = `Expected value "${value}" to `;
    if (exp.not) desc += "not ";
    const failure = exp.failureMessage || type.failureMessage;
    desc += failure;
    if (!failure.endsWith(".")) desc += ` "${exp.value}"`;
    return desc;
}

export class ExpectationError extends Error {
    constructor(
        public expectation: Expectation,
        public type: ExpectType,
        public data: any,
        error: string | Error
    ) {
        super(typeof error === "string" ? error : "Error: " + error.message);
    }
}


// Demo function for the expectation framework
export async function demoExpectationFramework() {
    // Example test definition
    const testDef: Expects = {
        name: "Demo Expects Test",
        expectations: [
            { expect: "toBe", value: 42, not: true },
            { expect: "toBeGreaterThan", value: 100 },
            { expect: "toBeLessThan", value: 50, not: true },
            { expect: "toBeTruthy", value: true },
            { expect: "toContain", value: 2 },
            { expect: "toContainString", value: "hello world" }
        ]
    };

    // The value to test against (data)
    const data = 42;

    // Create the test
    const test = ExpectsTestFactory(testDef);
    // Run the test
    const result = await test.test(data);

    console.log(reportResult(result));
}
