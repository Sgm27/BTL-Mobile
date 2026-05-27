import { useCallback, useEffect, useState } from 'react';
import { getDoctors } from '../services/doctors.service';
import type { Doctor } from '../types';

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: { message?: string } } } }).response;
    return response?.data?.error?.message ?? 'Could not load doctors.';
  }

  return 'Could not load doctors.';
}

export function useDoctors(search: string) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDoctors = useCallback(
    async (options?: { refresh?: boolean }) => {
      if (options?.refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const result = await getDoctors({
          q: search.trim() || undefined,
          status: 'ACTIVE',
          limit: 20,
        });
        setDoctors(result.data);
        setError('');
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [search]
  );

  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  return {
    doctors,
    isLoading,
    isRefreshing,
    error,
    reload: loadDoctors,
  };
}
