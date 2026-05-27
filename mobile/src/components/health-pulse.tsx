import LottieView from 'lottie-react-native';

interface HealthPulseProps {
  size?: number;
}

export function HealthPulse({ size = 148 }: HealthPulseProps) {
  return (
    <LottieView
      source={require('../assets/animations/health-pulse.json')}
      autoPlay
      loop
      style={{ width: size, height: size }}
    />
  );
}
