import Lottie from 'lottie-react';
import animationData from '@/assets/animations/loading.json';

export function LottieLoader() {
  return (
    <Lottie 
      animationData={animationData}
      loop={true}
      autoplay={true}
      style={{ width: 80, height: 80 }}
    />
  );
}