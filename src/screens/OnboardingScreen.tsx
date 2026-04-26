import Ionicons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Image, ImageSourcePropType, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RootStackParamList } from "../navigation/types";
import { setOnboardingSeen } from "../services/localStorage";

type Slide = {
  id: string;
  image: ImageSourcePropType;
  palette: {
    bg: string;
    card: string;
    chip: string;
    chipText: string;
    cta: string;
    text: string;
    muted: string;
  };
};

const SLIDES: Slide[] = [
  {
    id: "welcome",
    image: require("../../assets/10SS.png"),
    palette: {
      bg: "#EEF4FF",
      card: "#FFFFFF",
      chip: "#DCEBFF",
      chipText: "#0F3F7A",
      cta: "#114B8E",
      text: "#0E1B32",
      muted: "#4E6582",
    },
  },
  {
    id: "week",
    image: require("../../assets/1ss.png"),
    palette: {
      bg: "#EAF2FF",
      card: "#FFFFFF",
      chip: "#DCEBFF",
      chipText: "#0F3F7A",
      cta: "#114B8E",
      text: "#0E1B32",
      muted: "#4E6582",
    },
  },
  {
    id: "recipes",
    image: require("../../assets/2ss.png"),
    palette: {
      bg: "#FFF1F4",
      card: "#FFFFFF",
      chip: "#FFDDE8",
      chipText: "#8F1A4A",
      cta: "#9D2F67",
      text: "#2E1020",
      muted: "#7C4E63",
    },
  },
  {
    id: "grocery",
    image: require("../../assets/3ss.png"),
    palette: {
      bg: "#EAF9F2",
      card: "#FFFFFF",
      chip: "#D3F3E3",
      chipText: "#0B6A4F",
      cta: "#0D7A5B",
      text: "#0A2B21",
      muted: "#4B6B61",
    },
  },
  {
    id: "premium",
    image: require("../../assets/7ss.png"),
    palette: {
      bg: "#F2F0FF",
      card: "#FFFFFF",
      chip: "#E4DDFF",
      chipText: "#45228E",
      cta: "#5B35B5",
      text: "#1E1341",
      muted: "#645790",
    },
  },
];
export const OnboardingScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const isTransitioning = useRef(false);
  const canUseNativeDriver = Platform.OS !== "web";

  const slide = useMemo(() => SLIDES[index], [index]);
  const slideCopy = useMemo(() => {
    const base = `onboarding.slides.${slide.id}`;
    return {
      title: t(`${base}.title`),
      subtitle: t(`${base}.subtitle`),
      bullets: t(`${base}.bullets`, { returnObjects: true }) as string[],
      note: t(`${base}.note`),
    };
  }, [slide.id, t]);
  const isLast = index === SLIDES.length - 1;
  const isWelcomeSlide = slide.id === "welcome";
  const isCompact = height < 760 || width < 380;
  const screenshotHeight = isCompact ? 205 : 280;
  const cardHeight = Math.max(560, Math.min(840, Math.floor(height * 0.88)));
  const welcomeImageHeight = Math.max(420, Math.min(640, cardHeight - 140));
  const containerHorizontal = isCompact ? 12 : 18;

  const animateTo = (next: number) => {
    if (isTransitioning.current || next === index) return;
    isTransitioning.current = true;
    Animated.timing(fade, { toValue: 0, duration: 130, useNativeDriver: canUseNativeDriver }).start(() => {
      setIndex(next);
      Animated.timing(fade, { toValue: 1, duration: 190, useNativeDriver: canUseNativeDriver }).start(() => {
        isTransitioning.current = false;
      });
    });
  };

  const complete = async () => {
    await setOnboardingSeen();
    navigation.replace("MainTabs");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: slide.palette.bg, paddingHorizontal: containerHorizontal }]}>
      <View style={[styles.bgBlob, styles.bgBlobTop, { backgroundColor: slide.palette.chip }]} />
      <View style={[styles.bgBlob, styles.bgBlobBottom, { backgroundColor: slide.palette.chip }]} />

      <Animated.View
        style={[
          styles.floatCard,
          {
            opacity: fade,
            marginTop: Math.max(insets.top, 12) + 14,
            marginBottom: Math.max(insets.bottom, 12) + 12,
            backgroundColor: slide.palette.card,
            height: cardHeight,
            paddingHorizontal: isWelcomeSlide ? 0 : isCompact ? 12 : 16,
            paddingTop: isWelcomeSlide ? 0 : isCompact ? 12 : 14,
            paddingBottom: isCompact ? 12 : 14,
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isWelcomeSlide && styles.scrollContentWelcome]}>
          {!isWelcomeSlide ? (
            <View style={styles.topRow}>
              <View style={[styles.badge, { backgroundColor: slide.palette.chip }]}>
                <Text style={[styles.badgeText, { color: slide.palette.chipText }]}>
                  {t("onboarding.step")} {index}/{SLIDES.length - 1}
                </Text>
              </View>
              <Pressable
                style={styles.skipBtn}
                onPress={() => void complete()}
                accessibilityRole="button"
                accessibilityLabel={t("onboarding.skip")}
              >
                <Text style={[styles.skip, { color: slide.palette.text }]}>{t("onboarding.skip")}</Text>
              </Pressable>
            </View>
          ) : null}

          {!isWelcomeSlide ? (
            <View style={styles.contentWrap}>
              <Text style={[styles.title, { color: slide.palette.text }]}>{slideCopy.title}</Text>
              <Text style={[styles.subtitle, { color: slide.palette.muted }]}>{slideCopy.subtitle}</Text>
              <View style={styles.points}>
                {slideCopy.bullets.map((bullet) => (
                  <View style={styles.pointRow} key={`${slide.id}-${bullet}`}>
                    <Ionicons name="checkmark-circle" size={15} color={slide.palette.cta} />
                    <Text style={[styles.pointText, { color: slide.palette.text }]}>{bullet}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.noteCard, { borderColor: slide.palette.chip, backgroundColor: slide.palette.bg }]}>
                <Ionicons name="sparkles" size={14} color={slide.palette.cta} />
                <Text style={[styles.noteText, { color: slide.palette.muted }]}>{slideCopy.note}</Text>
              </View>
            </View>
          ) : null}

          <View
            style={[
              styles.shotWrap,
              isWelcomeSlide ? [styles.shotWrapWelcome, { height: welcomeImageHeight }] : { height: screenshotHeight + 14 },
            ]}
          >
            <View style={[styles.shotInner, isWelcomeSlide && styles.shotInnerWelcome]}>
              <Image source={slide.image} resizeMode={isWelcomeSlide ? "contain" : "cover"} style={[styles.shot, isWelcomeSlide && styles.shotWelcome]} />
            </View>
          </View>

          {!isWelcomeSlide ? (
            <View style={styles.dotRow}>
              {SLIDES.slice(1).map((item, dotIndex) => (
                <View
                  key={item.id}
                  style={[
                    styles.dot,
                    dotIndex === index - 1 && [styles.dotActive, { backgroundColor: slide.palette.cta }],
                    dotIndex !== index - 1 && { backgroundColor: "#C9D2E1" },
                  ]}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, isWelcomeSlide && styles.footerWelcome]}>
          {!isWelcomeSlide ? (
            <Pressable
              style={[styles.backBtn, index === 0 && styles.backBtnDisabled]}
              disabled={index === 0}
              onPress={() => index > 0 && animateTo(index - 1)}
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.back", { defaultValue: "Back" })}
              accessibilityState={{ disabled: index === 0 }}
            >
              <Ionicons name="chevron-back" size={18} color={index === 0 ? "#9CA7BA" : "#334155"} />
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.nextBtn, isWelcomeSlide && styles.nextBtnWelcome, { backgroundColor: slide.palette.cta }]}
            onPress={() => (isLast ? void complete() : animateTo(index + 1))}
            accessibilityRole="button"
            accessibilityLabel={
              isWelcomeSlide ? t("onboarding.follow") : isLast ? t("onboarding.start") : t("onboarding.continue")
            }
          >
            <Text style={styles.nextText}>
              {isWelcomeSlide ? t("onboarding.follow") : isLast ? t("onboarding.start") : t("onboarding.continue")}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18 },
  bgBlob: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.3,
  },
  bgBlobTop: {
    width: 260,
    height: 260,
    top: -80,
    right: -60,
  },
  bgBlobBottom: {
    width: 240,
    height: 240,
    bottom: -80,
    left: -70,
  },
  floatCard: {
    flexShrink: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E6ECF5",
    shadowColor: "#0B162A",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 7,
    overflow: "hidden",
  },
  scrollContent: { paddingBottom: 8 },
  scrollContentWelcome: { flexGrow: 1, justifyContent: "center" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.9 },
  skipBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8E2EF",
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  skip: { fontSize: 14, fontWeight: "700" },
  contentWrap: { marginTop: 12 },
  title: { fontSize: 46, lineHeight: 48, fontWeight: "800", letterSpacing: -1.1 },
  subtitle: { marginTop: 6, fontSize: 18, lineHeight: 24, fontWeight: "600" },
  points: { marginTop: 8, gap: 5 },
  pointRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pointText: { fontSize: 14, flex: 1 },
  noteCard: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noteText: { fontSize: 14, fontWeight: "600", flex: 1 },
  shotWrap: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE4F1",
    backgroundColor: "#FFFFFF",
    padding: 7,
    overflow: "hidden",
  },
  shotWrapWelcome: {
    marginTop: 0,
    borderWidth: 0,
    padding: 0,
    backgroundColor: "transparent",
    borderRadius: 0,
  },
  shotInner: {
    flex: 1,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  shotInnerWelcome: {
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  shotWelcome: { borderRadius: 0 },
  shot: { width: "100%", height: "100%", borderRadius: 13 },
  dotRow: { marginTop: 12, flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 99 },
  dotActive: { width: 24 },
  footer: { marginTop: "auto", paddingTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footerWelcome: { justifyContent: "center", marginTop: 8, paddingTop: 8 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D7DFEA",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnDisabled: { opacity: 0.45 },
  nextBtn: {
    minWidth: 190,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  nextBtnWelcome: { width: "88%", alignSelf: "center" },
  nextText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
});
