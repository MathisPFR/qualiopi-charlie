import fs from "fs/promises";
import path from "path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getStorageRoot } from "@/lib/config";

export const FORMATION_PHASES = [
  "avant-la-formation",
  "pendant-la-formation",
  "apres-la-formation",
  "preuves-qualiopi",
  "originaux",
] as const;

export type FormationPhase = (typeof FORMATION_PHASES)[number];

export type StorageDriver = "local" | "r2";

export interface ObjectStorage {
  put(key: string, body: Buffer, contentType?: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  list(prefix: string): Promise<string[]>;
  delete(key: string): Promise<void>;
}

export function formationObjectKey(
  formationId: string,
  phase: FormationPhase,
  filename: string
): string {
  const safeName = filename.replace(/[/\\]/g, "-");
  return `formations/${formationId}/${phase}/${safeName}`;
}

function assertSafeKey(key: string): void {
  if (key.includes("..") || path.isAbsolute(key)) {
    throw new Error(`Invalid object key: ${key}`);
  }
}

function localFilePath(key: string): string {
  assertSafeKey(key);
  return path.join(getStorageRoot(), key);
}

function createLocalStorage(): ObjectStorage {
  return {
    async put(key, body) {
      const filePath = localFilePath(key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, body);
    },

    async get(key) {
      try {
        return await fs.readFile(localFilePath(key));
      } catch {
        return null;
      }
    },

    async list(prefix) {
      assertSafeKey(prefix);
      const dir = localFilePath(prefix.endsWith("/") ? prefix.slice(0, -1) : prefix);
      const keys: string[] = [];

      async function walk(relativeDir: string, absoluteDir: string) {
        let entries;
        try {
          entries = await fs.readdir(absoluteDir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          const rel = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
          const abs = path.join(absoluteDir, entry.name);
          if (entry.isDirectory()) {
            await walk(rel, abs);
          } else if (entry.isFile()) {
            keys.push(`${prefix.replace(/\/$/, "")}/${rel}`.replace(/\/+/g, "/"));
          }
        }
      }

      await walk("", dir);
      return keys.sort();
    },

    async delete(key) {
      try {
        await fs.unlink(localFilePath(key));
      } catch {
        /* already absent */
      }
    },
  };
}

function getR2Config() {
  const bucket = process.env.R2_BUCKET;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint =
    process.env.R2_ENDPOINT ??
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined);

  if (!bucket || !accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      "R2 storage requires R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ENDPOINT or R2_ACCOUNT_ID"
    );
  }

  return { bucket, accessKeyId, secretAccessKey, endpoint };
}

async function streamToBuffer(
  body: AsyncIterable<Uint8Array> | ReadableStream | Blob | undefined
): Promise<Buffer | null> {
  if (!body) return null;
  if (body instanceof Blob) {
    return Buffer.from(await body.arrayBuffer());
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function shouldForcePathStyle(endpoint: string): boolean {
  if (process.env.R2_S3_FORCE_PATH_STYLE === "true") return true;
  if (process.env.R2_S3_FORCE_PATH_STYLE === "false") return false;
  try {
    const host = new URL(endpoint).hostname;
    return host === "minio" || host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

function createR2Storage(): ObjectStorage {
  const { bucket, accessKeyId, secretAccessKey, endpoint } = getR2Config();
  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: shouldForcePathStyle(endpoint),
  });

  return {
    async put(key, body, contentType) {
      assertSafeKey(key);
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
    },

    async get(key) {
      assertSafeKey(key);
      try {
        const response = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key })
        );
        return streamToBuffer(response.Body);
      } catch {
        return null;
      }
    },

    async list(prefix) {
      assertSafeKey(prefix);
      const keys: string[] = [];
      let continuationToken: string | undefined;

      do {
        const response = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          })
        );
        for (const item of response.Contents ?? []) {
          if (item.Key) keys.push(item.Key);
        }
        continuationToken = response.IsTruncated
          ? response.NextContinuationToken
          : undefined;
      } while (continuationToken);

      return keys.sort();
    },

    async delete(key) {
      assertSafeKey(key);
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key })
      );
    },
  };
}

export function getStorageDriver(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver !== "local" && driver !== "r2") {
    throw new Error(`Invalid STORAGE_DRIVER: ${driver}`);
  }
  return driver;
}

let cachedStorage: ObjectStorage | null = null;
let cachedDriver: StorageDriver | null = null;

export function getObjectStorage(): ObjectStorage {
  const driver = getStorageDriver();
  if (cachedStorage && cachedDriver === driver) {
    return cachedStorage;
  }
  cachedDriver = driver;
  cachedStorage = driver === "r2" ? createR2Storage() : createLocalStorage();
  return cachedStorage;
}

/** @internal Test helper — reset singleton between tests */
export function resetObjectStorageCache(): void {
  cachedStorage = null;
  cachedDriver = null;
}
