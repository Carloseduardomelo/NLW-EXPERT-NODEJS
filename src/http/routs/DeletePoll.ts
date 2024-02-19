import { FastifyInstance } from "fastify";
import z from "zod";
import { db } from "../../lib/pisma";

export async function deletePoll(app: FastifyInstance) {
  app.delete("/polls/delete", async (res, req) => {
    const deletePollsBody = z.object({
      pollId: z.string().uuid(),
    });

    const { pollId } = deletePollsBody.parse(res.body);

    await db.pollOption.deleteMany({
      where: {
        pollId: pollId,
      },
    });
    await db.poll.delete({
      where: {
        id: pollId,
      },
    });

    req.status(204).send();
  });
}
