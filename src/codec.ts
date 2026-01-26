export interface Sender<T> {
    send(message: T): void;
}

export interface Receiver<T> {
    receive(message: T): void;
}

export interface Codec<T> extends Sender<T>, Receiver<Buffer> {
    getMessageLength(buffer: Buffer): number;
}

/**
 * A Receiver that waits until a specific number of messages has been received 
 * or a timeout threshold has been reached.
 */
export class TimedReceiver<T> implements Receiver<T> {
    private responses?: T[];

    start() {
        this.responses = [];
    }

    receive(response: T): void {
        if (this.responses) {
            this.responses.push(response);
        } else {
            console.error("Received message out of step: ", response);
        }
    }

    async waitForResponses(responseCount: number, timeout: number) {
        if (!this.responses) throw new Error("waiting on responses without a corresponding start()")

        const responses = this.responses;
        const start = Date.now();
        while (responses.length < responseCount && (Date.now() - start) < timeout) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        delete this.responses;
        return responses;
    }
}

export class Orchestrator<T> extends TimedReceiver<T> {
    constructor(
        private sender: Sender<T>,
        private defaultTimeout: number

    ) {
        super();
    }

    async exec(messages: T[], responseCount?: number, timeout?: number) {
        timeout = timeout || this.defaultTimeout
        this.start();
        for (let request of messages) {
            this.sender.send(request);
        }
        // Wait until we have enough responses or timeout
        return await this.waitForResponses(responseCount || -1, timeout);
    }
}

