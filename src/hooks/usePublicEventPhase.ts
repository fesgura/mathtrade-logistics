"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useApi } from '@/hooks/useApi';

const POLL_INTERVAL_MS = 30_000;

export function usePublicEventPhase() {
  const [eventPhase, setEventPhase] = useState<number | null>(null);
  const [isLoadingEventPhase, setIsLoadingEventPhase] = useState(true);
  const inFlight = useRef(false);
  const { execute } = useApi<{ meeting_phase: number }>('logistics/display/event-phase/', { method: 'GET', isPublic: true });

  const refetch = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const data = await execute();
      if (data) setEventPhase(data.meeting_phase);
    } catch {
      return;
    } finally {
      inFlight.current = false;
      setIsLoadingEventPhase(false);
    }
  }, [execute]);

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refetch]);

  return { eventPhase, isLoadingEventPhase };
}
