import { Message } from "../src/msg";
import { Orchestrator } from "../src/msg-receiver";
import { startServer, TcpConnection } from "../src/tcp";
import { reportResult } from "../src/test-report";
import { ClientEmulator, Emulator } from "./emulator";
import { defineSuite } from "./scenarios";

const sutHost = "127.0.0.1";
const sutPort = 1410;

export class Sut {
    constructor(connection: TcpConnection) { 
        this.emulator = new Emulator("SUT", connection, this);
        connection.setReceiver(this.emulator);
    }
    private emulator: Emulator;

    receive(m: Message): void {
        m.payload.content = "" + m.payload.content.toUpperCase();
        this.send(m);
    }
    send(m: Message) {
        this.emulator.send(m);
    }
}
startServer(sutPort, (conn: TcpConnection) => new Sut(conn));

const orch = new Orchestrator(3000);
new ClientEmulator("EM1", sutHost, sutPort, orch);
new ClientEmulator("EM2", sutHost, sutPort, orch);

const suite = defineSuite(orch);
const testResult = await suite.test();

reportResult(testResult);