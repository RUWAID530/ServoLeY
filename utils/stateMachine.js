const MACHINES = {
  USER: {
    ACTIVE: ['BLOCKED', 'DEACTIVATED', 'DELETED'],
    BLOCKED: ['ACTIVE', 'DELETED'],
    DEACTIVATED: ['ACTIVE', 'DELETED'],
    DELETED: []
  },
  PROVIDER: {
    PENDING: ['APPROVED', 'REJECTED'],
    APPROVED: ['SUSPENDED', 'REJECTED'],
    SUSPENDED: ['APPROVED', 'REJECTED'],
    REJECTED: []
  },
  SERVICE: {
    DRAFT: ['PENDING_VERIFICATION'],
    PENDING_VERIFICATION: ['ACTIVE', 'REJECTED'],
    ACTIVE: ['SUSPENDED', 'REJECTED'],
    SUSPENDED: ['ACTIVE', 'REJECTED'],
    REJECTED: []
  },
  ORDER: {
    PENDING: ['ACCEPTED', 'CANCELLED', 'REJECTED'],
    ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
    REJECTED: []
  },
  PAYMENT: {
    PENDING: ['PROCESSING', 'FAILED', 'CANCELLED'],
    PROCESSING: ['COMPLETED', 'FAILED'],
    COMPLETED: [],
    FAILED: [],
    CANCELLED: []
  },
  WALLET_TX: {
    INITIATED: ['POSTED', 'FAILED'],
    POSTED: ['REVERSED'],
    FAILED: [],
    REVERSED: []
  }
};

const normalize = (value) => String(value || '').trim().toUpperCase();

const canTransition = (machine, fromState, toState) => {
  const machineKey = normalize(machine);
  const from = normalize(fromState);
  const to = normalize(toState);
  const allowed = MACHINES[machineKey]?.[from] || [];
  return allowed.includes(to);
};

const assertTransition = (machine, fromState, toState) => {
  if (!canTransition(machine, fromState, toState)) {
    const error = new Error(`Forbidden transition for ${normalize(machine)}: ${normalize(fromState)} -> ${normalize(toState)}`);
    error.statusCode = 409;
    error.isOperational = true;
    throw error;
  }
};

module.exports = {
  MACHINES,
  canTransition,
  assertTransition
};
