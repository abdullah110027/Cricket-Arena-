import mongoose from 'mongoose';

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache = global.mongooseCache ?? { connection: null, promise: null };

global.mongooseCache = cache;

function encodeCredential(value: string): string {
  return value
    .split(/(%[0-9a-f]{2})/gi)
    .map((part) => /^%[0-9a-f]{2}$/i.test(part)
      ? part
      : encodeURIComponent(part).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`))
    .join('');
}

function normalizeMongoUri(uri: string): string {
  const schemeEnd = uri.indexOf('://');
  const credentialStart = schemeEnd + 3;
  const credentialEnd = uri.lastIndexOf('@');
  if (schemeEnd < 0 || credentialEnd < credentialStart) return uri;

  const credentials = uri.slice(credentialStart, credentialEnd);
  const separator = credentials.indexOf(':');
  const username = separator < 0 ? credentials : credentials.slice(0, separator);
  const password = separator < 0 ? null : credentials.slice(separator + 1);
  const encodedCredentials = password === null
    ? encodeCredential(username)
    : `${encodeCredential(username)}:${encodeCredential(password)}`;

  return `${uri.slice(0, credentialStart)}${encodedCredentials}${uri.slice(credentialEnd)}`;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.connection) return cache.connection;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured. Add it to your local environment.');
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(normalizeMongoUri(mongoUri), { bufferCommands: false });
  }

  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}
