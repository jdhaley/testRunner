export interface TestDefinition {
    name: string;
    onFailure: "stop" | "continue";
    description?: string;
    sourceRef?: string;
}

export interface Test<T = void> {
    definition: TestDefinition;
    test(testData: T): Promise<TestResult>;
}

/*
    Error: Test did not run due to errors in test data, or 
           runtime error trapped while executing test
    Fatal: Error detected within the testing framework.
*/
export type ResultType = "Pass" | "Warning" | "Fail" | "Error" | "Fatal"

export interface TestResult {
    resultType: ResultType;
    duration?: number;
    test?: Test<any>;
    description?: string;
    childResults?: TestResult[];
}

export class Tests implements Test {
    constructor(public definition: TestDefinition, ...tests: Test[]) { 
        this.tests = tests;
    }
    private tests: Test[];

    async test(): Promise<TestResult> {
        const startTime = Date.now();
        const results: TestResult[] = [];
        for (let test of this.tests) {
            const result = await runTest(test);
            if (result != NOT_APPLICABLE) results.push(result);
            if (result.resultType === "Fail" && test.definition.onFailure === "stop") break;
        }
        return {
            test: this,
            resultType: getResultType(results),
            childResults: results,
            duration: Date.now() - startTime
        }
    }
}

export async function runTest(test: Test) {
    let result: TestResult;
    const startTime = Date.now();
    try {
        result = await test.test();
    } catch (error) {
        if (error instanceof Error) {
            error = error.stack || "" + error;
        }
        result = {
            test: test,
            resultType: "Error",
            description: "" + error,
            duration: Date.now() - startTime
        }
    }
    return result;
}

/**
 * Return this when a Test.test(t) is not applicable for the data.
 * The system checks for this EXACT object to filter these out
 * when collecting results.
 */
export const NOT_APPLICABLE: TestResult = Object.freeze({
    resultType: "Warning",
    description: "Test Data did not match test prerequisite"
});

export function getResultType(results: TestResult[]) {
    let type: ResultType = "Pass";
    for (let result of results) {
        switch (result.resultType) {
            case "Fatal":
            case "Error":
            case "Fail":
                return result.resultType;
            case "Warning":
                type = "Warning";
                break;
            case "Pass":
                break;
            default:
                throw new Error("Unknown Result Type");
        }
    }
    return type;
}