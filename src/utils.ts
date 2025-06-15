import { Contact, PrismaClient } from "@prisma/client";

export function categorize(firstContact: Contact, secondContact: Contact) {
    if (firstContact.linkPrecedence === "primary" && secondContact.linkPrecedence === "primary") {
        return { category: "bothPrimary" };
    } else if (firstContact.linkPrecedence === "primary" && secondContact.linkPrecedence === "secondary") {
        return { category: "primaryAndSecondary", primary: firstContact, secondary: secondContact };
    } else if (firstContact.linkPrecedence === "secondary" && secondContact.linkPrecedence === "primary") {
        return { category: "primaryAndSecondary", primary: secondContact, secondary: firstContact };
    } else {
        return { category: "bothSecondary" };
    }
}

export async function getPrimaryContactId(id: number, prisma: PrismaClient) {
    const contact = await prisma.contact.findUnique({
        where: { id },
    });
    if (contact && contact?.linkPrecedence == "secondary") {
        return contact.linkedId!;
    }
    return id;
}


export async function getContactDetails(id: number, prisma: PrismaClient) {
    const currentContact = await prisma.contact.findUnique({
        where: { id },
        include: {
            contacts: {
                select: {
                    id: true,
                    phoneNumber: true,
                    email: true,
                },
            },
        },
    });
    console.log("Current Contact:", currentContact);
    if (!currentContact) return null;
    return formatContactDetails(currentContact);
}

function formatContactDetails(currentContact: ({
    contacts: {
        id: number;
        phoneNumber: string | null;
        email: string | null;
    }[];
} & Contact)) {
    return {
        contact: {
            primaryContactId: currentContact?.linkedId || currentContact.id,
            emails: [...new Set(currentContact.contacts.map((contact) => contact.email).concat(currentContact.email))],
            phoneNumbers: [...new Set(currentContact.contacts.map((contact) =>
                contact.phoneNumber
            ).concat(currentContact.phoneNumber))],
            secondaryContactIds: [...new Set(currentContact.contacts.map((contact) => contact.id))]
        },
    };
}
