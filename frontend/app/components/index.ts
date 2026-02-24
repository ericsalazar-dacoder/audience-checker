/**
 * Components barrel export
 *
 * Feature-based component organization:
 * - checker/   → Checker card and related panels
 * - import/    → CSV import functionality
 * - layout/    → App shell components (header, sidebar, etc.)
 * - settings/  → Configuration components
 * - summary/   → Bulk check and summary components
 */

// Checker components
export {
  CheckerCard,
  BusinessRulesPanel,
  AlignmentReportPanel,
} from "./checker";

// Import components
export { ImportDialog } from "./import";

// Layout components
export { Header, ThemeToggle } from "./layout/Header";
export { Sidebar } from "./layout/Sidebar";
export { MainLayout } from "./layout/MainLayout";

// Settings components
export { TableAliasConfig, ConditionEquivalenceConfig } from "./settings";

// Summary components
export { BulkCheckDialog } from "./summary";
