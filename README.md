# Beauty E-Commerce API

A REST API for a beauty / cosmetics store, built with Express and MongoDB Atlas.
It provides product browsing and management, user accounts, JWT authentication,
role-based authorization and image uploads.

This repository contains the **backend only**. The frontend is a separate
project that consumes this API over HTTP.

---

## Table of contents

1. [Technologies](#1-technologies)
2. [Folder structure](#2-folder-structure)
3. [Installation](#3-installation)
4. [Environment variables](#4-environment-variables)
5. [MongoDB Atlas setup](#5-mongodb-atlas-setup)
6. [Running the server](#6-running-the-server)
7. [Seeding the database](#7-seeding-the-database)
8. [Test credentials](#8-test-credentials)
9. [Authentication and authorization](#9-authentication-and-authorization)
10. [Image uploads](#10-image-uploads)
11. [Response format](#11-response-format)
12. [API reference](#12-api-reference)
13. [Connecting a frontend](#13-connecting-a-frontend)

---

## 1. Technologies

| Package             | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| `express`           | HTTP server and routing                        |
| `mongoose`          | MongoDB ODM, schemas and validation            |
| `dotenv`            | Loads configuration from `.env`                |
| `bcryptjs`          | Password hashing (12 salt rounds)              |
| `jsonwebtoken`      | JWT signing and verification                   |
| `multer`            | `multipart/form-data` image uploads            |
| `cors`              | Cross-origin access for the frontend           |
| `express-validator` | Request body / param / query validation        |
| `nodemon` (dev)     | Auto-restart during development                |

Runtime: Node.js 18+ (developed and tested on Node 24).

---

## 2. Folder structure

```
backend/
├── config/
│   ├── db.js                     MongoDB Atlas connection
│   └── env.js                    Loads and validates .env
├── controllers/
│   ├── auth-controllers.js       register, login, me
│   ├── product-controllers.js    product CRUD
│   └── user-controllers.js       profile + admin user management
├── middleware/
│   ├── auth-middleware.js        protect (JWT) + authorize (roles)
│   ├── error-middleware.js       404 handler + central error handler
│   ├── upload-middleware.js      multer config, file validation
│   └── validate-middleware.js    express-validator result handler
├── models/
│   ├── product-model.js          Product schema
│   └── user-model.js             User schema + password hashing
├── routes/
│   ├── auth-routes.js            /api/v1/auth
│   ├── product-routes.js         /api/v1/products
│   └── user-routes.js            /api/v1/users
├── seed/
│   ├── products.json             48 sample products (Egyptian brands)
│   ├── generate-images.js        Draws the product images as SVG
│   ├── users.json                6 sample users
│   └── seed.js                   Seeder script
├── uploads/                      Uploaded images (git-ignored)
├── utils/
│   ├── api-error.js              Error class carrying an HTTP status
│   ├── async-handler.js          Async route wrapper
│   └── generate-token.js         JWT signing
├── .env                          Your local config (NOT committed)
├── .env.example                  Template for .env
├── .gitignore
├── package.json
├── README.md
└── server.js                     App entry point
```

---

## 3. Installation

```bash
cd backend
npm install
```

---

## 4. Environment variables

Copy the template and fill in your values:

```bash
cp .env.example .env
```

| Variable             | Required | Example                                | Description                                              |
| -------------------- | -------- | -------------------------------------- | -------------------------------------------------------- |
| `PORT`               | no       | `5000`                                 | Port the API listens on. Defaults to `5000`.             |
| `NODE_ENV`           | no       | `development`                          | `development` or `production`.                            |
| `MONGODB_URI`        | **yes**  | `mongodb+srv://user:pass@cluster0...`  | Atlas connection string.                                 |
| `DB_NAME`            | **yes**  | `kenzy`                                | Database name inside the cluster.                        |
| `JWT_SECRET`         | **yes**  | a long random string                   | Secret used to sign tokens.                              |
| `JWT_EXPIRES_IN`     | no       | `7d`                                   | Token lifetime. Defaults to `7d`.                        |
| `CLIENT_URL`         | no       | `http://localhost:4200`                | Comma-separated allowed CORS origins. Empty = allow all. |
| `MAX_UPLOAD_SIZE_MB` | no       | `5`                                    | Maximum image size in MB. Defaults to `5`.               |

The server **refuses to start** if `MONGODB_URI`, `DB_NAME` or `JWT_SECRET` is
missing, so it never runs half-configured.

Generate a strong JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`.env` is listed in `.gitignore` and must never be committed.

---

## 5. MongoDB Atlas setup

1. Sign in at <https://cloud.mongodb.com> and create (or open) a cluster.
2. **Database Access** → add a database user with a username and password, and
   give it *Read and write to any database*.
3. **Network Access** → *Add IP Address*. Use your current IP, or `0.0.0.0/0`
   to allow any IP while developing.
4. **Connect** → *Drivers* → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
   ```
5. Paste it into `.env` as `MONGODB_URI`, replacing `<username>` and
   `<password>` with the database user you created.
6. Set `DB_NAME` to the database you want to use, for example `kenzy`. Atlas
   creates it automatically on first write, so it does not need to exist yet.

---

## 6. Running the server

```bash
npm run dev     # development, auto-restarts on file changes (nodemon)
npm start       # plain node
```

On success:

```
MongoDB connected: ac-xxxxxxx.mongodb.net (database: kenzy)
Server running in development mode on http://localhost:5000
```

Quick checks:

```bash
curl http://localhost:5000/
curl http://localhost:5000/api/v1/health
```

`GET /api/v1/health` reports whether the database is connected — useful as a
first check from the frontend.

---

## 7. Seeding the database

```bash
npm run seed            # wipe users + products, then import the sample data
npm run seed:destroy    # remove all users and products
```

The seeder creates **6 users** (2 admins, 4 normal users) and **48 products**
from 14 real Egyptian brands across the four categories (`skincare`, `makeup`,
`perfume`, `sets`), priced in EGP for the Egyptian market.

Product images are generated, not downloaded — see
`seed/generate-images.js`. Re-run it after editing `seed/products.json`:

```bash
node seed/generate-images.js   # writes uploads/ + image paths back into products.json
npm run seed
```

Passwords are passed through the `User` model, so its `pre("save")` hook hashes
each one with bcrypt. **No plaintext password is ever written to MongoDB.**

> The seeder only touches the `users` and `products` collections. Any other
> collection in the database is left untouched.

---

## 8. Test credentials

For **local development and testing only**. Change or remove these before
deploying anything publicly.

| Role  | Email                   | Password    |
| ----- | ----------------------- | ----------- |
| admin | `admin@belleza.test`    | `Admin@123` |
| admin | `nour@belleza.test`     | `Admin@123` |
| user  | `customer@belleza.test` | `User@123`  |
| user  | `mariam@belleza.test`   | `User@123`  |
| user  | `yara@belleza.test`     | `User@123`  |
| user  | `salma@belleza.test`    | `User@123`  |

---

## 9. Authentication and authorization

### Roles

| Role    | Can do                                                                       |
| ------- | ---------------------------------------------------------------------------- |
| `user`  | Browse products, manage their own profile.                                    |
| `admin` | Everything a user can, plus create/update/delete products and manage users.   |

New accounts are **always** created with the role `user`. Sending
`"role": "admin"` to the register endpoint is ignored — only an existing admin
can promote someone through `PATCH /api/v1/users/:id/role`.

### Getting a token

`POST /api/v1/auth/register` and `POST /api/v1/auth/login` both return a JWT:

```json
{
  "status": "success",
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": { "_id": "...", "name": "Studio Admin", "role": "admin", "...": "..." }
}
```

### Using a token

Send it on every protected request:

```
Authorization: Bearer <token>
```

The token payload contains `{ id, email, role, iat, exp }` and is valid for
`JWT_EXPIRES_IN` (7 days by default).

### What the middleware does

* `protect` — verifies the token, loads the user, and puts it on `req.user`.
  Returns **401** for a missing, malformed, expired or unknown-user token, and
  for a deactivated account.
* `authorize("admin")` — runs after `protect` and returns **403** when the
  authenticated user does not hold the required role.

---

## 10. Image uploads

* Send the request as `multipart/form-data` with the file in a field named
  **`image`**.
* Allowed types: `jpg`, `jpeg`, `png`, `webp`.
* Maximum size: `MAX_UPLOAD_SIZE_MB` (5 MB by default).
* Files are saved to `uploads/` with a generated unique name; only the **path**
  is stored in MongoDB, never the binary.
* The stored value looks like `/uploads/image-1789484890930-858823ba17fb.png`
  and is served statically:
  `http://localhost:5000/uploads/image-1789484890930-858823ba17fb.png`
* Uploading a replacement image on update deletes the previous file from disk;
  so does deleting the product or user.
* Products can be created and updated **with or without** an image, and with
  either `application/json` or `multipart/form-data`.

To build a full URL in the frontend: `` `${API_ORIGIN}${product.image}` ``
(check that `product.image` is not an empty string first).

---

## 11. Response format

Every response uses the same envelope.

**Success**

```json
{ "status": "success", "data": { } }
```

List endpoints add `results` and `pagination`:

```json
{
  "status": "success",
  "results": 12,
  "pagination": {
    "total": 22, "page": 1, "limit": 12, "totalPages": 2,
    "hasNextPage": true, "hasPrevPage": false
  },
  "data": [ ]
}
```

**Error**

```json
{ "status": "error", "message": "Product not found" }
```

Validation failures add a per-field breakdown:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    { "field": "price", "message": "Price must be a number greater than or equal to 0" },
    { "field": "category", "message": "Category must be one of: skincare, makeup, perfume, sets" }
  ]
}
```

### Status codes

| Code | Meaning                                                           |
| ---- | ----------------------------------------------------------------- |
| 200  | OK                                                                |
| 201  | Created                                                           |
| 400  | Validation error, invalid ObjectId, bad upload, malformed JSON     |
| 401  | Not authenticated — missing, invalid or expired token; bad login   |
| 403  | Authenticated but not allowed (admin-only route)                  |
| 404  | Resource or route not found                                       |
| 409  | Duplicate — an account with that email already exists             |
| 500  | Unexpected server error (details are logged, not sent to clients)  |

---

## 12. API reference

Base URL: `http://localhost:5000/api/v1`

| Method | Endpoint                | Auth | Role  |
| ------ | ----------------------- | ---- | ----- |
| GET    | `/health`               | no   | —     |
| POST   | `/auth/register` (alias `/auth/signup`) | no | — |
| POST   | `/auth/login` (alias `/auth/signin`)    | no | — |
| GET    | `/auth/me`              | yes  | any   |
| GET    | `/users/me`             | yes  | any   |
| PUT    | `/users/me`             | yes  | any   |
| DELETE | `/users/me`             | yes  | any   |
| GET    | `/users/me/wishlist`    | yes  | any   |
| POST   | `/users/me/wishlist/:productId`   | yes | any |
| DELETE | `/users/me/wishlist/:productId`   | yes | any |
| GET    | `/users`                | yes  | admin |
| GET    | `/users/:id`            | yes  | admin |
| PATCH  | `/users/:id/role`       | yes  | admin |
| DELETE | `/users/:id`            | yes  | admin |
| GET    | `/products`             | no   | —     |
| GET    | `/products/categories`  | no   | —     |
| GET    | `/products/:id`         | no   | —     |
| POST   | `/products`             | yes  | admin |
| PUT    | `/products/:id`         | yes  | admin |
| PATCH  | `/products/:id`         | yes  | admin |
| DELETE | `/products/:id`         | yes  | admin |

---

### AUTH

#### `POST /api/v1/auth/register`

Create an account. **Public.**
Content-Type: `application/json` *or* `multipart/form-data` (to set an avatar).

| Field     | Type   | Required | Rules                          |
| --------- | ------ | -------- | ------------------------------ |
| `name`    | string | yes      | 2–60 characters                |
| `email`   | string | yes      | valid email, must be unique    |
| `password`| string | yes      | 6–128 characters               |
| `phone`   | string | no       | max 30 characters              |
| `address` | object | no       | `street`, `city`, `country`, `postalCode` |
| `image`   | file   | no       | jpg / jpeg / png / webp, ≤ 5 MB |

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Laila Hassan","email":"laila@example.com","password":"Secret123"}'
```

**201**

```json
{
  "status": "success",
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "6aa95eca3dc5e59ad9507944",
    "name": "Laila Hassan",
    "email": "laila@example.com",
    "role": "user",
    "image": "",
    "phone": "",
    "address": { "street": "", "city": "", "country": "", "postalCode": "" },
    "active": true,
    "createdAt": "2026-09-15T15:05:46.128Z",
    "updatedAt": "2026-09-15T15:05:46.128Z"
  }
}
```

**Errors:** `400` validation failed · `409` email already registered.

---

#### `POST /api/v1/auth/login`

Exchange credentials for a token. **Public.** `application/json`.

| Field      | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | yes      |
| `password` | string | yes      |

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@belleza.test","password":"Admin@123"}'
```

**200**

```json
{
  "status": "success",
  "message": "Logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": { "_id": "...", "name": "Studio Admin", "email": "admin@belleza.test", "role": "admin" }
}
```

**Errors:** `400` validation failed · `401` invalid email or password, or the
account is deactivated.

> A wrong password and an unknown email return the same message, so the endpoint
> cannot be used to discover which emails are registered.

---

#### `GET /api/v1/auth/me`

Return the signed-in user. **Auth required.** Useful on app start to check that
a stored token is still valid.

```bash
curl http://localhost:5000/api/v1/auth/me -H "Authorization: Bearer <token>"
```

**200** → `{ "status": "success", "data": { } }` · **Errors:** `401`.

---

### USERS

#### `GET /api/v1/users/me`

The signed-in user's profile. **Auth required**, any role.

```bash
curl http://localhost:5000/api/v1/users/me -H "Authorization: Bearer <token>"
```

**200**

```json
{
  "status": "success",
  "data": {
    "_id": "6aa95e2af0e50f9c23af68c3",
    "name": "Laila Hassan",
    "email": "customer@belleza.test",
    "role": "user",
    "image": "",
    "phone": "+20 100 000 0003",
    "address": { "street": "9 Nile View", "city": "Giza", "country": "Egypt", "postalCode": "12511" },
    "active": true
  }
}
```

**Errors:** `401`.

---

#### `PUT /api/v1/users/me`

Update your own profile. **Auth required**, any role.
`PATCH` behaves identically. Content-Type: `application/json` *or*
`multipart/form-data` (to change the avatar). Only the fields you send change.

| Field                | Type   | Rules                                 |
| -------------------- | ------ | ------------------------------------- |
| `name`               | string | 2–60 characters                       |
| `email`              | string | valid, must not belong to another user |
| `password`           | string | 6–128 characters, re-hashed on save   |
| `phone`              | string | max 30 characters                     |
| `address.street/city/country/postalCode` | string | merged with the existing address |
| `image`              | file   | jpg / jpeg / png / webp, ≤ 5 MB       |

```bash
curl -X PUT http://localhost:5000/api/v1/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Laila H.","address":{"city":"Luxor"}}'
```

With an avatar:

```bash
curl -X PUT http://localhost:5000/api/v1/users/me \
  -H "Authorization: Bearer <token>" \
  -F "name=Laila H." \
  -F "image=@./avatar.png"
```

**200** → `{ "status": "success", "message": "Profile updated successfully", "data": { } }`

**Errors:** `400` validation failed, or `role` was included (roles cannot be
changed here) · `401` · `409` email already taken.

---

#### `DELETE /api/v1/users/me`

Deactivate your own account. **Auth required**, any role.
This is a soft delete: the record is kept but the account can no longer log in
and its existing tokens stop working.

```bash
curl -X DELETE http://localhost:5000/api/v1/users/me -H "Authorization: Bearer <token>"
```

**200** → `{ "status": "success", "message": "Your account has been deactivated." }`
· **Errors:** `401`.

---

#### `GET /api/v1/users/me/wishlist`

The signed-in user's saved products. **Auth required**, any role.

The wishlist is stored on the user as an array of product `ObjectId`s
(`ref: "Product"`). This endpoint uses Mongoose's `populate()` to return the
full product documents instead, so the frontend can render cards from a single
request.

```bash
curl http://localhost:5000/api/v1/users/me/wishlist -H "Authorization: Bearer <token>"
```

**200**

```json
{
  "status": "success",
  "results": 2,
  "data": [
    { "_id": "6aa95f6d...", "name": "Cloud Cheek Blush Balm", "price": 32,
      "category": "makeup", "brand": "Studio Noir", "image": "", "stock": 9 }
  ]
}
```

**Errors:** `401`.

---

#### `POST /api/v1/users/me/wishlist/:productId`

Add a product to your wishlist. **Auth required**, any role.

```bash
curl -X POST http://localhost:5000/api/v1/users/me/wishlist/6aa95f6d... \
  -H "Authorization: Bearer <token>"
```

**200** → `{ "status": "success", "message": "Product added to your wishlist", "results": 1, "data": [ ] }`

**Errors:** `400` invalid id · `401` · `404` product does not exist ·
`409` already in the wishlist.

---

#### `DELETE /api/v1/users/me/wishlist/:productId`

Remove a product from your wishlist. **Auth required**, any role.

**200** → `{ "status": "success", "message": "Product removed from your wishlist", "results": 0, "data": [ ] }`

**Errors:** `400` invalid id · `401` · `404` not in your wishlist.

---

#### `GET /api/v1/users`

List all users. **Auth required — admin only.**

| Query    | Type    | Description                                   |
| -------- | ------- | --------------------------------------------- |
| `page`   | number  | Page number, default `1`                      |
| `limit`  | number  | Page size, default `20`                       |
| `role`   | string  | `user` or `admin`                             |
| `active` | boolean | `true` or `false`                             |
| `search` | string  | Matches name or email, case-insensitive       |

```bash
curl "http://localhost:5000/api/v1/users?role=user&limit=10" \
  -H "Authorization: Bearer <admin-token>"
```

**200**

```json
{
  "status": "success",
  "results": 4,
  "pagination": { "total": 4, "page": 1, "limit": 10, "totalPages": 1 },
  "data": [ { "_id": "...", "name": "Laila Hassan", "role": "user" } ]
}
```

**Errors:** `401` no token · `403` not an admin.

---

#### `GET /api/v1/users/:id`

A single user by id. **Auth required — admin only.**

**200** → `{ "status": "success", "data": { } }`
**Errors:** `400` invalid id · `401` · `403` · `404` user not found.

---

#### `PATCH /api/v1/users/:id/role`

Change a user's role. **Auth required — admin only.** `application/json`.

| Field  | Type   | Required | Rules               |
| ------ | ------ | -------- | ------------------- |
| `role` | string | yes      | `user` or `admin`   |

```bash
curl -X PATCH http://localhost:5000/api/v1/users/6aa95e2a.../role \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

**200** → `{ "status": "success", "message": "Role updated to 'admin'.", "data": { } }`

**Errors:** `400` invalid id, invalid role, or you tried to change your own role
· `401` · `403` · `404`.

> Admins cannot change their own role, which prevents locking every admin out.

---

#### `DELETE /api/v1/users/:id`

Permanently delete a user (and their avatar file). **Auth required — admin only.**

```bash
curl -X DELETE http://localhost:5000/api/v1/users/6aa95e2a... \
  -H "Authorization: Bearer <admin-token>"
```

**200** → `{ "status": "success", "message": "User deleted successfully.", "data": { } }`

**Errors:** `400` invalid id, or you tried to delete your own account · `401` ·
`403` · `404`.

---

### PRODUCTS

#### Product object

```json
{
  "_id": "6aa95e2cf0e50f9c23af68c6",
  "name": "Velvet Rose Hydrating Serum",
  "description": "A weightless hyaluronic serum layered with damask rose extract...",
  "price": 68,
  "category": "skincare",
  "brand": "Maison Belle",
  "stock": 42,
  "image": "",
  "inStock": true,
  "createdBy": "6aa95e2af0e50f9c23af68c1",
  "createdAt": "2026-09-15T15:02:04.286Z",
  "updatedAt": "2026-09-15T15:02:04.286Z"
}
```

`inStock` is derived from `stock > 0`. `image` is `""` when no image is set.

On `GET /products/:id`, `createdBy` is **populated** into the admin's document
(`{ _id, name, email, role }`) instead of a bare id. In the list endpoint it
stays an id, to keep the payload small.

---

#### `GET /api/v1/products`

List products. **Public.**

| Query      | Type    | Description                                                        |
| ---------- | ------- | ------------------------------------------------------------------ |
| `page`     | number  | Page number, default `1`                                           |
| `limit`    | number  | Page size, default `12`, max `100`                                 |
| `category` | string  | `skincare` \| `makeup` \| `perfume` \| `sets`                      |
| `brand`    | string  | Exact brand name, case-insensitive                                 |
| `search`   | string  | Matches name, description or brand                                 |
| `minPrice` | number  | Minimum price                                                      |
| `maxPrice` | number  | Maximum price                                                      |
| `inStock`  | boolean | `true` = in stock only, `false` = out of stock only                |
| `sort`     | string  | `newest` (default) \| `oldest` \| `price-asc` \| `price-desc` \| `name` |

```bash
curl "http://localhost:5000/api/v1/products?category=perfume&sort=price-desc&page=1&limit=3"
```

**200**

```json
{
  "status": "success",
  "results": 3,
  "pagination": {
    "total": 5, "page": 1, "limit": 3, "totalPages": 2,
    "hasNextPage": true, "hasPrevPage": false
  },
  "data": [
    { "_id": "...", "name": "Amber Nuit Eau de Parfum", "price": 168, "category": "perfume" }
  ]
}
```

**Errors:** `400` invalid query value (e.g. `limit=999`, unknown `category`).

---

#### `GET /api/v1/products/categories`

Every category and brand currently in use — for building filter menus. **Public.**

```bash
curl http://localhost:5000/api/v1/products/categories
```

**200**

```json
{
  "status": "success",
  "data": {
    "categories": ["makeup", "perfume", "sets", "skincare"],
    "brands": ["Atelier Skin", "Lune Paris", "Maison Belle", "Studio Noir"]
  }
}
```

---

#### `GET /api/v1/products/:id`

A single product. **Public.**

```bash
curl http://localhost:5000/api/v1/products/6aa95e2cf0e50f9c23af68c6
```

**200** → `{ "status": "success", "data": { } }`

**Errors:** `400` `id` is not a valid ObjectId · `404` product not found.

---

#### `POST /api/v1/products`

Create a product. **Auth required — admin only.**
Content-Type: `application/json` *or* `multipart/form-data`.

| Field         | Type   | Required | Rules                                          |
| ------------- | ------ | -------- | ---------------------------------------------- |
| `name`        | string | yes      | 2–120 characters                               |
| `description` | string | yes      | 10–2000 characters                             |
| `price`       | number | yes      | ≥ 0                                            |
| `category`    | string | yes      | `skincare` \| `makeup` \| `perfume` \| `sets`  |
| `brand`       | string | yes      | max 80 characters                              |
| `stock`       | number | no       | integer ≥ 0, default `0`                       |
| `image`       | file   | no       | jpg / jpeg / png / webp, ≤ 5 MB, field name `image` |

JSON:

```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Rose Glow Serum",
    "description":"A hydrating serum with damask rose extract.",
    "price":49.99,
    "category":"skincare",
    "brand":"Maison Belle",
    "stock":10
  }'
```

With an image:

```bash
curl -X POST http://localhost:5000/api/v1/products \
  -H "Authorization: Bearer <admin-token>" \
  -F "name=Rose Glow Serum" \
  -F "description=A hydrating serum with damask rose extract." \
  -F "price=49.99" \
  -F "category=skincare" \
  -F "brand=Maison Belle" \
  -F "stock=10" \
  -F "image=@./serum.png"
```

**201**

```json
{
  "status": "success",
  "message": "Product created successfully",
  "data": {
    "_id": "6aa95f5a3dc5e59ad9507952",
    "name": "Rose Glow Serum",
    "price": 49.99,
    "category": "skincare",
    "stock": 10,
    "image": "/uploads/image-1789484890930-858823ba17fb.png",
    "inStock": true
  }
}
```

**Errors:** `400` validation failed, unsupported file type, or image too large ·
`401` no token · `403` not an admin.

---

#### `PUT /api/v1/products/:id`

Update a product. **Auth required — admin only.** `PATCH` behaves identically.
Content-Type: `application/json` *or* `multipart/form-data`.
Only the fields you send are changed.

Same field rules as create, but every field is optional. Upload a new `image`
file to replace the current one — the old file is deleted from disk. Send
`"image": ""` as JSON to remove the image without replacing it.

```bash
curl -X PUT http://localhost:5000/api/v1/products/6aa95f5a... \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"price":59.99,"stock":12}'
```

Replacing the image:

```bash
curl -X PUT http://localhost:5000/api/v1/products/6aa95f5a... \
  -H "Authorization: Bearer <admin-token>" \
  -F "image=@./new-photo.jpg"
```

**200** → `{ "status": "success", "message": "Product updated successfully", "data": { } }`

**Errors:** `400` invalid id, validation failed, or bad upload · `401` · `403` ·
`404` product not found.

---

#### `DELETE /api/v1/products/:id`

Delete a product and its image file. **Auth required — admin only.**

```bash
curl -X DELETE http://localhost:5000/api/v1/products/6aa95f5a... \
  -H "Authorization: Bearer <admin-token>"
```

**200** → `{ "status": "success", "message": "Product deleted successfully", "data": { } }`

**Errors:** `400` invalid id · `401` · `403` · `404` product not found.

---

### Static files

`GET /uploads/:filename` — serves an uploaded image. **Public.**
Returns `404` when the file does not exist.

---

## 13. Connecting a frontend

### Base URL

```
http://localhost:5000/api/v1
```

Images are served from the origin **without** the `/api/v1` prefix:
`http://localhost:5000/uploads/<filename>`.

### CORS

With `CLIENT_URL` empty (the default), any origin is accepted — convenient while
developing. To restrict it, list your frontend origins:

```
CLIENT_URL=http://localhost:4200,http://localhost:5173
```

Allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
Allowed headers: `Content-Type, Authorization`.

### Authentication flow

1. The user registers (`POST /auth/register`) or logs in (`POST /auth/login`).
2. Store the returned `token` (e.g. `localStorage`) together with `data.role`.
3. Attach `Authorization: Bearer <token>` to every protected request.
4. On app start, call `GET /auth/me` to confirm the stored token is still valid.
5. On any `401`, clear the stored token and send the user back to the login page.
6. Show admin-only UI when `user.role === "admin"` — and remember the server
   enforces this independently, so a tampered client still gets a `403`.

### Example: fetch wrapper

```js
const API = "http://localhost:5000/api/v1";

async function api(path, { method = "GET", body, isForm } = {}) {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(API + path, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Request failed");
  return json;
}
```

### Example: login

```js
const { token, data: user } = await api("/auth/login", {
  method: "POST",
  body: { email: "admin@belleza.test", password: "Admin@123" },
});

localStorage.setItem("token", token);
localStorage.setItem("role", user.role);
```

### Example: create a product with an image

```js
const form = new FormData();
form.append("name", "Rose Glow Serum");
form.append("description", "A hydrating serum with damask rose extract.");
form.append("price", "49.99");
form.append("category", "skincare");
form.append("brand", "Maison Belle");
form.append("stock", "10");
form.append("image", fileInput.files[0]);   // field name must be "image"

await api("/products", { method: "POST", body: form, isForm: true });
```

Do **not** set `Content-Type` yourself for `FormData` — the browser adds the
required multipart boundary.

### Example: showing a product image

```js
const API_ORIGIN = "http://localhost:5000";
const src = product.image ? API_ORIGIN + product.image : "/placeholder.png";
```

### Handling errors

Every failure returns `{ status: "error", message }`, plus an `errors` array of
`{ field, message }` for validation failures — map those onto your form fields.
