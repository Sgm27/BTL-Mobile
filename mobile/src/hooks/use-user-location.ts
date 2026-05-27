import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';

interface UserLocation {
  lat: number;
  lng: number;
}

interface UseUserLocationReturn {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Cần cấp quyền truy cập vị trí');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      setError('Không thể lấy vị trí hiện tại');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { location, loading, error, refresh: fetchLocation };
}
