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
| `RSA_PRIVATE_KEY` | yes | PEM private key, used by `POST /get-encrypt-data` to encrypt the AES key (`data1`) |
| `RSA_PUBLIC_KEY` | yes | PEM public key, used by `POST /get-decrypt-data` to decrypt `data1` |
| `MONGODB_URI` | no | MongoDB connection string, default `mongodb://localhost:27017` |
| `MONGODB_DB_NAME` | no | Database name, default `testdb` (overrides any database in `MONGODB_URI`) |
| `FIREBASE_PROJECT_ID` | yes | Firebase project used to verify ID tokens |
| `FIREBASE_API_KEY` | yes | Web API key, used by `POST /api/v1/auth/signin` |
| `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | no | Service account; falls back to Application Default Credentials |
| `FIREBASE_AUTH_EMULATOR_HOST` | no | e.g. `localhost:9099` to use the Auth emulator |
| `OBSERVE_APP_KEY` / `OBSERVE_APP_SECRET` | no | [NestJS Observe](https://observe.nestjs.com) credentials |

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
