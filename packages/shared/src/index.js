"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STREAMS = exports.QUEUES = void 0;
exports.isValidJobTransition = isValidJobTransition;
exports.isValidExecutionTransition = isValidExecutionTransition;
// State Transition Validators
const JOB_TRANSITIONS = {
    pending: new Set(['running', 'skipped', 'cancelled']),
    running: new Set(['succeeded', 'failed', 'cancelled']),
    failed: new Set(['retrying', 'failed_terminal']),
    retrying: new Set(['running', 'cancelled']),
    succeeded: new Set([]),
    failed_terminal: new Set([]),
    cancelled: new Set([]),
    skipped: new Set([]),
};
const EXECUTION_TRANSITIONS = {
    pending: new Set(['running', 'cancelled']),
    running: new Set(['succeeded', 'failed', 'cancelled']),
    succeeded: new Set([]),
    failed: new Set([]),
    cancelled: new Set([]),
};
function isValidJobTransition(from, to) {
    return JOB_TRANSITIONS[from]?.has(to) ?? false;
}
function isValidExecutionTransition(from, to) {
    return EXECUTION_TRANSITIONS[from]?.has(to) ?? false;
}
// Queue & Stream Names
exports.QUEUES = {
    BUILD: 'build-queue',
    TEST: 'test-queue',
    DEPLOY: 'deploy-queue',
    DOCKER: 'docker-queue',
    SCRIPT: 'script-queue',
};
exports.STREAMS = {
    JOB_EVENTS: 'job-events',
};
//# sourceMappingURL=index.js.map