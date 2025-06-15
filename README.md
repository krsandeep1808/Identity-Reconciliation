# Identity Reconciliation

Bitespeed Backend Task: Identity Reconciliation.


This service handles the identification of users based on their email and/or phone number. The different cases and their outcomes are described below.

## API Endpoint

POST /identify

### Request Schema

The request body must include either a phone number or an email address (or both):

```json
{
  "phoneNumber": "string | null",
  "email": "string | null"
}
```

### Response

The response will include the details of the primary contact associated with the provided phone number or email.

## Cases

### Case 1: Both mobile and email are unique

- **Condition**: Neither the phone number nor the email exists in the database.
- **Action**: A new contact is created with the provided phone number and/or email.
- **Link Precedence**: Primary
- **Response**: Details of the newly created contact.

### Case 2: Both mobile and email exist

#### Case 2A: On the same contact

- **Condition**: Both the phone number and email belong to the same contact.
- **Action**: Retrieve and return the primary contact details.
- **Response**: Details of the primary contact.

#### Case 2B: On different contacts

- **Condition**: The phone number and email belong to different contacts.

##### Case 2BA: One of them is primary

- **Condition**: One contact is primary and the other is secondary.
- **Action**: Link the secondary contact to the primary contact.
- **Response**: Details of the primary contact.

##### Case 2BB: Either both are primary or both are secondary

- **Condition**: Both contacts are either primary or secondary.
- **Action**:
  - Determine the primary and secondary contact based on the creation date.
  - Update all secondary contacts to link to the new primary contact.
  - Demote the secondary contact to a secondary status and link it to the primary contact.
- **Response**: Details of the primary contact.

### Case 3: Either mobile or email is unique

- **Condition**: Only one of the phone number or email exists in the database.
- **Action**:
  - Retrieve the existing contact.
  - Create a new secondary contact with the provided phone number or email, linking it to the primary contact.
- **Link Precedence**: Secondary
- **Response**: Details of the primary contact.

## Example

### Request

```json
{
  "phoneNumber": "1234567890",
  "email": "user@example.com"
}
```

### Response

```json
{
  "id": "primary-contact-id",
  "phoneNumber": "1234567890",
  "email": "user@example.com",
  "linkedId": null,
  "linkPrecedence": "primary",
  "createdAt": "2023-05-30T12:34:56.789Z",
  "updatedAt": "2023-05-30T12:34:56.789Z"
}
```

## Error Handling

- **400 Bad Request**: If neither phone number nor email is provided.
- **500 Internal Server Error**: If an error occurs during processing.
