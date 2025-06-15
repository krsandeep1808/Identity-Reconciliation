import { FastifyInstance } from "fastify";
import identifyController from "./controller/identifyController";

export default async function router(fastify: FastifyInstance) {
  fastify.register(identifyController);
}
