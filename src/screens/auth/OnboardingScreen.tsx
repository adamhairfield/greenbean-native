import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logo from '../../components/Logo';

const { width } = Dimensions.get('window');

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;
};

const onboardingData = [
  {
    id: '1',
    image: require('../../../assets/onboarding-1.png'),
    title: 'Know your food,\nknow your farmer',
    description: 'Learn about growing practices, farm locations, and the people who grow your food with care.',
  },
  {
    id: '2',
    image: require('../../../assets/onboarding-2.png'),
    title: 'Eat local,\nsupport farmers',
    description: 'Purchase directly from farmers in your community. Fresher food, stronger local economy.',
  },
  {
    id: '3',
    image: require('../../../assets/onboarding-3.png'),
    title: 'Local harvests,\nat your fingertips',
    description: 'Connect with nearby farmers for the freshest seasonal produce. Less time shopping, more time enjoying.',
  },
  {
    id: '4',
    image: require('../../../assets/onboarding-4.png'),
    title: 'Grow your business,\nsimplify your sales',
    description: 'Manage inventory, track orders, and connect with local customers all in one place.',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        setCurrentIndex(index);
      },
    }
  );

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.replace('SignIn');
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.replace('SignUp');
  };

  const renderItem = ({ item }: { item: typeof onboardingData[0] }) => (
    <View style={styles.slide}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />

      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Logo width={200} height={34} />
      </View>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        style={styles.carousel}
      />

      <View style={styles.pagination}>
        {onboardingData.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: '#34A853',
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={currentIndex === onboardingData.length - 1 ? handleGetStarted : handleSkip}
        >
          <Text style={styles.buttonSecondaryText}>
            {currentIndex === onboardingData.length - 1 ? 'Log in' : 'Skip'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={currentIndex === onboardingData.length - 1 ? handleGetStarted : handleNext}
        >
          <Text style={styles.buttonPrimaryText}>
            {currentIndex === onboardingData.length - 1 ? 'Sign up' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
  },
  carousel: {
    flex: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: width * 0.85,
    height: width * 0.85,
    marginBottom: 20,
  },
  textContainer: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 100,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#34A853',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: '#d9d9d9',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
    backgroundColor: '#fff',
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: '#34A853',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default OnboardingScreen;
