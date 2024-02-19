import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import z from "zod";
import { db } from "../../lib/pisma";
import { redis } from "../../lib/redis";
import { voting } from "../../utios/PollPubSub";

export async function voltesPoll(app: FastifyInstance) {
  app.post("/polls/:pollId/votes", async (res, req) => {
    const votesPolsBody = z.object({
      polloptionId: z.string().uuid(),
    });

    const votesPollsParams = z.object({
      pollId: z.string().uuid(),
    });

    // pegando os dados do body
    const { polloptionId } = votesPolsBody.parse(res.body);
    // Pegando os dados da URL.
    const { pollId } = votesPollsParams.parse(res.params);

    //Pegando os cookies
    let sectionId = res.cookies.sectionId;

    // Verificando se o usuário ja votou pelo cookie
    if (sectionId) {
      // pegando O voto do usuário
      const userPreviusVoteOnPoll = await db.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId: sectionId,
            pollId: pollId,
          },
        },
      });

      // se o voto for diferente do voto que o usuario esta enviando agora nos vamos apagar o voto anterior e criar um novo.
      if (
        userPreviusVoteOnPoll &&
        userPreviusVoteOnPoll.pollOptionId !== polloptionId
      ) {
        await db.vote.delete({
          where: {
            id: userPreviusVoteOnPoll.id,
          },
        });

        const redisVotes = await redis.zincrby(
          pollId,
          -1,
          userPreviusVoteOnPoll.pollOptionId
        );

        voting.publish(pollId, {
          pollOptionId: userPreviusVoteOnPoll.pollOptionId,
          votes: Number(redisVotes),
        });

        // Caso o usuário ja tenha votado no vote que ele ta enviando nos vamos retornar um erro
      } else if (userPreviusVoteOnPoll) {
        return req
          .status(400)
          .send({ message: "You have already voted on this poll" });
      }
    }

    // caso o usuário não tenha cookie nos vamos criar um.
    if (!sectionId) {
      sectionId = randomUUID();

      req.setCookie("sectionId", sectionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        signed: true,
        httpOnly: true,
      });
    }

    // Criando um voto.
    await db.vote.create({
      data: {
        sessionId: sectionId,
        pollId: pollId,
        pollOptionId: polloptionId,
      },
    });

    const redisVotes = await redis.zincrby(pollId, 1, polloptionId);

    voting.publish(pollId, {
      pollOptionId: polloptionId,
      votes: Number(redisVotes),
    });
    req.send({ sectionId, redisVotes });
  });
}
