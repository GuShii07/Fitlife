import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const { width: W, height: H } = Dimensions.get("window");

const ORANGE = "#FF5A3C";
const BG = "#0B1118";
const CARD = "#0E1620";

type Slide = {
  title: string;
  highlight: string;
  subtitle: string;
  image: any; // require(...)
};

const SLIDES: Slide[] = [
  {
    title: "Start your journey\nwith ",
    highlight: "Fitlife",
    subtitle: "Log in your meals of the day to track your calories and macros",
    image: require("../assets/Onboarding/food.jpg"),
  },
  {
    title: "Track workouts\nand ",
    highlight: "Progress",
    subtitle: "Monitor sets, reps, and improvements over time",
    image: require("../assets/Onboarding/workout.jpg"),
  },
  {
    title: "Train smarter\nwith ",
    highlight: "Experts",
    subtitle: "Connect with professional trainers for personalised fitness guidance",
    image: require("../assets/Onboarding/trainer.jpg"),
  },
  {
    title: "Stay motivated\nwith ",
    highlight: "Gamification",
    subtitle: "Earn streaks, badges, and rewards",
    image: require("../assets/Onboarding/gamify.jpg"),
  },
];

export default function Onboarding() {
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* IMAGE STACK (must NOT block touches) */}
      <View style={styles.imageStack} pointerEvents="none">
        {SLIDES.map((item, index) => {
          const imageStyle = useAnimatedStyle(() => {
            const x = scrollX.value / W;

            const scale = interpolate(
              x,
              [index - 1, index, index + 1],
              [0.85, 1, 0.85],
              Extrapolate.CLAMP
            );

            const translateX = interpolate(
              scrollX.value,
              [(index - 1) * W, index * W, (index + 1) * W],
              [42, 0, -42],
              Extrapolate.CLAMP
            );

            const translateY = interpolate(
              x,
              [index - 1, index, index + 1],
              [14, 0, 14],
              Extrapolate.CLAMP
            );

            // Use a derived zIndex so current slide is on top
            const zIndex = Math.round(
              interpolate(
                x,
                [index - 1, index, index + 1],
                [0, 10, 0],
                Extrapolate.CLAMP
              )
            );

            // Keep only nearby cards visible (cleaner stacking)
            const opacity = index < x + 1.2 && index > x - 1.2 ? 1 : 0;

            return {
              transform: [{ translateX }, { translateY }, { scale }],
              zIndex,
              opacity,
            };
          });

          return (
            <Animated.View key={index} style={[styles.imageCard, imageStyle]}>
              <Image source={item.image} style={styles.image} />
            </Animated.View>
          );
        })}
      </View>

      {/* TEXT + SWIPE TRACKING LAYER */}
      <Animated.FlatList
        data={SLIDES}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <View style={{ width: W, flex: 1, alignItems: "center" }}>
            <Text style={styles.title}>
              {item.title}
              <Text style={styles.highlight}>{item.highlight}</Text>
            </Text>

            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* BOTTOM UI */}
      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const dotStyle = useAnimatedStyle(() => {
              const x = scrollX.value / W;

              return {
                width: interpolate(
                  x,
                  [i - 1, i, i + 1],
                  [6, 20, 6],
                  Extrapolate.CLAMP
                ),
                opacity: interpolate(
                  x,
                  [i - 1, i, i + 1],
                  [0.3, 1, 0.3],
                  Extrapolate.CLAMP
                ),
              };
            });

            return <Animated.View key={i} style={[styles.dot, dotStyle]} />;
          })}
        </View>

        <Pressable style={styles.btn} onPress={() => router.push("../auth/ChooseRole")}>
          <Text style={styles.btnText} >Get started for Free</Text>
        </Pressable>

        <Text style={styles.login}>
          Already have an account?{" "}
          <Text style={styles.loginLink} onPress={() => router.push("../auth/Login")}>
            Log In
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: 60,
  },

  // stacked image area (absolute)
  imageStack: {
    position: "absolute",
    top: 150,
    width: "100%",
    height: H * 0.53,
    alignItems: "center",
  },

  imageCard: {
    position: "absolute",
    width: W - 44,
    height: "100%",
    backgroundColor: CARD,
    borderRadius: 22,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    lineHeight: 32,
  },

  highlight: {
    color: ORANGE,
  },

  // Put subtitle under the card (Figma-like)
  subtitle: {
    marginTop: 150 + H * 0.45 + 18 - 60, // aligns below the image stack visually
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    paddingHorizontal: 30,
    lineHeight: 22,
    fontWeight: "600",
  },

  bottom: {
    position: "absolute",
    bottom: 35,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 22,
  },

  dots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },

  dot: {
    height: 6,
    backgroundColor: "white",
    borderRadius: 999,
  },

  btn: {
    height: 56,
    width: "100%",
    backgroundColor: ORANGE,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  btnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  login: {
    marginTop: 12,
    color: "rgba(255,255,255,0.7)",
  },

  loginLink: {
    color: ORANGE,
    fontWeight: "700",
  },
});