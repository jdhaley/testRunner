import { createConnection, createServer, Server, Socket } from "net";

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

export type SocketHandlerFactory = (conn: TcpConnection) => void;

export abstract class TcpConnection  {
    private buffer = Buffer.alloc(0);
    private receiver?: TcpReceiver;

    constructor() {
    }

    public setReceiver(receiver: TcpReceiver) {
        this.receiver = receiver;
    }

    public send(data: Buffer): void {
        this.getConnection().write(data);
    }

    protected start() {
        this.getConnection().on("data", (data: Buffer) => this.onData(data));
        this.getConnection().on("close", () => this.onClose());
    }

    protected onData(data: Buffer) {
        if (!this.receiver) throw new Error("Connection does not have a receiver.");

        this.buffer = Buffer.concat([this.buffer, data]);
        let msgLength = this.receiver.getMessageLength(this.buffer);
        while (msgLength > 0) {
            const rawMessage = this.buffer.subarray(0, msgLength);

            this.buffer = this.buffer.subarray(msgLength);

            this.receiver.receive(rawMessage);
            msgLength = this.receiver.getMessageLength(this.buffer);
        }
    }

    protected onClose() {
    }

    protected abstract getConnection(): Socket;
}

export class TcpClient extends TcpConnection {
    private socket?: Socket;

    constructor(
        private host: string,
        private port: number,
    ) {
        super();
    }

    protected getConnection(): Socket {
        if (!this.socket || this.socket.destroyed) {
            this.socket = createConnection({ host: this.host, port: this.port });
            this.start();
        }
        return this.socket;
    }
}

export class TcpServerConnection extends TcpConnection {
    constructor(private server: TcpServer, private socket: Socket) {
        super();
        this.start();
    }

    public close() {
        this.socket.destroy();
        this.server.closeConnection(this);
    }

    protected getConnection(): Socket {
        return this.socket;
    }

    protected onClose(): void {
        this.close();
    }
}

export class TcpServer {
    constructor(port: number, factory: SocketHandlerFactory) {
        this.server = createServer(
            (socket: Socket) => this.createConnection(socket, factory)
        );
        this.server.listen(port);
    }
    private server: Server;
    private connections = new Set<TcpServerConnection>();

    public close() {
        this.server.close();
        for (const conn of this.connections) conn.close();
    }

    private createConnection(socket: Socket, factory: SocketHandlerFactory) {
        const conn = new TcpServerConnection(this, socket);
        factory(conn);
        this.connections.add(conn);
    }

    public closeConnection(conn: TcpServerConnection) {
        this.connections.delete(conn);
    }
}