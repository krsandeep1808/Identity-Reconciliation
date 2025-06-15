import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { createJsonSchemaTransform } from "fastify-type-provider-zod";

const plugin = fp(
  async (fastify: FastifyInstance) => {
    fastify.register(fastifySwagger, {
      openapi: {
        info: {
          title: "Bitespeed Backend Task: Identity Reconciliation ",
          description: `Solution to the Identity Reconciliation task for the Bitespeed Backend Developer role by Vishal Kumar`,
          version: "1.0.0",
        },
        servers: [{
          url: "https://bitespeed-task.vishalx360.dev",
          description: "Remote Server"
        },
        {
          url: "http://localhost:3000",
          description: "Local Server",
        },
        ],
        tags: [{ name: "identify", description: "Identify end-points" }],
      },
      hideUntagged: true,
      stripBasePath: true,
      transform: createJsonSchemaTransform({
        skipList: ["/documentation/static/*"],
      }),
    });
    fastify.register(fastifySwaggerUI, {
      routePrefix: "/documentation",
    });
  },
  { name: "swagger" },
);

export default plugin;
