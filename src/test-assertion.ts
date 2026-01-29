import Ajv, { JSONSchemaType as Schema } from "ajv";
import { Test, TestDefinition, TestResult, throwTestError } from "./test";
import { registerTestFactory } from "./test-types";

export interface Lib {
    [key: string]: Function | Lib;
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

interface AssertionContext {
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
    const newTest: Test = {
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

registerTestFactory("assert", AssertionFactory);

export const assertionTestSchema: Schema<Assertion> = {
  type: "object",
  properties: {
    type: { type: "string", const: "assert", nullable: false },
    name: { type: "string" },
    onFailure: { type: "string", enum: ["stop", "continue"], nullable: true },
    description: { type: "string", nullable: true },
    sourceRef: { type: "string", nullable: true },
    data: { type: "object", nullable: true },
    assertion: { type: "string" },
  },
  required: ["type", "name", "assertion"],
  additionalProperties: false
}