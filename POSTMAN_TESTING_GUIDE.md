# Postman Testing Guide - AILead APIs

## Setup

1. Open Postman
2. Make sure your dev server is running: `npm run dev`
3. Base URL: `http://localhost:3000`

---

## 1. Create Lead (POST)

**URL:** `http://localhost:3000/api/leads/create`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
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

**Expected Response (201):**
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

---

## 2. Get All Leads (GET)

**URL:** `http://localhost:3000/api/leads/all`

**Method:** `GET`

**Headers:** None required

**Body:** None

**Expected Response (200):**
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
  ]
}
```

---

## 3. Get Leads with Filters (GET)

**URL:** `http://localhost:3000/api/leads/list`

**Method:** `GET`

**Headers:** None required

**Query Parameters (Optional):**
- `status` - Filter by status
- `source` - Filter by source

**Examples:**

### Get all NEW leads:
```
http://localhost:3000/api/leads/list?status=NEW
```

### Get all leads from Website:
```
http://localhost:3000/api/leads/list?source=Website
```

### Get NEW leads from Website:
```
http://localhost:3000/api/leads/list?status=NEW&source=Website
```

**Expected Response (200):**
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

## 4. Search Leads by Name (GET)

**URL:** `http://localhost:3000/api/leads/search?name=john`

**Method:** `GET`

**Headers:** None required

**Query Parameters:**
- `name` (required) - Search term for lead name (case-insensitive, partial match)

**Examples:**

### Search for "john":
```
http://localhost:3000/api/leads/search?name=john
```

### Search for "doe":
```
http://localhost:3000/api/leads/search?name=doe
```

### Search for "tech":
```
http://localhost:3000/api/leads/search?name=tech
```

**Expected Response (200):**
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
  ]
}
```

**Error Response (400) - Missing name parameter:**
```json
{
  "success": false,
  "message": "Name parameter is required"
}
```

---

## 5. Filter Leads by Status (GET)

**URL:** `http://localhost:3000/api/leads/filter?status=NEW`

**Method:** `GET`

**Headers:** None required

**Query Parameters:**
- `status` (required) - Filter leads by exact status match

**Examples:**

### Get all NEW leads:
```
http://localhost:3000/api/leads/filter?status=NEW
```

### Get all CONTACTED leads:
```
http://localhost:3000/api/leads/filter?status=CONTACTED
```

### Get all QUALIFIED leads:
```
http://localhost:3000/api/leads/filter?status=QUALIFIED
```

### Get all CONVERTED leads:
```
http://localhost:3000/api/leads/filter?status=CONVERTED
```

**Expected Response (200):**
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
  ]
}
```

**Error Response (400) - Missing status parameter:**
```json
{
  "success": false,
  "message": "Status parameter is required"
}
```

---

## 6. Get Single Lead (GET)

**URL:** `http://localhost:3000/api/leads/1`

**Method:** `GET`

**Headers:** None required

**Body:** None

**Note:** Replace `1` with the actual lead ID

**Expected Response (200):**
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

---

## 7. Update Lead (PUT)

**URL:** `http://localhost:3000/api/leads/1`

**Method:** `PUT`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "John Doe Updated",
  "company": "Tech Corp",
  "email": "john.updated@techcorp.com",
  "phone": "+1234567890",
  "country": "USA",
  "city": "New York",
  "source": "Website",
  "status": "CONTACTED"
}
```

**Note:** Replace `1` with the actual lead ID

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Lead updated",
  "data": {
    "id": 1,
    "name": "John Doe Updated",
    "company": "Tech Corp",
    "email": "john.updated@techcorp.com",
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

## 8. Delete Lead (DELETE)

**URL:** `http://localhost:3000/api/leads/1`

**Method:** `DELETE`

**Headers:** None required

**Body:** None

**Note:** Replace `1` with the actual lead ID

**Expected Response (200):**
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

## Testing Flow (Step by Step)

### Step 1: Create Multiple Leads
Use the **Create Lead** endpoint to add 3-4 test leads with different data.

**Lead 1:**
```json
{
  "name": "Alice Johnson",
  "company": "ABC Corp",
  "email": "alice@abc.com",
  "phone": "+1111111111",
  "country": "USA",
  "city": "Los Angeles",
  "source": "Website",
  "status": "NEW"
}
```

**Lead 2:**
```json
{
  "name": "Bob Smith",
  "company": "XYZ Inc",
  "email": "bob@xyz.com",
  "phone": "+2222222222",
  "country": "UK",
  "city": "London",
  "source": "Referral",
  "status": "CONTACTED"
}
```

**Lead 3:**
```json
{
  "name": "Charlie Brown",
  "company": "Tech Startup",
  "email": "charlie@startup.com",
  "phone": "+3333333333",
  "country": "Canada",
  "city": "Toronto",
  "source": "Social Media",
  "status": "QUALIFIED"
}
```

### Step 2: Get All Leads
Use **Get All Leads** endpoint to see all created leads.

### Step 3: Search Leads
Try searching for leads by name:
- Search for "Alice"
- Search for "Bob"
- Search for "Johnson"

### Step 4: Filter Leads
Try different filters:
- Get only NEW leads using `/api/leads/list?status=NEW`
- Get only Website leads using `/api/leads/list?source=Website`
- Get NEW leads from Website using `/api/leads/list?status=NEW&source=Website`

### Step 5: Filter by Status Only
Try the new filter endpoint:
- Get NEW leads using `/api/leads/filter?status=NEW`
- Get CONTACTED leads using `/api/leads/filter?status=CONTACTED`
- Get QUALIFIED leads using `/api/leads/filter?status=QUALIFIED`

### Step 6: Get Single Lead
Pick an ID from the list and get that specific lead.

### Step 7: Update Lead
Update one of the leads (change status from NEW to CONTACTED).

### Step 8: Delete Lead
Delete one of the test leads.

### Step 8: Verify
Get all leads again to verify the changes.

---

## Common Status Values

- `NEW` - New lead
- `CONTACTED` - Lead has been contacted
- `QUALIFIED` - Lead is qualified
- `CONVERTED` - Lead converted to customer
- `LOST` - Lead lost

## Common Source Values

- `Website` - From website
- `Referral` - Referral
- `Social Media` - Social media
- `Email Campaign` - Email campaign
- `Cold Call` - Cold calling
- `Event` - Event or conference

---

## Troubleshooting

### Error: "Cannot POST /api/leads/create"
- Make sure dev server is running: `npm run dev`
- Check the URL is correct

### Error: "Name required"
- Make sure you're sending the `name` field in the request body
- Check that Content-Type header is set to `application/json`

### Error: "Lead not found"
- The lead ID doesn't exist in the database
- Check the ID is correct

### Error: Database connection error
- Make sure PostgreSQL is running
- Check `.env.local` file has correct database credentials
- Verify the `leads` table exists in your database

---

## Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/leads/create` | POST | Create new lead |
| `/api/leads/all` | GET | Get all leads |
| `/api/leads/list` | GET | Get leads with filters |
| `/api/leads/search` | GET | Search leads by name |
| `/api/leads/filter` | GET | Filter leads by status |
| `/api/leads/[id]` | GET | Get single lead |
| `/api/leads/[id]` | PUT | Update lead |
| `/api/leads/[id]` | DELETE | Delete lead |

---

Happy Testing! 🚀
