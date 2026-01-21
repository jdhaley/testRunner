import { Message } from "../src/msg";


export interface MessageSender {
    send(m: Message): void;
}

export interface MessageReceiver {
    receive(m: Message): void;
}

export class Emulator {
    constructor(
        public name: string,
        private sender: MessageSender,
        private receiver: MessageReceiver
    ) { }

    send(m: Message): void {
        this.sender.send(m);
    }

    receive(m: Message) {
        this.receiver.receive(m);
    }
}
