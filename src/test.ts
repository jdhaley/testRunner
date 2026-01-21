export interface TestDefinition {
    name?: string;
    description?: string;
    sourceRef?: string;
    onFailure: "stop" | "continue";
}

// export type TestFactory<T> = (definition: TestDefinition, testData: T) => Tst
// export type Tst = () => TestResult;

export interface Test<T = any> {
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

export interface Scenario extends Test<void> {
    steps: Test<void>[];
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

export async function runScenarios(scenarios: Scenario[]): Promise<TestResult[]> {
    const results: TestResult[] = []
    for (const scenario of scenarios) {
        let result: TestResult;
        try {
            result = await runScenario(scenario);
        } catch (error) {
            result = {
                test: scenario,
                resultType: "Fail",
                description: "" + error
            }
        }
        results.push(result);
    }
    return results;
}

export async function runScenario(scenario: Scenario): Promise<TestResult> {
    const results: TestResult[] = [];
    for (let step of scenario.steps) {
        const result = await step.test();
        if (result != NOT_APPLICABLE) results.push(result);
        if (result.resultType === "Fail" && step.definition.onFailure === "stop") break;
    }
    return {
        test: scenario,
        resultType: getResultType(results),
        childResults: results
    }
}

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