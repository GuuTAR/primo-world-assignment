/** Whether the boolean environment variable `name` is on (`true` or `1`, case-insensitive). */
export const envFlag = (name: string): boolean =>
  ['true', '1'].includes(process.env[name]?.trim().toLowerCase() ?? '')

/**
 * Firebase Auth and the modules that need it (auth, todos) are loaded only
 * when `ENABLE_FIREBASE_AUTH` is on.
 */
export const isFirebaseAuthEnabled = () => envFlag('ENABLE_FIREBASE_AUTH')

/**
 * The MongoDB connection and the modules that need it (todos) are set up only
 * when `ENABLE_MONGODB` is on.
 */
export const isMongoDbEnabled = () => envFlag('ENABLE_MONGODB')
