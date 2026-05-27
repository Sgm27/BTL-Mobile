import { useCallback, useEffect, useState } from 'react';
import {
  cancelAppointment,
  getMyAppointments,
} from '../services/appointments.service';
import type { Appointment } from '../types';

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: { message?: string } } } }).response;
    return response?.data?.error?.message ?? 'Could not load appointments.';
  }

  return 'Could not load appointments.';
}

export function useMyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await getMyAppointments({ limit: 20 });
      setAppointments(result.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const cancelById = useCallback(async (id: string) => {
    const updated = await cancelAppointment(id);
    setAppointments((current) =>
      current.map((appointment) => (appointment.id === id ? updated : appointment))
    );
    return updated;
  }, []);

  return {
    appointments,
    isLoading,
    error,
    reload: loadAppointments,
    cancelById,
  };
}
