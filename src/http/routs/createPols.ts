import { FastifyInstance } from "fastify";
import z from "zod";
import { db } from "../../lib/pisma";

export async function createPoll(app: FastifyInstance) {
  app.post("/polls", async (res, req) => {
    const createPollBody = z.object({
      title: z.string(),
      option: z.array(z.string()),
    });
    const { title, option } = createPollBody.parse(res.body);

    const poll = await db.poll.create({
      data: {
        title: title,
        Option: {
          createMany: {
            data: option.map((option: string) => {
              return {
                title: option,
              };
            }),
          },
        },
      },
    });

    req.status(201).send(poll);
  });
}
