# Reimbursements Management System API

For detailed information about the database design and entity relationships, please refer to the [Database Schema Documentation](./SCHEMA.md).

## Base URL

```
http://localhost:3000/rest
```

## Authentication

All protected endpoints require a valid JWT stored in an **HTTP-only cookie** named `token`.
The cookie is set automatically on login and cleared on logout.

---

## Response Format

### Success
```json
{
  "status": "success",
  "data": {}
}
```

### Error
```json
{
  "status": "error",
  "message": "reason"
}
```

---

## Endpoints

### 1. Register
**POST** `/rest/onboardings/register`

**Auth:** None (Public)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@org.com",
  "password": "securepass123"
}
```

**Rules:**
- Email must be `@org.com` domain
- Default role assigned: `EMP`

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@org.com",
      "role": "EMP",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

---

### 2. Login
**POST** `/rest/onboardings/login`

**Auth:** None (Public)

**Request Body:**
```json
{
  "email": "john@org.com",
  "password": "securepass123"
}
```

**Response (200):** Sets `token` HTTP-only cookie.
```json
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "name": "John Doe", "email": "john@org.com", "role": "EMP" }
  }
}
```

---

### 3. Logout
**POST** `/rest/onboardings/logout`

**Auth:** Required (any role)

**Response (200):** Clears `token` cookie.
```json
{ "status": "success", "data": { "message": "Logged out successfully" } }
```

---

### 4. Assign Role
**POST** `/rest/roles/assign`

**Auth:** CFO only

**Request Body:**
```json
{
  "userId": "uuid-of-user",
  "role": "RM"
}
```

**Assignable roles:** `EMP`, `RM`, `APE` (CFO cannot be assigned)

**Response (200):**
```json
{ "status": "success", "data": { "user": { "id": "...", "role": "RM", ... } } }
```

---

### 5. Get Employees
**GET** `/rest/employees`

**Auth:** CFO (all users) or RM (their assigned employees)

**Response (200):**
```json
{
  "status": "success",
  "data": { "employees": [ { "id": "...", "name": "...", "role": "EMP", ... } ] }
}
```

---

### 6. Assign Employee to Manager
**POST** `/rest/employees/assign`

**Auth:** CFO only

**Request Body:**
```json
{
  "employeeId": "uuid-of-emp",
  "managerId": "uuid-of-rm"
}
```

**Rules:**
- `employeeId` user must have role `EMP`
- `managerId` user must have role `RM`

**Response (201):**
```json
{ "status": "success", "data": { "assignment": { ... } } }
```

---

### 7. Remove Employee Assignment
**DELETE** `/rest/employees/assign`

**Auth:** CFO only

**Request Body:**
```json
{
  "employeeId": "uuid-of-emp",
  "managerId": "uuid-of-rm"
}
```

**Response (200):**
```json
{ "status": "success", "data": { "message": "Assignment removed successfully" } }
```

---

### 8. Create Reimbursement
**POST** `/rest/reimbursements`

**Auth:** EMP only

**Request Body:**
```json
{
  "title": "Travel to Mumbai",
  "description": "Business trip for client meeting",
  "amount": 2500.00
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "reimbursement": {
      "id": "uuid",
      "title": "Travel to Mumbai",
      "amount": "2500.00",
      "final_status": "PENDING",
      ...
    }
  }
}
```

---

### 9. Approve / Reject Reimbursement
**PATCH** `/rest/reimbursements`

**Auth:** RM or APE

**Request Body:**
```json
{
  "reimbursementId": "uuid-of-reimbursement",
  "decision": "APPROVED",
  "remarks": "Verified and approved"
}
```

**Decision values:** `APPROVED` | `REJECTED`

**Business Rules:**
| Actor | Precondition |
|-------|-------------|
| RM | Employee must be assigned to them |
| APE | RM must have already approved |

**Final Status Logic:**
| RM Decision | APE Decision | Final Status |
|-------------|-------------|-------------|
| APPROVED | APPROVED | `APPROVED` |
| REJECTED | — | `REJECTED` |
| APPROVED | REJECTED | `REJECTED` |

**Response (200):**
```json
{ "status": "success", "data": { "reimbursement": { "final_status": "APPROVED", ... } } }
```

---

### 10. Get Reimbursements (Role-Aware)
**GET** `/rest/reimbursements`

**Auth:** Any authenticated user

**Response by Role:**

| Role | Returns |
|------|---------|
| `EMP` | Own reimbursements only |
| `RM` | PENDING reimbursements from assigned employees |
| `APE` | RM-approved, not yet processed by APE |
| `CFO` | APE-approved reimbursements |

**Response (200):**
```json
{ "status": "success", "data": { "reimbursements": [ ... ] } }
```

---

### 11. Get Reimbursements for Specific User
**GET** `/rest/reimbursements/:userId`

**Auth:** CFO (any user) or RM (only their assigned employees)

**URL Params:** `userId` — UUID of target user

**Response (200):**
```json
{ "status": "success", "data": { "reimbursements": [ ... ] } }
```

---

## Health Check

**GET** `/health`

```json
{ "status": "success", "data": { "service": "Reimbursements API", "uptime": 1234.5 } }
```

---

## Error Codes

| HTTP Code | Meaning |
|-----------|---------|
| 400 | Bad Request / Business rule violation |
| 401 | Unauthenticated / Invalid token |
| 403 | Forbidden / Insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Validation error |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
