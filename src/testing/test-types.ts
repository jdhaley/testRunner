import { TestDefinition, Test, throwTestError } from "./test";

export type TestFactory = (def: TestDefinition) => Test<any>

const FACTORIES: Record<string, TestFactory> = {
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
