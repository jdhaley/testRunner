import { ResultType, TestResult } from "./test";

export function reportResult(result: TestResult): void {
    reportTest(result);
    const stats = collectStats(result);
    console.log("\n" + "=".repeat(50));
    console.log("TEST SUMMARY");
    console.log("=".repeat(50));
    console.log(`Total:    ${stats.total}`);
    console.log(`Passed:   ${stats.passed}`);
    console.log(`Failed:   ${stats.failed}`);
    console.log(`Warnings: ${stats.warnings}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log("=".repeat(50));
}

function reportTest(result: TestResult, indent: number = 0): void {
    const prefix = "  ".repeat(indent);
    const icon = getIcon(result.resultType);
    const name = result.test?.definition.name || "Unnamed Test";
    const duration = result.duration ? `(${result.duration}ms)` : "";
    console.log(`${prefix}${icon} ${name} - ${result.resultType} ${duration}`);

    if (result.description) {
        console.log(`${prefix}  ${result.description}`);
    }

    if (result.childResults) {
        result.childResults.forEach(child => reportTest(child, indent + 1));
    }
}

function getIcon(resultType: ResultType): string {
    switch (resultType) {
        case "Pass": return "✓";
        case "Fail": return "✗";
        case "Warning": return "⚠";
    }
}

function collectStats(result: TestResult, stats = { total: 0, passed: 0, failed: 0, warnings: 0 }) {
    if (result.childResults) {
        result.childResults.forEach(child => collectStats(child, stats));
    } else {
        stats.total++;
        if (result.resultType === "Pass") stats.passed++;
        else if (result.resultType === "Fail") stats.failed++;
        else if (result.resultType === "Warning") stats.warnings++;
    }
    return stats;
}