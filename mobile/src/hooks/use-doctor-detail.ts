import { useCallback, useEffect, useState } from 'react';
import {
  getDoctorDetail,
  getDoctorSlots,
  type DoctorDetail,
  type DoctorSlot,
} from '../services/doctors.service';

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: { message?: string } } } }).response;
    return response?.data?.error?.message ?? 'Could not load doctor details.';
  }

  return 'Could not load doctor details.';
}

export function useDoctorDetail(doctorId: string, date?: string) {
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDoctor = useCallback(async () => {
    setIsLoading(true);

    try {
      const [doctorDetail, doctorSlots] = await Promise.all([
        getDoctorDetail(doctorId),
        getDoctorSlots(doctorId, date),
      ]);
      setDoctor(doctorDetail);
      setSlots(doctorSlots);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [date, doctorId]);

  useEffect(() => {
    void loadDoctor();
  }, [loadDoctor]);

  return {
    doctor,
    slots,
    isLoading,
    error,
    reload: loadDoctor,
  };
}
