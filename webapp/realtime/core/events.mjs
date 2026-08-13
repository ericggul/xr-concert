export const events = Object.freeze({
  join: "concert:join",
  hello: "concert:hello",
  presence: "concert:presence",
  session: "concert:session",
  input: "concert:input",
  frame: "concert:frame",
  adminAuth: "concert:admin:auth",
  adminCommand: "concert:admin:command",
  adminResult: "concert:admin:result",
  broadcastClaim: "broadcast:claim",
  broadcastState: "broadcast:state",
  listenerRequest: "broadcast:listener:request",
  listenerLeave: "broadcast:listener:leave",
  offer: "broadcast:offer",
  answer: "broadcast:answer",
  ice: "broadcast:ice",
  broadcastStop: "broadcast:stop",
});

export const roles = Object.freeze(["admin", "mobile", "screen", "external"]);
