import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { categorize, getContactDetails, getPrimaryContactId } from "../utils";

const IDENTIFY_SCHEMA = z.object({
  phoneNumber: z.string().describe("Phone Number of the user").nullable(),
  email: z.string().email().describe("Email of the user account").nullable(),
}).refine((data) => data.phoneNumber !== null || data.email !== null, "Either phoneNumber or email must be provided");
export default async function identifyController(fastify: FastifyInstance) {
  // POST /identify
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/identify",
    schema: {
      body: IDENTIFY_SCHEMA,
      security: [],
      tags: ["identify"],
      description: "Identify a user",
    },
    handler: async (request, reply) => {
      const email = request.body.email;
      const phoneNumber = request.body.phoneNumber;
      if (email === null && phoneNumber === null) {
        return reply.code(400).send("Either email or phoneNumber must be provided");
      }
      try {
        console.log("Request body:", request.body);
        const contactWithEmail = await fastify.prisma.contact.findFirst({
          where: { email: email === null ? undefined : email },
          include: {
            linkedContact: true
          }
        });
        const contactWithPhone = await fastify.prisma.contact.findFirst({
          where: { phoneNumber: phoneNumber === null ? undefined : phoneNumber },
          include: {
            linkedContact: true
          }
        });

        // Case 1: Both mobile and email are unique
        if (!contactWithPhone && !contactWithEmail) {
          console.log("Creating new contact");
          const newContact = await fastify.prisma.contact.create({
            data: {
              phoneNumber,
              email,
              linkPrecedence: "primary"
            },
          });
          return reply.code(200).send(await getContactDetails(newContact.id, fastify.prisma));
        }
        // Case 2: Both mobile and email exist
        else if (contactWithEmail && contactWithPhone) {
          // Case 2A: On same contact
          const sameContact = contactWithEmail.id === contactWithPhone.id ? contactWithEmail : null;
          if (sameContact) {
            const primaryContactId = await getPrimaryContactId(sameContact.id, fastify.prisma);
            return reply.code(200).send(await getContactDetails(primaryContactId, fastify.prisma));
          }
          // Case 2B: On different contacts
          const categorization = categorize(contactWithEmail, contactWithPhone);

          switch (categorization.category) {
            // Case 2BA: One of them is primary
            case "primaryAndSecondary":
              const primaryContact = categorization.primary!;
              const secondaryContact = categorization.secondary!;
              await fastify.prisma.contact.update({
                where: { id: secondaryContact.id },
                data: {
                  linkedId: primaryContact.id,
                },
              });
              return reply.code(200).send(await getContactDetails(primaryContact.id, fastify.prisma));
            // Case 2BB: Either both are primary or both are secondary
            case "bothSecondary":
            case "bothPrimary":
              let primaryContactID, secondaryContactID;

              // Determine the primary and secondary contact based on creation date
              if ((contactWithEmail.linkedContact?.createdAt ?? contactWithEmail.createdAt) < (contactWithPhone.linkedContact?.createdAt ?? contactWithPhone.createdAt)) {
                primaryContactID = contactWithEmail.linkedContact?.id ?? contactWithEmail.id;
                secondaryContactID = contactWithPhone.linkedContact?.id ?? contactWithPhone.id;
              } else {
                primaryContactID = contactWithPhone.linkedContact?.id ?? contactWithPhone.id;
                secondaryContactID = contactWithEmail.linkedContact?.id ?? contactWithEmail.id;
              }
              // Update all secondary contacts to primary contact
              await fastify.prisma.contact.updateMany({
                where: { linkedId: secondaryContactID },
                data: {
                  linkedId: primaryContactID
                },
              });
              // Demote the primary contact to secondary
              await fastify.prisma.contact.update({
                where: { id: secondaryContactID },
                data: {
                  linkPrecedence: "secondary",
                  linkedId: primaryContactID,
                },
              });
              return reply.code(200).send(await getContactDetails(primaryContactID, fastify.prisma));
          }
        }
        else {
          // Case 3: Either mobile or email is unique
          const existingContact = (contactWithEmail || contactWithPhone)!;
          const primaryContactId = await getPrimaryContactId(existingContact.id, fastify.prisma);
          await fastify.prisma.contact.create({
            data: {
              phoneNumber,
              email,
              linkPrecedence: "secondary",
              linkedId: primaryContactId,
            },
          });
          return reply.code(200).send(await getContactDetails(primaryContactId, fastify.prisma));
        }
      } catch (e) {
        console.error("Error:", e);
        return reply.code(500).send(e);
      }
    },
  });
}
