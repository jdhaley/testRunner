import Ajv, { JSONSchemaType as Schema } from "ajv";

// Your schema object
// export const mySchema: Schema = {
//     "definitions": {
//         "Test": {
//             "type": "object",
//             "properties": {
//                 "type": { "type": "string" },
//                 "name": { "type": "string" },
//                 "onFailure": { "enum": ["stop", "continue"] },
//                 "description": { "type": "string" },
//                 "sourceRef": { "type": "string" }
//             },
//             "required": ["type", "name"],
//        },
//         "AssertionTest": {
//             "allOf": [
//                 { "$ref": "#/definitions/Test" },
//                 {
//                     "properties": {
//                         "type": { "const": "assert" },
//                         "assertion": { "type": "string" },
//                         "data": {}
//                     },
//                     "required": ["assertion"]
//                 }
//             ]
//         },
//         "MessageTest": {
//             "allOf": [
//                 { "$ref": "#/definitions/Test" },
//                 {
//                     "properties": {
//                         "type": { "const": "message" },
//                         "request": { "type": "object" },
//                         "expectedResponse": { "type": "object" }
//                     },
//                     "required": ["request", "expectedResponse"]
//                 }
//             ]
//         }
//     },
//     "oneOf": [
//         { "$ref": "#/definitions/AssertionTest" },
//         { "$ref": "#/definitions/MessageTest" }
//     ]
// }

// Define the TypeScript type for AssertionTest
export interface AssertionTest {
  type: "assert";
  name: string;
  onFailure: "stop" | "continue";
  assertion: string;
  description?: string;
  sourceRef?: string;
  data?: any;
}

// Define the JSON Schema for AssertionTest
const assertionTestSchema: Schema<AssertionTest> = {
  type: "object",
  properties: {
    type: { type: "string", const: "assert" },
    name: { type: "string" },
    onFailure: { type: "string", enum: ["stop", "continue"] },
    assertion: { type: "string" },
    description: { type: "string", nullable: true },
    sourceRef: { type: "string", nullable: true },
    data: { type: "object", nullable: true },
  },
  required: ["type", "name", "onFailure", "assertion"],
  additionalProperties: false
};

// Example data to validate
const example: AssertionTest = {
  type: "assert",
  name: "test1",
  onFailure: "stop",
  assertion: "data > 3",
  data: 5
};

export function validateTypes() {
    const ajv = new Ajv();
    const validate = ajv.compile(assertionTestSchema);

    if (validate(example)) {
        console.log("Valid AssertionTest!");
    } else {
        console.error("Validation errors:", validate.errors);
    }
}