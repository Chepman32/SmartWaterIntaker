import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Image, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const SOURCE_PX = 1024;
const COLS = 20;
const ROWS = 10;

const SPLASH_DELAY_MS = 200;
const SPLASH_DURATION_MS = 600;

const ICON_SIZE = 220;

const particleImages: { [key: number]: any } = {
  1: require('../assets/icon_particles_200_alpha/1.png'),
  2: require('../assets/icon_particles_200_alpha/2.png'),
  3: require('../assets/icon_particles_200_alpha/3.png'),
  4: require('../assets/icon_particles_200_alpha/4.png'),
  5: require('../assets/icon_particles_200_alpha/5.png'),
  6: require('../assets/icon_particles_200_alpha/6.png'),
  7: require('../assets/icon_particles_200_alpha/7.png'),
  8: require('../assets/icon_particles_200_alpha/8.png'),
  9: require('../assets/icon_particles_200_alpha/9.png'),
  10: require('../assets/icon_particles_200_alpha/10.png'),
  11: require('../assets/icon_particles_200_alpha/11.png'),
  12: require('../assets/icon_particles_200_alpha/12.png'),
  13: require('../assets/icon_particles_200_alpha/13.png'),
  14: require('../assets/icon_particles_200_alpha/14.png'),
  15: require('../assets/icon_particles_200_alpha/15.png'),
  16: require('../assets/icon_particles_200_alpha/16.png'),
  17: require('../assets/icon_particles_200_alpha/17.png'),
  18: require('../assets/icon_particles_200_alpha/18.png'),
  19: require('../assets/icon_particles_200_alpha/19.png'),
  20: require('../assets/icon_particles_200_alpha/20.png'),
  21: require('../assets/icon_particles_200_alpha/21.png'),
  22: require('../assets/icon_particles_200_alpha/22.png'),
  23: require('../assets/icon_particles_200_alpha/23.png'),
  24: require('../assets/icon_particles_200_alpha/24.png'),
  25: require('../assets/icon_particles_200_alpha/25.png'),
  26: require('../assets/icon_particles_200_alpha/26.png'),
  27: require('../assets/icon_particles_200_alpha/27.png'),
  28: require('../assets/icon_particles_200_alpha/28.png'),
  29: require('../assets/icon_particles_200_alpha/29.png'),
  30: require('../assets/icon_particles_200_alpha/30.png'),
  31: require('../assets/icon_particles_200_alpha/31.png'),
  32: require('../assets/icon_particles_200_alpha/32.png'),
  33: require('../assets/icon_particles_200_alpha/33.png'),
  34: require('../assets/icon_particles_200_alpha/34.png'),
  35: require('../assets/icon_particles_200_alpha/35.png'),
  36: require('../assets/icon_particles_200_alpha/36.png'),
  37: require('../assets/icon_particles_200_alpha/37.png'),
  38: require('../assets/icon_particles_200_alpha/38.png'),
  39: require('../assets/icon_particles_200_alpha/39.png'),
  40: require('../assets/icon_particles_200_alpha/40.png'),
  41: require('../assets/icon_particles_200_alpha/41.png'),
  42: require('../assets/icon_particles_200_alpha/42.png'),
  43: require('../assets/icon_particles_200_alpha/43.png'),
  44: require('../assets/icon_particles_200_alpha/44.png'),
  45: require('../assets/icon_particles_200_alpha/45.png'),
  46: require('../assets/icon_particles_200_alpha/46.png'),
  47: require('../assets/icon_particles_200_alpha/47.png'),
  48: require('../assets/icon_particles_200_alpha/48.png'),
  49: require('../assets/icon_particles_200_alpha/49.png'),
  50: require('../assets/icon_particles_200_alpha/50.png'),
  51: require('../assets/icon_particles_200_alpha/51.png'),
  52: require('../assets/icon_particles_200_alpha/52.png'),
  53: require('../assets/icon_particles_200_alpha/53.png'),
  54: require('../assets/icon_particles_200_alpha/54.png'),
  55: require('../assets/icon_particles_200_alpha/55.png'),
  56: require('../assets/icon_particles_200_alpha/56.png'),
  57: require('../assets/icon_particles_200_alpha/57.png'),
  58: require('../assets/icon_particles_200_alpha/58.png'),
  59: require('../assets/icon_particles_200_alpha/59.png'),
  60: require('../assets/icon_particles_200_alpha/60.png'),
  61: require('../assets/icon_particles_200_alpha/61.png'),
  62: require('../assets/icon_particles_200_alpha/62.png'),
  63: require('../assets/icon_particles_200_alpha/63.png'),
  64: require('../assets/icon_particles_200_alpha/64.png'),
  65: require('../assets/icon_particles_200_alpha/65.png'),
  66: require('../assets/icon_particles_200_alpha/66.png'),
  67: require('../assets/icon_particles_200_alpha/67.png'),
  68: require('../assets/icon_particles_200_alpha/68.png'),
  69: require('../assets/icon_particles_200_alpha/69.png'),
  70: require('../assets/icon_particles_200_alpha/70.png'),
  71: require('../assets/icon_particles_200_alpha/71.png'),
  72: require('../assets/icon_particles_200_alpha/72.png'),
  73: require('../assets/icon_particles_200_alpha/73.png'),
  74: require('../assets/icon_particles_200_alpha/74.png'),
  75: require('../assets/icon_particles_200_alpha/75.png'),
  76: require('../assets/icon_particles_200_alpha/76.png'),
  77: require('../assets/icon_particles_200_alpha/77.png'),
  78: require('../assets/icon_particles_200_alpha/78.png'),
  79: require('../assets/icon_particles_200_alpha/79.png'),
  80: require('../assets/icon_particles_200_alpha/80.png'),
  81: require('../assets/icon_particles_200_alpha/81.png'),
  82: require('../assets/icon_particles_200_alpha/82.png'),
  83: require('../assets/icon_particles_200_alpha/83.png'),
  84: require('../assets/icon_particles_200_alpha/84.png'),
  85: require('../assets/icon_particles_200_alpha/85.png'),
  86: require('../assets/icon_particles_200_alpha/86.png'),
  87: require('../assets/icon_particles_200_alpha/87.png'),
  88: require('../assets/icon_particles_200_alpha/88.png'),
  89: require('../assets/icon_particles_200_alpha/89.png'),
  90: require('../assets/icon_particles_200_alpha/90.png'),
  91: require('../assets/icon_particles_200_alpha/91.png'),
  92: require('../assets/icon_particles_200_alpha/92.png'),
  93: require('../assets/icon_particles_200_alpha/93.png'),
  94: require('../assets/icon_particles_200_alpha/94.png'),
  95: require('../assets/icon_particles_200_alpha/95.png'),
  96: require('../assets/icon_particles_200_alpha/96.png'),
  97: require('../assets/icon_particles_200_alpha/97.png'),
  98: require('../assets/icon_particles_200_alpha/98.png'),
  99: require('../assets/icon_particles_200_alpha/99.png'),
  100: require('../assets/icon_particles_200_alpha/100.png'),
  101: require('../assets/icon_particles_200_alpha/101.png'),
  102: require('../assets/icon_particles_200_alpha/102.png'),
  103: require('../assets/icon_particles_200_alpha/103.png'),
  104: require('../assets/icon_particles_200_alpha/104.png'),
  105: require('../assets/icon_particles_200_alpha/105.png'),
  106: require('../assets/icon_particles_200_alpha/106.png'),
  107: require('../assets/icon_particles_200_alpha/107.png'),
  108: require('../assets/icon_particles_200_alpha/108.png'),
  109: require('../assets/icon_particles_200_alpha/109.png'),
  110: require('../assets/icon_particles_200_alpha/110.png'),
  111: require('../assets/icon_particles_200_alpha/111.png'),
  112: require('../assets/icon_particles_200_alpha/112.png'),
  113: require('../assets/icon_particles_200_alpha/113.png'),
  114: require('../assets/icon_particles_200_alpha/114.png'),
  115: require('../assets/icon_particles_200_alpha/115.png'),
  116: require('../assets/icon_particles_200_alpha/116.png'),
  117: require('../assets/icon_particles_200_alpha/117.png'),
  118: require('../assets/icon_particles_200_alpha/118.png'),
  119: require('../assets/icon_particles_200_alpha/119.png'),
  120: require('../assets/icon_particles_200_alpha/120.png'),
  121: require('../assets/icon_particles_200_alpha/121.png'),
  122: require('../assets/icon_particles_200_alpha/122.png'),
  123: require('../assets/icon_particles_200_alpha/123.png'),
  124: require('../assets/icon_particles_200_alpha/124.png'),
  125: require('../assets/icon_particles_200_alpha/125.png'),
  126: require('../assets/icon_particles_200_alpha/126.png'),
  127: require('../assets/icon_particles_200_alpha/127.png'),
  128: require('../assets/icon_particles_200_alpha/128.png'),
  129: require('../assets/icon_particles_200_alpha/129.png'),
  130: require('../assets/icon_particles_200_alpha/130.png'),
  131: require('../assets/icon_particles_200_alpha/131.png'),
  132: require('../assets/icon_particles_200_alpha/132.png'),
  133: require('../assets/icon_particles_200_alpha/133.png'),
  134: require('../assets/icon_particles_200_alpha/134.png'),
  135: require('../assets/icon_particles_200_alpha/135.png'),
  136: require('../assets/icon_particles_200_alpha/136.png'),
  137: require('../assets/icon_particles_200_alpha/137.png'),
  138: require('../assets/icon_particles_200_alpha/138.png'),
  139: require('../assets/icon_particles_200_alpha/139.png'),
  140: require('../assets/icon_particles_200_alpha/140.png'),
  141: require('../assets/icon_particles_200_alpha/141.png'),
  142: require('../assets/icon_particles_200_alpha/142.png'),
  143: require('../assets/icon_particles_200_alpha/143.png'),
  144: require('../assets/icon_particles_200_alpha/144.png'),
  145: require('../assets/icon_particles_200_alpha/145.png'),
  146: require('../assets/icon_particles_200_alpha/146.png'),
  147: require('../assets/icon_particles_200_alpha/147.png'),
  148: require('../assets/icon_particles_200_alpha/148.png'),
  149: require('../assets/icon_particles_200_alpha/149.png'),
  150: require('../assets/icon_particles_200_alpha/150.png'),
  151: require('../assets/icon_particles_200_alpha/151.png'),
  152: require('../assets/icon_particles_200_alpha/152.png'),
  153: require('../assets/icon_particles_200_alpha/153.png'),
  154: require('../assets/icon_particles_200_alpha/154.png'),
  155: require('../assets/icon_particles_200_alpha/155.png'),
  156: require('../assets/icon_particles_200_alpha/156.png'),
  157: require('../assets/icon_particles_200_alpha/157.png'),
  158: require('../assets/icon_particles_200_alpha/158.png'),
  159: require('../assets/icon_particles_200_alpha/159.png'),
  160: require('../assets/icon_particles_200_alpha/160.png'),
  161: require('../assets/icon_particles_200_alpha/161.png'),
  162: require('../assets/icon_particles_200_alpha/162.png'),
  163: require('../assets/icon_particles_200_alpha/163.png'),
  164: require('../assets/icon_particles_200_alpha/164.png'),
  165: require('../assets/icon_particles_200_alpha/165.png'),
  166: require('../assets/icon_particles_200_alpha/166.png'),
  167: require('../assets/icon_particles_200_alpha/167.png'),
  168: require('../assets/icon_particles_200_alpha/168.png'),
  169: require('../assets/icon_particles_200_alpha/169.png'),
  170: require('../assets/icon_particles_200_alpha/170.png'),
  171: require('../assets/icon_particles_200_alpha/171.png'),
  172: require('../assets/icon_particles_200_alpha/172.png'),
  173: require('../assets/icon_particles_200_alpha/173.png'),
  174: require('../assets/icon_particles_200_alpha/174.png'),
  175: require('../assets/icon_particles_200_alpha/175.png'),
  176: require('../assets/icon_particles_200_alpha/176.png'),
  177: require('../assets/icon_particles_200_alpha/177.png'),
  178: require('../assets/icon_particles_200_alpha/178.png'),
  179: require('../assets/icon_particles_200_alpha/179.png'),
  180: require('../assets/icon_particles_200_alpha/180.png'),
  181: require('../assets/icon_particles_200_alpha/181.png'),
  182: require('../assets/icon_particles_200_alpha/182.png'),
  183: require('../assets/icon_particles_200_alpha/183.png'),
  184: require('../assets/icon_particles_200_alpha/184.png'),
  185: require('../assets/icon_particles_200_alpha/185.png'),
  186: require('../assets/icon_particles_200_alpha/186.png'),
  187: require('../assets/icon_particles_200_alpha/187.png'),
  188: require('../assets/icon_particles_200_alpha/188.png'),
  189: require('../assets/icon_particles_200_alpha/189.png'),
  190: require('../assets/icon_particles_200_alpha/190.png'),
  191: require('../assets/icon_particles_200_alpha/191.png'),
  192: require('../assets/icon_particles_200_alpha/192.png'),
  193: require('../assets/icon_particles_200_alpha/193.png'),
  194: require('../assets/icon_particles_200_alpha/194.png'),
  195: require('../assets/icon_particles_200_alpha/195.png'),
  196: require('../assets/icon_particles_200_alpha/196.png'),
  197: require('../assets/icon_particles_200_alpha/197.png'),
  198: require('../assets/icon_particles_200_alpha/198.png'),
  199: require('../assets/icon_particles_200_alpha/199.png'),
  200: require('../assets/icon_particles_200_alpha/200.png'),
};

