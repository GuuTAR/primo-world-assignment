# primo-world-assignment

Project for Primo World Assignment

## Environment

Copy `.env.template` to `.env` and fill in the values. Real environment variables take precedence over `.env`.

```bash
$ cp .env.template .env
```

### RSA keys

Generate a key pair at [cryptotools.net/rsagen](https://cryptotools.net/rsagen).

### Required Environment for Assignment

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | yes | HTTP port, default `8000` |
| `RSA_PRIVATE_KEY` | yes | PEM private key, used by `POST /get-encrypt-data` to encrypt the AES key (`data1`) |
| `RSA_PUBLIC_KEY` | yes | PEM public key, used by `POST /get-decrypt-data` to decrypt `data1` |

### Optional Environment

Todos needs both `ENABLE_FIREBASE_AUTH` and `ENABLE_MONGODB`.

| Variable | Required | Description |
| --- | --- | --- |
| `ENABLE_MONGODB` | no | `true` or `1` connects to MongoDB at startup and loads the modules that need it: todos (`/api/v1/todos*`). Any other value, or unset, skips the connection and leaves them out. Default: off |
| `ENABLE_FIREBASE_AUTH` | no | `true` or `1` loads Firebase Auth and the modules that need it: auth (`/api/v1/auth/*`) and todos (`/api/v1/todos*`). Any other value, or unset, leaves them out. Default: off |
| `MONGODB_URI` | when MongoDB is on | MongoDB connection string, default `mongodb://localhost:27017` |
| `MONGODB_DB_NAME` | no | Database name, default `testdb` (overrides any database in `MONGODB_URI`) |
| `FIREBASE_PROJECT_ID` | when auth is on | Firebase project used to verify ID tokens |
| `FIREBASE_API_KEY` | when auth is on | Web API key, used by `POST /api/v1/auth/signin` |
| `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | no | Service account; falls back to Application Default Credentials |

## Project setup

```bash
$ yarn
```

## Compile and run the project

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

API docs (Swagger) are served at `http://localhost:8000/api-docs`.

## API Endpoints

| Method | Path | Module | Description |
| --- | --- | --- | --- |
| `POST` | `/get-encrypt-data` | encryption | Encrypts `payload` with a random AES key (`data2`) and encrypts that key with the RSA private key (`data1`) |
| `POST` | `/get-decrypt-data` | encryption | Decrypts `data1` with the RSA public key to get the AES key, then decrypts `data2` back to `payload` |
| `POST` | `/merge` | algorithm | Merges three sorted integer collections into one ascending array, without using a sort function |

### `POST /get-encrypt-data`

| Field | Type | Rules |
| --- | --- | --- |
| `payload` | string | required, 0–2000 characters |

```json
// request
{ "payload": "Hello, world!" }

// 200
{ "successful": true, "error_code": "", "data": { "data1": "<base64>", "data2": "<base64>" } }
```

### `POST /get-decrypt-data`

| Field | Type | Rules |
| --- | --- | --- |
| `data1` | string | required, the `data1` from `/get-encrypt-data` |
| `data2` | string | required, the `data2` from `/get-encrypt-data` |

```json
// request
{ "data1": "<base64>", "data2": "<base64>" }

// 200
{ "successful": true, "error_code": "", "data": { "payload": "Hello, world!" } }
```

Both encryption endpoints return errors as `{ "successful": false, "error_code": "...", "data": null }`:

| `error_code` | HTTP | When |
| --- | --- | --- |
| `INVALID_REQUEST` | 400 | The request body fails the rules above |
| `DECRYPTION_FAILED` | 400 | `data1` or `data2` is wrong, tampered with, or from a different key pair |
| `INTERNAL_ERROR` | 500 | Unexpected error |

### `POST /merge`

Implements `merge(int[] collection_1, int[] collection_2, int[] collection_3) : int[]`.

| Field | Type | Rules |
| --- | --- | --- |
| `collection_1` | integer[] | required, sorted from max to min |
| `collection_2` | integer[] | required, sorted from min to max |
| `collection_3` | integer[] | required, sorted from min to max |

```json
// request
{ "collection_1": [10, 7, 4, 1], "collection_2": [0, 2, 5, 8], "collection_3": [0, 3, 6, 9, 12] }

// 200
{ "code": 200, "message": "Collections merged successfully", "body": { "result": [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12] } }

// 400 (e.g. a collection in the wrong order)
{ "code": 400, "message": "collection_3 must be sorted in ascending order" }
```

## Run tests

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
