import { FastifyInstance } from "fastify";
import z from "zod";
import { voting } from "../../utios/PollPubSub";

export async function PollResulsRealVotes(app: FastifyInstance) {
  app.get(
    "/polls/:pollId/results",
    { websocket: true },
    async (conet, request) => {
      const getPollParams = z.object({
        pollId: z.string().uuid(),
      });

      const { pollId } = getPollParams.parse(request.params);

      voting.subscribe(pollId, (message) => {
        conet.socket.send(JSON.stringify(message));
      });
    }
  );
}
