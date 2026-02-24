/**
 * TypeScript-based database module with proper typing
 */
import { Database } from "sqlite";
export declare function initializeDatabase(): Promise<Database>;
export declare function getDatabase(): Database;
export declare function closeDatabase(): Promise<void>;
//# sourceMappingURL=database.d.ts.map