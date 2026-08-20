import { useState, useEffect, useCallback } from "react";

const bus = typeof window !== "undefined" ? new EventTarget() : null;

export function emitRefetch(table: string) {
  bus?.dispatchEvent(new Event(table));
}

export function useRefetchTrigger(table: string) {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!bus) return;
    const handler = () => setVersion((v) => v + 1);
    bus.addEventListener(table, handler);
    return () => bus.removeEventListener(table, handler);
  }, [table]);
  return version;
}

type MutateOptions = { onSuccess?: () => void; onError?: (err: Error) => void };

export function useMutation<TInput, TResult = { id: string }>(
  fn: (input: TInput) => Promise<TResult>,
  tables: string[] = []
) {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const mutateAsync = useCallback(
    async (input: TInput): Promise<TResult> => {
      setIsPending(true);
      setIsSuccess(false);
      try {
        const result = await fn(input);
        setIsSuccess(true);
        tables.forEach(emitRefetch);
        return result;
      } finally {
        setIsPending(false);
      }
    },
    [fn, tables]
  );

  const mutate = useCallback(
    (input: TInput, options?: MutateOptions) => {
      mutateAsync(input)
        .then(() => options?.onSuccess?.())
        .catch((err) => options?.onError?.(err));
    },
    [mutateAsync]
  );

  return { mutate, mutateAsync, isPending, isSuccess };
}
