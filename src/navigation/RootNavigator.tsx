import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { LoadingView } from "../components/LoadingView";
import { APP_THEMES } from "../constants/themes";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { GroceryListScreen } from "../screens/GroceryListScreen";
import { HouseholdMembersScreen } from "../screens/HouseholdMembersScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { PaywallScreen } from "../screens/PaywallScreen";
import { LegalDocumentScreen } from "../screens/LegalDocumentScreen";
import { RecipeDetailScreen } from "../screens/RecipeDetailScreen";
import { RecipeListScreen } from "../screens/RecipeListScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { WeekScreen } from "../screens/WeekScreen";
import { getOnboardingSeen } from "../services/localStorage";
import { useAppStore } from "../store/useAppStore";
import { MainTabParamList, RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const iconByRoute: Record<keyof MainTabParamList, { active: IoniconName; inactive: IoniconName }> = {
  Week: { active: "calendar", inactive: "calendar-outline" },
  Recipes: { active: "restaurant", inactive: "restaurant-outline" },
  Favorites: { active: "star", inactive: "star-outline" },
  Grocery: { active: "basket", inactive: "basket-outline" },
  Settings: { active: "settings", inactive: "settings-outline" },
};

const MainTabs = () => {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const compact = width <= 380 || height <= 700;
  const appThemeId = useAppStore((s) => s.appThemeId);
  const theme = APP_THEMES.find((t) => t.id === appThemeId) ?? APP_THEMES[0];
  const primary = theme.colors[0];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: primary,
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          height: compact ? 74 : 68,
          paddingTop: compact ? 8 : 6,
          paddingBottom: compact ? 12 : 10,
          borderTopWidth: 1,
          borderTopColor: theme.ui.border,
          backgroundColor: theme.ui.card,
        },
        tabBarLabelStyle: {
          fontSize: compact ? 10 : 11,
          lineHeight: compact ? 12 : 14,
          fontWeight: "600",
          paddingBottom: compact ? 1 : 0,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const name = (focused
            ? iconByRoute[route.name as keyof MainTabParamList].active
            : iconByRoute[route.name as keyof MainTabParamList].inactive) as IoniconName;
          return <Ionicons name={name} color={color} size={compact ? 18 : Math.max(18, size - 2)} />;
        },
      })}
    >
      <Tab.Screen name="Week" component={WeekScreen} options={{ title: t("nav.week") }} />
      <Tab.Screen name="Recipes" component={RecipeListScreen} options={{ title: t("nav.recipes") }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: t("nav.favorites") }} />
      <Tab.Screen name="Grocery" component={GroceryListScreen} options={{ title: t("nav.grocery") }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t("nav.settings") }} />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { t } = useTranslation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingSeen, setOnboardingSeenState] = useState(false);

  useEffect(() => {
    void (async () => {
      const seen = await getOnboardingSeen();
      setOnboardingSeenState(seen);
      setCheckingOnboarding(false);
    })();
  }, []);

  if (checkingOnboarding) {
    return <LoadingView text={t("app.loadingPreparing")} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={onboardingSeen ? "MainTabs" : "Onboarding"}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: t("nav.recipes") }} />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{
            title: t("paywall.title"),
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="LegalDocument"
          component={LegalDocumentScreen}
          options={({ route }) => ({
            title: route.params.kind === "privacy" ? t("settings.privacy") : t("settings.terms"),
          })}
        />
        <Stack.Screen
          name="HouseholdMembers"
          component={HouseholdMembersScreen}
          options={{ title: t("members.title", { defaultValue: "Miembros" }) }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
