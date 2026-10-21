import { Global, Module } from '@nestjs/common'

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

export const FIREBASE_AUTH = Symbol('FIREBASE_AUTH')

function getFirebaseApp() {
  const existing = getApps()[0]
  if (existing) return existing

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env
  // Verifying ID tokens only needs the project ID; a service account is used
  // when provided, otherwise Application Default Credentials.
  return initializeApp({
    projectId: FIREBASE_PROJECT_ID,
    ...(FIREBASE_CLIENT_EMAIL &&
      FIREBASE_PRIVATE_KEY && {
        credential: cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      }),
  })
}

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_AUTH,
      useFactory: () => getAuth(getFirebaseApp()),
    },
  ],
  exports: [FIREBASE_AUTH],
})
export class FirebaseModule {}
