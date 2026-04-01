import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

type DelightTrigger = 'points_earned' | 'reward_redeemed' | 'easter_egg' | 'deal_submitted';

interface DelightAnimationProps {
  trigger: DelightTrigger;
  onComplete?: () => void;
}

const SOURCE_MAP: Record<DelightTrigger, any> = {
  points_earned: require('../../assets/lottie/points_earned.json'),
  reward_redeemed: require('../../assets/lottie/reward_redeemed.json'),
  easter_egg: require('../../assets/lottie/easter_egg.json'),
  deal_submitted: require('../../assets/lottie/deal_submitted.json'),
};

export const DelightAnimation: React.FC<DelightAnimationProps> = ({ trigger, onComplete }) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.play();
    }
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      <LottieView
        ref={animationRef}
        source={SOURCE_MAP[trigger]}
        autoPlay
        loop={false}
        style={styles.animation}
        onAnimationFinish={onComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  animation: { width: 200, height: 200 },
});
