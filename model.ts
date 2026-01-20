export interface Test<T = void> {
	name: string;
	desc: string;
	sourceRef: string;
    onFailure: "stop" | "continue";
    test(t: T): Promise<TestResult | null>;
}

export interface TestResult {
    test: Test<any>;
    resultType: "Pass" | "Fail" | "Warning";
    failure?: string;
    childResults?: TestResult[];
}

export interface Scenario extends Test {
    steps: Step[];
}

export interface Step extends Test<Message[]> {
    responseCount: number;
    timeout?: number;
    messages: Message[];
}

export interface Message {
    emulatorName: string;
    corrId?: string;
    metadata?: Record<string, any>;
    payload: Record<string, any>
}

export interface Emulator {
    name: string;
    /** Start & Initialize */
    start(receiver: Receiver): Promise<void>;
    stop(): Promise<void>;
    send(m: Message): Promise<void>;
}

/* Receives messages from the Emulator */
export interface Receiver {
    receive(m: Message): void;
}