const buildSegments = (totalPx: number, count: number) => {
  const base = Math.floor(totalPx / count);
  const remainder = totalPx - base * count;
  const sizes = Array.from({ length: count }, (_, i) =>
    i < remainder ? base + 1 : base,
  );
  const offsets = Array.from({ length: count }, () => 0);
  let acc = 0;
  for (let i = 0; i < count; i++) {
    offsets[i] = acc;
    acc += sizes[i];
  }
  return { sizes, offsets };
};

const COL_SEG = buildSegments(SOURCE_PX, COLS);
const ROW_SEG = buildSegments(SOURCE_PX, ROWS);

type ParticleData = {
  index: number;
  finalX: number;
  finalY: number;
  initialX: number;
  initialY: number;
  width: number;
  height: number;
};

type ParticleProps = ParticleData & {
  progress: Animated.SharedValue<number>;
};

const Particle: React.FC<ParticleProps> = ({
  index,
  finalX,
  finalY,
  initialX,
  initialY,
  width,
  height,
  progress,
}) => {
  const style = useAnimatedStyle(() => {
    const x = initialX + (finalX - initialX) * progress.value;
    const y = initialY + (finalY - initialY) * progress.value;
    return { transform: [{ translateX: x }, { translateY: y }] };
  });

  return (
    <Animated.View style={[styles.particleBase, { width, height }, style]}>
      <Image
        source={particleImages[index]}
        style={styles.particleImage}
        resizeMode="stretch"
      />
    </Animated.View>
  );
};

