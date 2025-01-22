/**
 * src/lib/model/stateMachine.js
 *
 * Provides functions to parse and validate a basic state machine.
 */

/**
 * parseStateMachine
 *
 * @param {Object} definition - A JSON object that defines the state machine,
 *   e.g.:
 *   {
 *     "StartAt": "A",
 *     "States": {
 *       "A": { "Type": "Task", "Next": "B" },
 *       "B": { "Type": "Task", "End": true }
 *     }
 *   }
 * @returns {Object} A normalized version of the state machine data,
 *   or throws an Error if invalid.
 */
export function parseStateMachine(definition) {
  if (!definition || typeof definition !== 'object') {
    throw new Error('State machine definition must be an object.');
  }

  const { StartAt, States } = definition;
  if (!StartAt || !States) {
    throw new Error('State machine must have "StartAt" and "States" properties.');
  }

  if (!(StartAt in States)) {
    throw new Error(`"StartAt" references a state ("${StartAt}") not found in "States".`);
  }

  // Basic structure is valid; let’s return a normalized version
  return {
    start: StartAt,
    states: Object.entries(States).map(([key, value]) => ({
      id: key,
      ...value,
    })),
  };
}

/**
 * hasEndState
 *
 * @param {Object} parsed - The normalized result of parseStateMachine
 * @returns {boolean} True if at least one state has End=true, or if
 *   a state is Type=Succeed/Fail (depending on your definition)
 */
export function hasEndState(parsed) {
  return parsed.states.some(
    (s) => s.End === true || s.Type === 'Succeed' || s.Type === 'Fail'
  );
}
