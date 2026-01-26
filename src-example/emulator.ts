import { Receiver } from "../src/msg";
import { Message, MessageCodec } from "../src/msg-base";
import { TcpConnection, TcpClient } from "../src/tcp";

export class ClientEmulator extends MessageCodec {
    constructor(name: string, host: string, port: number, receiver: Receiver<Message>) {
        const client = new TcpClient(host, port);
        super(name, client, receiver);
        client.setReceiver(this);
    }
}

// Note: A new Sut is created for each server connection. This isn't really an issue.
export class SutConnection {
    constructor(connection: TcpConnection) { 
        this.emulator = new MessageCodec("SUT", connection, this);
        connection.setReceiver(this.emulator);
    }
    private emulator: MessageCodec;

    receive(m: Message): void {
        m.body.content = "" + m.body.content.toUpperCase();
        this.send(m);
    }
    send(m: Message) {
        this.emulator.send(m);
    }
}
