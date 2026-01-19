import { Test, TestResult, Message } from "./model";

export interface MessageTest extends Test<Message[]> {
    corrId?: string;
    request?: Message;
    expectedResponse?: Message;
}

export interface MessageTestResult extends TestResult {
    response?: Message;
}

function test(this: MessageTest, messages: Message[]): MessageTestResult | null {
    if (!this.expectedResponse) return null;
    const response = getResponseByValue(this.expectedResponse, messages);
    return response ? {
        test: this,
        resultType: "Pass",
        response: response
    } : {
        test: this,
        resultType: "Fail",
        failure: "Expected response not received.",
    }
}

function getResponseByCorrelation(expectedMessage: Message, messages: Message[]): Message | null {
    for (let message of messages) {
        if (expectedMessage.corrId === message.corrId) return message;
    }
    return null;
}

function getResponseByValue(expectedMessage: Message, messages: Message[]): Message | null {
    let expected = expectedMessage.payload;
    for (let message of messages) {
        if (isExpected(expectedMessage.payload, message.payload)) return message;
    }
    return null;
} 

function isExpected(expected: Record<string, any>, actual: Record<string, any>) {
    for (let prop in expected) {
        if (expected[prop] !== actual[prop]) return false;
    }
    return true;
}
