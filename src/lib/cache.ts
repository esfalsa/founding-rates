import path from "node:path";
import fs from "node:fs/promises";
// import crypto from "node:crypto";
import { type Founding } from "@/lib/types";
import { startOfDay } from "date-fns";

export class FoundingsCache {
  private dir: string;

  constructor(dir: string) {
    this.dir = path.resolve(dir);
  }

  // private hash(key: Date) {
  //   return crypto
  //     .createHash("md5")
  //     .update(startOfDay(key).toISOString())
  //     .digest("hex");
  // }

  private getPath(key: Date) {
    return path.join(this.dir, startOfDay(key).getTime().toString());
  }

  async get(key: Date) {
    const filePath = this.getPath(key);

    try {
      const contents = await fs.readFile(filePath, "utf-8");
      return JSON.parse(contents, (key, value) => {
        if (key === "time") {
          return new Date(value);
        }
        return value;
      }) as Founding[];
    } catch (e) {
      return null;
    }
  }

  async set(key: Date, value: Founding[]) {
    const filePath = this.getPath(key);
    const contents = JSON.stringify(value);

    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(filePath, contents, { flag: "w" });
  }

  async prune(before: Date) {
    const files = await fs.readdir(this.dir, { encoding: "utf-8" });

    for (const file of files) {
      const fileTime = Number(file);

      if (Number.isNaN(fileTime) || fileTime < before.getTime()) {
        await fs.unlink(path.join(this.dir, file));
      }
    }
  }
}
