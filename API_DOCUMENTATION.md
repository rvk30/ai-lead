# API Documentation - AILead

## Base URL
```
http://localhost:3000
```

---

## Leads API

### 1. Create Lead
**Endpoint:** `POST /api/leads/create`

**Request Body:**
```json
{
  "name": "John Doe",
  "company": "Tech Corp",
  "email": "john@techcorp.com",
  "phone": "+1234567890",
  "country": "USA",
  "city": "New York",
  "source": "Website",
  "status": "NEW"
}
```

**Required Fields:**
- `name` (string) - Lead name

**Optional Fields:**
- `company` (string) - Company name
- `email` (string) - Email address
- `phone` (string) - Phone number
- `country` (string) - Country
- `city` (string) - City
- `source` (string) - Lead source (e.g., Website, Referral, Social Media)
- `status` (string) - Lead status (default: "NEW")

**Success Response (201):**
```json
{
  "success": true,
  "message": "Lead created",
  "data": {
    "id": 1,
    "name": "John Doe",
    "company": "Tech Corp",
    "email": "john@techcorp.com",
    "phone": "+1234567890",
    "country": "USA",
    "city": "New York",
    "source": "Website",
    "status": "NEW",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Name required"
}
```

---

### 2. Get All Leads
**Endpoint:** `GET /api/leads/list`

**Query Parameters (Optional):**
- `status` - Filter by status (e.g., NEW, CONTACTED, QUALIFIED)
- `source` - Filter by source (e.g., Website, Referral)

**Examples:**
```
GET /api/leads/list
GET /api/leads/list?status=NEW
GET /api/leads/list?source=Website
GET /api/leads/list?status=NEW&source=Website
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "company": "Tech Corp",
      "email": "john@techcorp.com",
      "phone": "+1234567890",
      "country": "USA",
      "city": "New York",
      "source": "Website",
      "status": "NEW",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 3. Get Single Lead
**Endpoint:** `GET /api/leads/[id]`

**Example:**
```
GET /api/leads/1
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "company": "Tech Corp",
    "email": "john@techcorp.com",
    "phone": "+1234567890",
    "country": "USA",
    "city": "New York",
    "source": "Website",
    "status": "NEW",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Lead not found"
}
```

---

### 4. Update Lead
**Endpoint:** `PUT /api/leads/[id]`

**Example:**
```
PUT /api/leads/1
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "company": "Tech Corp",
  "email": "john@techcorp.com",
  "phone": "+1234567890",
  "country": "USA",
  "city": "New York",
  "source": "Website",
  "status": "CONTACTED"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lead updated",
  "data": {
    "id": 1,
    "name": "John Doe Updated",
    "company": "Tech Corp",
    "email": "john@techcorp.com",
    "phone": "+1234567890",
    "country": "USA",
    "city": "New York",
    "source": "Website",
    "status": "CONTACTED",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 5. Delete Lead
**Endpoint:** `DELETE /api/leads/[id]`

**Example:**
```
DELETE /api/leads/1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Lead deleted",
  "data": {
    "id": 1,
    "name": "John Doe",
    "company": "Tech Corp",
    "email": "john@techcorp.com",
    "phone": "+1234567890",
    "country": "USA",
    "city": "New York",
    "source": "Website",
    "status": "NEW",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Common Status Codes

- `200` - Success (GET, PUT, DELETE)
- `201` - Created (POST)
- `400` - Bad Request (Validation Error)
- `404` - Not Found
- `500` - Internal Server Error

---

## Testing with cURL

### Create Lead
```bash
curl -X POST http://localhost:3000/api/leads/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "company": "Tech Corp",
    "email": "john@techcorp.com",
    "phone": "+1234567890",
    "country": "USA",
    "city": "New York",
    "source": "Website",
    "status": "NEW"
  }'
```

### Get All Leads
```bash
curl http://localhost:3000/api/leads/list
```

### Get Single Lead
```bash
curl http://localhost:3000/api/leads/1
```

### Update Lead
```bash
curl -X PUT http://localhost:3000/api/leads/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "company": "Tech Corp",
    "email": "john@techcorp.com",
    "phone": "+1234567890",
    "country": "USA",
    "city": "New York",
    "source": "Website",
    "status": "CONTACTED"
  }'
```

### Delete Lead
```bash
curl -X DELETE http://localhost:3000/api/leads/1
```

---

## Testing with Postman

1. Import the collection or create requests manually
2. Set base URL: `http://localhost:3000`
3. Use the endpoints as documented above
4. Set `Content-Type: application/json` header for POST/PUT requests

---

## Database Schema

### Leads Table
```sql
CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'NEW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Common Status Values
- `NEW` - New lead
- `CONTACTED` - Lead has been contacted
- `QUALIFIED` - Lead is qualified
- `CONVERTED` - Lead converted to customer
- `LOST` - Lead lost

### Common Source Values
- `Website` - From website
- `Referral` - Referral
- `Social Media` - Social media
- `Email Campaign` - Email campaign
- `Cold Call` - Cold calling
- `Event` - Event or conference
