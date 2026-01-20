import { Emulator, Message, Receiver } from "./model";

/**
 * A Receiver that waits until a specific number of messages has been received 
 * or a timeout threshold has been reached.
 */
export class TimedReceiver implements Receiver {
    private responses?: Message[];

    start() {
        this.responses = [];
    }

    receive(response: Message): void {
        if (this.responses) {
            this.responses.push(response);
        } else {
            console.error("Received message out of step: ", response);
        }
    }

    async waitForResponses(responseCount: number, timeout: number) {
        if (this.responses) throw new Error("waiting on responses without a corresponding start()")
        this.responses = [];

        const responses = this.responses;
        const start = Date.now();
        while (responses.length < responseCount && (Date.now() - start) < timeout) {
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
        delete this.responses;
        return responses;
    }
}

export class Orchestrator extends TimedReceiver {
    private emulators: Record<string, Emulator>;
    constructor(
        private defaultTimeout: number,
        ...emulators: Emulator[]
    ) {
        super();
        this.emulators = Object.fromEntries(emulators.map(e => [e.name, e]));
    }

    async exec(messages: Message[], responseCount?: number, timeout?: number) {
        timeout = timeout || this.defaultTimeout
        this.start();
        for (let request of messages) {
            const emulator = this.emulators[request.emulatorName];
            if (emulator) emulator.send(request);
        }
        // Wait until we have enough responses or timeout
        return await this.waitForResponses(responseCount || -1, timeout);
    }
}