let settlementQueue = Promise.resolve<unknown>(undefined);

export const enqueueSettlement = <T>(task: () => Promise<T>) => {
  const run = settlementQueue.then(task, task);
  settlementQueue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
};