type AnimatedSplashScreenProps = {
  onAnimationComplete: () => void;
};

const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationComplete,
}) => {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const progress = useSharedValue(0);

  const scale = ICON_SIZE / SOURCE_PX;
  const centerX = screenW / 2 - ICON_SIZE / 2;
  const centerY = screenH / 2 - ICON_SIZE / 2;

  const particles = useMemo<ParticleData[]>(() => {
    const data: ParticleData[] = [];
    for (let i = 1; i <= COLS * ROWS; i++) {
      const gridIndex = i - 1;
      const c = gridIndex % COLS;
      const r = Math.floor(gridIndex / COLS);

      const pieceW = COL_SEG.sizes[c] * scale;
      const pieceH = ROW_SEG.sizes[r] * scale;

      const finalX = centerX + COL_SEG.offsets[c] * scale;
      const finalY = centerY + ROW_SEG.offsets[r] * scale;

      const initialX = Math.random() * Math.max(1, screenW - pieceW);
      const initialY = Math.random() * Math.max(1, screenH - pieceH);

      data.push({
        index: i,
        finalX,
        finalY,
        initialX,
        initialY,
        width: pieceW,
        height: pieceH,
      });
    }
    return data;
  }, [centerX, centerY, screenW, screenH, scale]);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      SPLASH_DELAY_MS,
      withTiming(
        1,
        { duration: SPLASH_DURATION_MS, easing: Easing.out(Easing.cubic) },
        finished => {
          if (finished) runOnJS(onAnimationComplete)();
        },
      ),
    );
  }, [progress, onAnimationComplete]);

  return (
    <View style={styles.container}>
      {particles.map(p => (
        <Particle key={p.index} {...p} progress={progress} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  particleBase: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  particleImage: {
    width: '100%',
    height: '100%',
  },
});

export default AnimatedSplashScreen;
