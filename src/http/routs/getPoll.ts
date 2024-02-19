import { FastifyInstance } from "fastify";
import z from "zod";
import { db } from "../../lib/pisma";
import { redis } from "../../lib/redis";

export async function getPoll(app: FastifyInstance) {
  app.get("/polls/:pollId", async (res, req) => {
    const getPollInfs = z.object({
      pollId: z.string().uuid(),
    });
    const { pollId } = getPollInfs.parse(res.params);

    const getPoll = await db.poll.findUnique({
      where: {
        id: pollId,
      },
      include: {
        Option: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!getPoll) {
      req.status(404).send({ messagen: "Poll not found" });
    }

    //Pegando todos os votos das polls no redis.
    const VotesOption = await redis.zrange(pollId, 0, -1, "WITHSCORES");
    // Como o objeto vai ser, a key dele vai ser string e o value e number.
    const VotosFinal = VotesOption.reduce((obj, line, index) => {
      if (index % 2 === 0) {
        const score = VotesOption[index + 1];

        Object.assign(obj, { [line]: Number(score) });
      }

      return obj;
    }, {} as Record<string, number>);
    req.send({
      poll: {
        id: getPoll?.id,
        title: getPoll?.title,
        options: getPoll?.Option.map((option) => {
          return {
            id: option.id,
            title: option.title,
            score: option.id in VotosFinal ? VotosFinal[option.id] : 0,
          };
        }),
      },
    });
  });
}
