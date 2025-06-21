"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface EventPhaseContextType {
  eventPhase: number | null;
  eventPhaseDisplay: string | null;
  isLoadingEventPhase: boolean;
  errorEventPhase: string | null;
  refetchEventPhase: () => void;
}

const EventPhaseContext = createContext<EventPhaseContextType | undefined>(undefined);

export const EventPhaseProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [eventPhase, setEventPhase] = useState<number | null>(null);
  const [eventPhaseDisplay, setEventPhaseDisplay] = useState<string | null>(null);
  const [isLoadingEventPhase, setIsLoadingEventPhase] = useState(true);
  const [errorEventPhase, setErrorEventPhase] = useState<string | null>(null);

  const fetchEventPhase = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoadingEventPhase(false);
      return;
    }
    setIsLoadingEventPhase(true);
    setErrorEventPhase(null);
    try {
      const MT_API_HOST = process.env.NEXT_PUBLIC_MT_API_HOST;
      const response = await fetch(`${MT_API_HOST}mathtrades/event/phase/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `token ${localStorage.getItem('authToken')}`
        }
      });
      if (!response.ok) {
        //const errorData = await response.json().catch(() => ({ message: 'Error al cargar la fase del evento.' }));
        //throw new Error(errorData.message || `Error ${response.status}`);
      }
      //const data = await response.json();
      //setEventPhase(data.meeting_phase);
      //setEventPhaseDisplay(data.phase_display);
      setEventPhase(2);
      setEventPhaseDisplay("");
    } catch (err) {
      setErrorEventPhase(err instanceof Error ? err.message : "Error desconocido al cargar la fase del evento.");
    } finally {
      setIsLoadingEventPhase(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchEventPhase();
  }, [fetchEventPhase]);

  const value = { eventPhase, eventPhaseDisplay, isLoadingEventPhase, errorEventPhase, refetchEventPhase: fetchEventPhase };

  return <EventPhaseContext.Provider value={value}>{children}</EventPhaseContext.Provider>;
};

export const useEventPhase = (): EventPhaseContextType => {
  const context = useContext(EventPhaseContext);
  if (context === undefined) {
    throw new Error('useEventPhase must be used within an EventPhaseProvider');
  }
  return context;
};