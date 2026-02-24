export declare const campaigns: import("drizzle-orm/mysql-core").MySqlTableWithColumns<{
    name: "campaigns";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "id";
            tableName: "campaigns";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        name: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "name";
            tableName: "campaigns";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        description: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "description";
            tableName: "campaigns";
            dataType: "string";
            columnType: "MySqlText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        campaignType: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "campaignType";
            tableName: "campaigns";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        jbpmId: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "jbpmId";
            tableName: "campaigns";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        activeFlag: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "activeFlag";
            tableName: "campaigns";
            dataType: "boolean";
            columnType: "MySqlBoolean";
            data: boolean;
            driverParam: number | boolean;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        lockedFlag: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "lockedFlag";
            tableName: "campaigns";
            dataType: "boolean";
            columnType: "MySqlBoolean";
            data: boolean;
            driverParam: number | boolean;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        createdAt: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "createdAt";
            tableName: "campaigns";
            dataType: "date";
            columnType: "MySqlTimestamp";
            data: Date;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        updatedAt: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "updatedAt";
            tableName: "campaigns";
            dataType: "date";
            columnType: "MySqlTimestamp";
            data: Date;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
    };
    dialect: "mysql";
}>;
export declare const audienceCheckers: import("drizzle-orm/mysql-core").MySqlTableWithColumns<{
    name: "audience_checkers";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "id";
            tableName: "audience_checkers";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        campaignId: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "campaignId";
            tableName: "audience_checkers";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        name: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "name";
            tableName: "audience_checkers";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        query: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "query";
            tableName: "audience_checkers";
            dataType: "string";
            columnType: "MySqlText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        rules: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "rules";
            tableName: "audience_checkers";
            dataType: "string";
            columnType: "MySqlText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        alignmentReport: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "alignmentReport";
            tableName: "audience_checkers";
            dataType: "string";
            columnType: "MySqlText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        status: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "status";
            tableName: "audience_checkers";
            dataType: "string";
            columnType: "MySqlEnumColumn";
            data: "pending" | "active" | "inactive" | "completed";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: ["pending", "active", "inactive", "completed"];
            baseColumn: never;
        }, object>;
        alignmentStatus: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "alignmentStatus";
            tableName: "audience_checkers";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        lastChecked: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "lastChecked";
            tableName: "audience_checkers";
            dataType: "date";
            columnType: "MySqlTimestamp";
            data: Date;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        createdAt: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "createdAt";
            tableName: "audience_checkers";
            dataType: "date";
            columnType: "MySqlTimestamp";
            data: Date;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        updatedAt: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "updatedAt";
            tableName: "audience_checkers";
            dataType: "date";
            columnType: "MySqlTimestamp";
            data: Date;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
    };
    dialect: "mysql";
}>;
export declare const rules: import("drizzle-orm/mysql-core").MySqlTableWithColumns<{
    name: "rules";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "id";
            tableName: "rules";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        checkerId: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "checkerId";
            tableName: "rules";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        field: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "field";
            tableName: "rules";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        operator: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "operator";
            tableName: "rules";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        value: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "value";
            tableName: "rules";
            dataType: "string";
            columnType: "MySqlText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        createdAt: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "createdAt";
            tableName: "rules";
            dataType: "date";
            columnType: "MySqlTimestamp";
            data: Date;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        updatedAt: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "updatedAt";
            tableName: "rules";
            dataType: "date";
            columnType: "MySqlTimestamp";
            data: Date;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
    };
    dialect: "mysql";
}>;
export declare const campaignsRelations: import("drizzle-orm").Relations<"campaigns", {
    audienceCheckers: import("drizzle-orm").Many<"audience_checkers">;
}>;
export declare const audienceCheckersRelations: import("drizzle-orm").Relations<"audience_checkers", {
    campaign: import("drizzle-orm").One<"campaigns", true>;
    rulesList: import("drizzle-orm").Many<"rules">;
}>;
export declare const rulesRelations: import("drizzle-orm").Relations<"rules", {
    audienceChecker: import("drizzle-orm").One<"audience_checkers", true>;
}>;
export type CampaignSelect = typeof campaigns.$inferSelect;
export type CampaignInsert = typeof campaigns.$inferInsert;
export type AudienceCheckerSelect = typeof audienceCheckers.$inferSelect;
export type AudienceCheckerInsert = typeof audienceCheckers.$inferInsert;
export type RuleSelect = typeof rules.$inferSelect;
export type RuleInsert = typeof rules.$inferInsert;
//# sourceMappingURL=schema.d.ts.map