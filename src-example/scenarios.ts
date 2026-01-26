import { Orchestrator } from "../src/msg";
import { Message } from "../src/msg-base";
import { Tests } from "../src/test";
import { MessageTest, Step, StepDefinition, testForExpected } from "../src/test-msg";

const tst1: MessageTest = {
    definition: {
        name: "tst1",
        onFailure: "stop"
    },
    request: {
        header: { channel: "EM1" },
        body: { content: "Hello world!" }
    },
    expectedResponse: {
        header: { channel: "EM1" },
        body: { content: "HELLO WORLD!" }
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
    request: {
        header: { channel: "EM2" },
        body: { content: "The quick brown fox" }
    },
    expectedResponse: {
        header: { channel: "EM2" },
        // Note the forced failure
        body: { content: "THE QUICK BROWN FOX!" }
    },
    test(data: Message[]) {
        return Promise.resolve(testForExpected(this, data));
    }
}

const step1: StepDefinition = {
    name: "step1",
    onFailure: "continue",
    requestMessages: [tst1.request, tst2.request],
    responseCount: 2,
    //responseCount: 3, //Test timeout (there are two request messages)
    timeout: 2000,
}

export function defineSuite(orch: Orchestrator<Message>) {
    const s1 = new Step(orch, step1, tst1, tst2);
    const scen1 = new Tests({
        name: "Scenario 1",
        onFailure: "continue"
    }, s1);
    return new Tests({
        name: "Scenarios",
        onFailure: "stop"
    }, scen1);
}