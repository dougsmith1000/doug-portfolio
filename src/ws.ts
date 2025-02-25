import { eventHandler } from "vinxi/http";

interface Visitor {
  id: string;
  locationIndex: number;
  lastActive: number;
  color: string;
}

const connections = new Map<string, any>();

export default eventHandler({
  handler() {},
  websocket: {
    async open(peer) {
      console.log("open", peer.id);
      connections.set(peer.id, peer);
    },
    async message(peer, msg) {
      const message = msg.toString();
      console.log("msg", peer.id, message);
      peer.peers.forEach((p) => {
        p.send({ id: p.id, message });
      });
    },
    async close(peer, details) {
      console.log("close", peer.id, details);
    },
    async error(peer, error) {
      console.log("error", peer.id, peer, error);
    },
  },
});
