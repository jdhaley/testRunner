import { Orchestrator } from "../src/codec";
import { Message, Senders } from "../src/msg";
import { TcpConnection, TcpServer } from "../src/tcp";
import { reportResult } from "../src/test-report";
import { ClientEmulator, SutConnection } from "./emulator";
import { defineSuite as createExampleSuite } from "./scenarios";

const sutHost = "127.0.0.1";
const sutPort = 1410;

const senders = new Senders();
const orch = new Orchestrator<Message>(senders, 3000);

senders.addSender("EM1", new ClientEmulator("EM1", sutHost, sutPort, orch));
senders.addSender("EM2", new ClientEmulator("EM2", sutHost, sutPort, orch));

const suite = createExampleSuite(orch);

const sut = new TcpServer(sutPort, (conn: TcpConnection) => new SutConnection(conn));
const testResult = await suite.test();
reportResult(testResult);
sut.close();
