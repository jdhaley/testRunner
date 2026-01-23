export interface TestDefinition {
    name?: string;
    description?: string;
    sourceRef?: string;
    onFailure: "stop" | "continue";
}

// export type TestFactory<T> = (definition: TestDefinition, testData: T) => Tst
// export type Tst = () => TestResult;

export interface Test<T = void> {
    definition: TestDefinition;
    test(testData: T): Promise<TestResult>;
}

export type ResultType = "Pass" | "Fail" | "Warning";

export interface TestResult {
    resultType: ResultType;
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
        const results: TestResult[] = [];
        for (let test of this.tests) {
            const result = await this.runTest(test);
            if (result != NOT_APPLICABLE) results.push(result);
            if (result.resultType === "Fail" && test.definition.onFailure === "stop") break;
        }
        return {
            test: this,
            resultType: getResultType(results),
            childResults: results
        }
    }
    protected async runTest(test: Test) {
        let result: TestResult;
        try {
            result = await test.test();
        } catch (error) {
            result = {
                test: test,
                resultType: "Fail",
                description: "" + error
            }
        }
        return result;
    }
}
export type TestSuite = Tests;
export type Scenario = Tests;

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
            case "Fail":
                return "Fail";
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