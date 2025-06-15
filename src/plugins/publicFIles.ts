import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import path from "node:path";

const plugin = fp(
    async (fastify: FastifyInstance) => {
        fastify.register(require('@fastify/static'), {
            root: path.join(__dirname, '../public'),
        })
    },
    { name: "publicFiles" },
);

export default plugin;
