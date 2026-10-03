import { emitKeypressEvents } from 'node:readline';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import nextEnv from '@next/env';
import { compare, hash } from 'bcryptjs';
import mongoose from 'mongoose';

const targetEmail = 'ablai.110027@gmail.com';
const { loadEnvConfig } = nextEnv;

function encodeCredential(value) {
  return value
    .split(/(%[0-9a-f]{2})/gi)
    .map((part) => /^%[0-9a-f]{2}$/i.test(part)
      ? part
      : encodeURIComponent(part).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`))
    .join('');
}

function normalizeMongoUri(uri) {
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

function promptSecret(label) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive terminal so the password can be entered without echo.');
  }

  stdout.write(label);
  stdin.setEncoding('utf8');
  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise((resolve, reject) => {
    let value = '';
    const cleanup = () => {
      stdin.off('keypress', onKeypress);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
    };
    const onKeypress = (character, key) => {
      if (key?.ctrl && key.name === 'c') {
        cleanup();
        reject(new Error('Password reset cancelled.'));
      } else if (key?.name === 'return' || key?.name === 'enter') {
        cleanup();
        resolve(value);
      } else if (key?.name === 'backspace') {
        value = value.slice(0, -1);
      } else if (character && !key?.ctrl && !key?.meta) {
        value += character;
      }
    };

    stdin.on('keypress', onKeypress);
  });
}

async function main() {
  loadEnvConfig(process.cwd());
  if (process.env.NODE_ENV !== 'development') {
    throw new Error("Refusing to reset a password unless NODE_ENV is exactly 'development'.");
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not configured. Set it in your local environment.');

  const prompts = createInterface({ input: stdin, output: stdout });
  try {
    const confirmation = (await prompts.question(`Type ${targetEmail} to confirm the account to reset: `)).trim().toLowerCase();
    if (confirmation !== targetEmail) throw new Error('Account confirmation did not match; no changes were made.');
  } finally {
    prompts.close();
  }

  const password = await promptSecret('New password (minimum 8 characters): ');
  if (password.length < 8) throw new Error('Password must be at least 8 characters; no changes were made.');
  const confirmation = await promptSecret('Confirm new password: ');
  if (password !== confirmation) throw new Error('Passwords do not match; no changes were made.');

  await mongoose.connect(normalizeMongoUri(mongoUri), { bufferCommands: false });
  try {
    const users = mongoose.connection.collection('users');
    const user = await users.findOne({ email: targetEmail }, { projection: { _id: 1, role: 1 } });
    if (!user) throw new Error(`No existing account found for ${targetEmail}; no account was created.`);

    const passwordHash = await hash(password, 12);
    const update = await users.updateOne({ _id: user._id }, { $set: { passwordHash } });
    if (update.matchedCount !== 1) throw new Error('The existing account changed during reset; no account was created.');

    const savedUser = await users.findOne({ _id: user._id }, { projection: { passwordHash: 1, role: 1 } });
    if (savedUser.role !== user.role || !(await compare(password, savedUser.passwordHash))) {
      throw new Error('Password verification failed after saving.');
    }

    stdout.write(`Password reset and verified for ${targetEmail}. The account role was preserved. You can now sign in at /login.\n`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Password reset failed.');
  process.exitCode = 1;
});