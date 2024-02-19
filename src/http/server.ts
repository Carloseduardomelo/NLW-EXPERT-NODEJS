import cookie from "@fastify/cookie";
import { fastify } from "fastify";
import { deletePoll } from "./routs/DeletePoll";
import { createPoll } from "./routs/createPols";
import { getPoll } from "./routs/getPoll";
import { voltesPoll } from "./routs/votesPoll";

const app = fastify();

app.register(cookie, {
  secret: "senpai-01-02-03-node",
  hook: "onRequest",
  parseOptions: {},
});
app.register(createPoll);
app.register(getPoll);
app.register(voltesPoll);
app.register(deletePoll);

app.listen({ port: 3333 }).then(() => {
  console.log("HTTP server running on http://localhost:3333");
});
