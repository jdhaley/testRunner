import { Message } from "../src/msg";
import { Orchestrator } from "../src/msg-receiver";
import { Scenario, TestDefinition, TestResult, Tests } from "../src/test";
import { Step, StepDefinition } from "../src/test-msg-step";
import { MessageTest, testForExpected } from "./tests";

const msg1: Message = {
    emulatorName: "EM1",
    payload: { content: "Hello world!" }
}
const msg2: Message = {
    emulatorName: "EM2",
    payload: { content: "The quick brown fox" }
}

const tst1: MessageTest = {
    definition: {
        name: "tst1",
        onFailure: "stop"
    },
    request: msg1,
    expectedResponse: {
        emulatorName: "EM1",
        payload: { content: "HELLO WORLD!" }
    },
    test(data: Message[]) {
        return Promise.resolve(testForExpected(this, data));
    }
}
const tst2: MessageTest = {
    definition: {
        name: "tst2",
        onFailure: "stop"
    },
    //TODO originally it was msg1 but there was no error but correlation
    //isn't working.
    request: msg2,
    expectedResponse: {
        emulatorName: "EM2",
        payload: { content: "THE QUICK BROWN FOX" }
    },
    test(data: Message[]) {
        return Promise.resolve(testForExpected(this, data));
    }
}

const step1: StepDefinition = {
    name: "step1",
    onFailure: "continue",
    responseCount: 2,
    //responseCount: 3, //Test timeout (there are two request messages)
    timeout: 2000,
    requestMessages: [msg1, msg2],
    testCases: [tst1, tst2]
}

export function defineSuite(orch: Orchestrator) {
    const s1 = new Step(step1, orch);
    const scen1 = new Tests({
        name: "Scenario 1",
        onFailure: "continue"
    }, s1);
    return new Tests({
        name: "Scenarios",
        onFailure: "stop"
    }, scen1);
}