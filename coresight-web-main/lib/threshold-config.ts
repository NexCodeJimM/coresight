export interface ThresholdConfig {
  cpu: {
    warning: number;
    critical: number;
  };
  memory: {
    warning: number;
    critical: number;
  };
  disk: {
    warning: number;
    critical: number;
  };
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  cpu: {
    warning: 70,
    critical: 90,
  },
  memory: {
    warning: 75,
    critical: 90,
  },
  disk: {
    warning: 80,
    critical: 90,
  },
};
