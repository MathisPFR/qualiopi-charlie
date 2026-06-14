import {
  formationObjectKey,
  getObjectStorage,
} from "../src/server/services/object-storage";
import { getInstanceConfig } from "../src/lib/instance-config";

async function main() {
  const storage = getObjectStorage();
  const key = formationObjectKey(
    "test-formation",
    "avant-la-formation",
    "convention.pdf"
  );

  await storage.put(key, Buffer.from("hello qualiopi"));
  const read = await storage.get(key);
  const listed = await storage.list("formations/test-formation/");
  await storage.delete(key);
  const afterDelete = await storage.get(key);
  const config = await getInstanceConfig();

  const result = {
    getOk: read?.toString() === "hello qualiopi",
    listOk: listed.includes(key),
    deleteOk: afterDelete === null,
    orgName: config.orgName,
    devisRequired: config.devisRequired,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.getOk || !result.listOk || !result.deleteOk) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
