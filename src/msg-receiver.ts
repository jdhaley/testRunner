import { Message, MessageReceiver, MessageSender } from "./msg";


/**
 * A Receiver that waits until a specific number of messages has been received 
 * or a timeout threshold has been reached.
 */
export class TimedReceiver implements MessageReceiver {
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

    waitForResponses(responseCount: number, timeout: number) {
        if (this.responses) throw new Error("waiting on responses without a corresponding start()")
        this.responses = [];

        const responses = this.responses;
        const start = Date.now();
        while (responses.length < responseCount && (Date.now() - start) < timeout) {
            setTimeout(() => null, 50);
        }
        delete this.responses;
        return responses;
    }
}

export class Orchestrator extends TimedReceiver {
    constructor(
        private defaultTimeout: number,
    ) {
        super();
    }
    private senders: Record<string, MessageSender> = {}

    setSender(name: string, sender: MessageSender) {
        this.senders[name] = sender;
    }

    exec(messages: Message[], responseCount?: number, timeout?: number) {
        timeout = timeout || this.defaultTimeout
        this.start();
        for (let request of messages) {
            const sender = this.senders[request.emulatorName];
            if (sender) sender.send(request);
        }
        // Wait until we have enough responses or timeout
        return this.waitForResponses(responseCount || -1, timeout);
    }
}