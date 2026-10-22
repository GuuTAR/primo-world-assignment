# primo-world-assignment

Project for Primo World Assignment

## Project setup

```bash
$ yarn
```

## Environment

Copy `.env.template` to `.env` and fill in the values. Real environment variables take precedence over `.env`.

```bash
$ cp .env.template .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | no | HTTP port, default `8000` |
| `ENABLE_MONGODB` | no | `true` or `1` connects to MongoDB at startup and loads the modules that need it: todos (`/api/v1/todos*`). Any other value, or unset, skips the connection and leaves them out. Default: off |
| `ENABLE_FIREBASE_AUTH` | no | `true` or `1` loads Firebase Auth and the modules that need it: auth (`/api/v1/auth/*`) and todos (`/api/v1/todos*`). Any other value, or unset, leaves them out. Default: off |
| `RSA_PRIVATE_KEY` | yes | PEM private key, used by `POST /get-encrypt-data` to encrypt the AES key (`data1`) |
| `RSA_PUBLIC_KEY` | yes | PEM public key, used by `POST /get-decrypt-data` to decrypt `data1` |
| `MONGODB_URI` | when MongoDB is on | MongoDB connection string, default `mongodb://localhost:27017` |
| `MONGODB_DB_NAME` | no | Database name, default `testdb` (overrides any database in `MONGODB_URI`) |
| `FIREBASE_PROJECT_ID` | when auth is on | Firebase project used to verify ID tokens |
| `FIREBASE_API_KEY` | when auth is on | Web API key, used by `POST /api/v1/auth/signin` |
| `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | no | Service account; falls back to Application Default Credentials |
| `FIREBASE_AUTH_EMULATOR_HOST` | no | e.g. `localhost:9099` to use the Auth emulator |
| `OBSERVE_APP_KEY` / `OBSERVE_APP_SECRET` | no | [NestJS Observe](https://observe.nestjs.com) credentials |

Todos needs both `ENABLE_FIREBASE_AUTH` and `ENABLE_MONGODB`. `/merge`, `/get-encrypt-data` and `/get-decrypt-data` work with both flags off.

### RSA keys

Generate a key pair at [cryptotools.net/rsagen](https://cryptotools.net/rsagen), or with OpenSSL:

```bash
$ openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem
$ openssl rsa -in private.pem -pubout -out public.pem
```

Store each key on one line in double quotes, with `\n` in place of line breaks (the same format as `FIREBASE_PRIVATE_KEY`):

```bash
$ awk 'NF {printf "%s\\n", $0}' private.pem   # paste the output as RSA_PRIVATE_KEY="..."
```

The app fails at startup if either key is missing or invalid. Tests generate their own key pair, so no keys are needed to run them.

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

## Algorithm: `POST /merge`

Implements `merge(int[] collection_1, int[] collection_2, int[] collection_3) : int[]`. It returns every element of the three collections in ascending order.

- `collection_1` must be sorted from **max to min**.
- `collection_2` and `collection_3` must be sorted from **min to max**.

```bash
$ curl -X POST http://localhost:8000/merge \
    -H 'Content-Type: application/json' \
    -d '{"collection_1":[10,7,4,1],"collection_2":[0,2,5,8],"collection_3":[0,3,6,9,12]}'
```

```json
{
  "code": 200,
  "message": "Collections merged successfully",
  "body": { "result": [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12] }
}
```

**No sort function is used.** [`AlgorithmService.merge`](src/algorithm/algorithm.service.ts) is a three-pointer merge. `collection_1` is read from its last element (its smallest value) backwards, and the other two from their first element forwards. Each step takes the smallest of the three current values. This runs in O(n) time, and the inputs are not modified.

Invalid requests return `400` with a `message`:

- a collection is missing, is not an array, or contains a non-integer
- a collection is not in the order described above, e.g. `collection_3 must be sorted in ascending order`

The order is checked by comparing neighbouring elements, also without sorting.

Unit tests:

- [`algorithm.service.spec.ts`](src/algorithm/algorithm.service.spec.ts): empty and single-element inputs, duplicates, non-overlapping and interleaved collections, negative and very large integers, inputs not modified, a check that no sort function is called, randomized inputs, and 1,000,000 elements in linear time
- [`merge.dto.spec.ts`](src/algorithm/dto/merge.dto.spec.ts): request validation
- [`algorithm.controller.spec.ts`](src/algorithm/algorithm.controller.spec.ts): the controller

The full HTTP flow is tested in [`test/algorithm.e2e-spec.ts`](test/algorithm.e2e-spec.ts).

```bash
# run only the algorithm tests
$ yarn test src/algorithm
$ yarn test:e2e test/algorithm
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
