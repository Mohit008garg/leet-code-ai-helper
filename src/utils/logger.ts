export const log = (scope: string, ...args: any[]) => {
  console.log(`[AI Assist :: ${scope}]`, ...args);
};

export const errorLog = (scope: string, ...args: any[]) => {
  console.error(`[AI Assist :: ${scope}]`, ...args);
};
