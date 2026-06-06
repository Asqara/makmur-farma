import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { AwsClient } from "aws4fetch";

import { ENV } from "@/constants/config";
import { CLOUDFLARE_R2_REGION } from "@/constants/upload";

const PRIVATE_STORAGE_ROOT = path.join(process.cwd(), ".makmur-storage");

type StoredObject = {
  bytes: Buffer;
  contentType: string;
};

function normalizeObjectKey(key: string) {
  return key.replace(/^\/+/, "");
}

function getR2Config() {
  const config = ENV.objectStorage.r2;
  const endpoint =
    config.endpoint ??
    (config.accountId
      ? `https://${config.accountId}.r2.cloudflarestorage.com`
      : undefined);

  if (
    !config.accessKeyId ||
    !config.secretAccessKey ||
    !config.bucket ||
    !endpoint
  ) {
    return null;
  }

  return {
    accessKeyId: config.accessKeyId,
    bucket: config.bucket,
    endpoint,
    secretAccessKey: config.secretAccessKey,
  };
}

function buildObjectUrl(endpoint: string, bucket: string, key: string) {
  const base = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
  const encodedKey = normalizeObjectKey(key)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return new URL(`${bucket}/${encodedKey}`, base).toString();
}

function getR2Client(config: NonNullable<ReturnType<typeof getR2Config>>) {
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    region: CLOUDFLARE_R2_REGION,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
  });
}

function toArrayBuffer(body: Buffer | Uint8Array) {
  const copy = new Uint8Array(body.byteLength);
  copy.set(body);
  return copy.buffer;
}

async function putLocalObject(
  key: string,
  body: Buffer | Uint8Array,
) {
  const targetPath = path.join(PRIVATE_STORAGE_ROOT, normalizeObjectKey(key));
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, body);
}

async function getLocalObject(key: string): Promise<StoredObject> {
  const bytes = await readFile(
    path.join(PRIVATE_STORAGE_ROOT, normalizeObjectKey(key)),
  );

  return {
    bytes,
    contentType: key.endsWith(".pdf")
      ? "application/pdf"
      : "application/octet-stream",
  };
}

async function deleteLocalObject(key: string) {
  try {
    await unlink(path.join(PRIVATE_STORAGE_ROOT, normalizeObjectKey(key)));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return;
    }

    throw error;
  }
}

/**
 * Stores a private object in Cloudflare R2 when configured, with local fallback
 * for assessment/demo environments that do not have object storage credentials.
 */
export async function putPrivateObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType = "application/octet-stream",
) {
  const config = getR2Config();

  if (!config) {
    await putLocalObject(key, body);
    return { provider: "local" as const };
  }

  const client = getR2Client(config);
  const bodyBytes = toArrayBuffer(body);
  const response = await client.fetch(
    buildObjectUrl(config.endpoint, config.bucket, key),
    {
      body: bodyBytes,
      headers: {
        "Content-Length": String(body.byteLength),
        "Content-Type": contentType,
      },
      method: "PUT",
    },
  );

  if (!response.ok) {
    throw new Error(`Upload R2 gagal: ${response.status}`);
  }

  return { provider: "r2" as const };
}

/**
 * Reads a private object from Cloudflare R2 when configured. Local fallback is
 * retained so existing locally generated reports remain downloadable.
 */
export async function getPrivateObject(key: string): Promise<StoredObject> {
  const config = getR2Config();

  if (!config) {
    return getLocalObject(key);
  }

  const client = getR2Client(config);
  const response = await client.fetch(
    buildObjectUrl(config.endpoint, config.bucket, key),
    { method: "GET" },
  );

  if (!response.ok) {
    return getLocalObject(key);
  }

  return {
    bytes: Buffer.from(await response.arrayBuffer()),
    contentType:
      response.headers.get("Content-Type") ?? "application/octet-stream",
  };
}

/**
 * Deletes a private object from Cloudflare R2 when configured, or from local
 * demo storage. Missing objects are treated as already deleted.
 */
export async function deletePrivateObject(key: string) {
  const config = getR2Config();

  if (!config) {
    await deleteLocalObject(key);
    return { provider: "local" as const };
  }

  const client = getR2Client(config);
  const response = await client.fetch(
    buildObjectUrl(config.endpoint, config.bucket, key),
    { method: "DELETE" },
  );

  if (!response.ok && response.status !== 404) {
    throw new Error(`Hapus R2 gagal: ${response.status}`);
  }

  return { provider: "r2" as const };
}
