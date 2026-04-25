/**
 * Guided decision engine — public API.
 *
 * Re-exports path definitions, engine logic, risk detection, and
 * save/resume scenario persistence.
 */

export { GUIDED_PATHS, PATH_TYPES, type PathStep } from './paths.js';
export {
  getNextStep,
  getPathProgress,
  generateWhatsNextMessage,
  type PathProgressInfo,
  type WhatsNextMessage,
} from './engine.js';
export {
  detectRisks,
  type RiskIndicator,
  type RiskSeverity,
  type ToolResultsForRisk,
} from './risk-detection.js';
export {
  saveScenario,
  loadScenario,
  type ScenarioState,
} from './scenario.js';
