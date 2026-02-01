import { Expects, ExpectsTestFactory } from "../src/testing/test-expect";
import { reportResult } from "../src/testing/test-report";

//load the types:
import "../src/testing/test-expect-types";

// Demo function for the expectation framework
export async function demoExpectationFramework() {
    // Example test definition
    const testDef: Expects = {
        name: "Demo Expects Test",
        expects: [
            { typeName: "toBe", value: 42, not: true },
            { typeName: "toBeGreaterThan", value: 100 },
            { typeName: "toBeLessThan", value: 50, not: true },
            { typeName: "toBeTruthy", value: true },
            { typeName: "toContain", value: 2 },
            { typeName: "toContainString", value: "hello world" }
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
