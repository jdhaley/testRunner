import { addExpectType, ExpectType } from "./test-expect";

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

const types: ExpectType[] = [
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
        name: "toBeOneOf",
        args: [{ type: "array" }],
        failureMessage: "be one of",
        run(value: any, expect: any) {
            // Simple deep equality (replace with a robust deepEqual as needed)
            return expect instanceof Array && expect.includes(value);
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

for (let type of types) addExpectType(type);