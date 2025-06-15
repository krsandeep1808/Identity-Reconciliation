import Fastify from "fastify";
import router from "./router";

import swagger from "./plugins/swagger";
import validator from "./plugins/validator";
import prisma from "./plugins/prisma";
import publicFIles from "./plugins/publicFIles";

const fastify = Fastify({ logger: true });

// plugins
fastify.register(swagger);
fastify.register(validator);
fastify.register(prisma)
fastify.register(publicFIles)
fastify.register(router);

export default fastify;
