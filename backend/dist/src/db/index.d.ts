import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";
export declare function initializeDatabase(): Promise<ReturnType<typeof drizzle<typeof schema>>>;
export declare function getDatabase(): ReturnType<typeof drizzle<typeof schema>>;
export declare function closeDatabase(): Promise<void>;
export * from "./schema";
//# sourceMappingURL=index.d.ts.map