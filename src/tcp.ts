import { createConnection, createServer, Socket } from "net";

export interface TcpReceiver {
    /**
        Returns the length of a message fully contained in the buffer or -1 
        when the buffer doesn't contain the entire message, i.e. more data 
        needs to be received
    */
    getMessageLength(data: Buffer): number;
    /**
        Receive a message for processing.
     */
    receive(msg: Buffer): void
}

export function startServer(port: number, receiver: TcpReceiver) {
    const server = createServer((socket: Socket) => createServerConnection(socket));
    server.listen(port);

    function createServerConnection(socket: Socket) {
        return new TcpServerConnection(socket, receiver)
    }
}

export abstract class TcpConnection  {
    private buffer = Buffer.alloc(0);
    constructor(private receiver?: TcpReceiver) {
    }

    protected start() {
        this.getConnection().on("data", (data: Buffer) => this.onData(data));
        this.getConnection().on("close", () => this.onClose());
    }

    public send(data: Buffer): void {
        this.getConnection().write(data);
    }

    protected onData(data: Buffer) {
        if (!this.receiver) throw new Error("Connection is not a receiver.");

        this.buffer = Buffer.concat([this.buffer, data]);
        let msgLength = this.receiver.getMessageLength(this.buffer);
        while (msgLength > 0) {
            const rawMessage = this.buffer.subarray(0, msgLength);

            this.buffer = this.buffer.subarray(msgLength);

            this.receiver.receive(rawMessage);
            msgLength = this.receiver.getMessageLength(this.buffer);
        }
    }
    private onClose() {
    }

    protected abstract getConnection(): Socket;
}

export class TcpServerConnection extends TcpConnection {
    constructor(private socket: Socket, receiver: TcpReceiver) {
        super(receiver);
    }

    protected getConnection(): Socket {
        return this.socket;
    }
}

export class TcpClient extends TcpConnection {
    private socket?: Socket;

    constructor(
        private host: string,
        private port: number,
        receiver?: TcpReceiver
    ) { 
        super(receiver)
    }

    protected getConnection(): Socket {
        if (!this.socket || this.socket.destroyed) {
            this.socket = createConnection({ host: this.host, port: this.port });
        }
        return this.socket;
    }
}
