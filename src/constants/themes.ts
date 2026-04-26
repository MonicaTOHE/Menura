export type AppThemeOption = {
  id: string;
  name: string;
  subtitle: string;
  colors: [string, string, string];
  ui: {
    screenBg: string;
    card: string;
    cardAlt: string;
    border: string;
    text: string;
    muted: string;
    primary: string;
    secondary: string;
    softTint: string;
  };
};

export const APP_THEMES: AppThemeOption[] = [
  {
    id: "oceano",
    name: "Oceano",
    subtitle: "Azul elegante",
    colors: ["#2D5FA0", "#60A5FA", "#DBEAFE"],
    ui: {
      screenBg: "#EEF4FB",
      card: "#FFFFFF",
      cardAlt: "#F8FBFF",
      border: "#D6E3F2",
      text: "#0F172A",
      muted: "#64748B",
      primary: "#2D5FA0",
      secondary: "#0F766E",
      softTint: "#EAF2FF",
    },
  },
  {
    id: "menta",
    name: "Menta",
    subtitle: "Fresco y suave",
    colors: ["#0F766E", "#34D399", "#DCFCE7"],
    ui: {
      screenBg: "#ECF8F5",
      card: "#FFFFFF",
      cardAlt: "#F3FCF9",
      border: "#CBEBDD",
      text: "#082F2B",
      muted: "#52706C",
      primary: "#0F766E",
      secondary: "#0EA5A4",
      softTint: "#DCFCE7",
    },
  },
  {
    id: "coral",
    name: "Coral",
    subtitle: "Calido moderno",
    colors: ["#C2410C", "#FB7185", "#FFE4E6"],
    ui: {
      screenBg: "#FFF3F1",
      card: "#FFFFFF",
      cardAlt: "#FFF8F6",
      border: "#F8D5CD",
      text: "#3A1910",
      muted: "#8A5D53",
      primary: "#C2410C",
      secondary: "#E11D48",
      softTint: "#FFE4E6",
    },
  },
  {
    id: "lavanda",
    name: "Lavanda",
    subtitle: "Calmo premium",
    colors: ["#5B21B6", "#A78BFA", "#EDE9FE"],
    ui: {
      screenBg: "#F4F1FF",
      card: "#FFFFFF",
      cardAlt: "#FAF8FF",
      border: "#DDD5FA",
      text: "#261342",
      muted: "#6F63A0",
      primary: "#5B21B6",
      secondary: "#7C3AED",
      softTint: "#EDE9FE",
    },
  },
];

export const getThemeById = (id: string) => APP_THEMES.find((theme) => theme.id === id) ?? APP_THEMES[0];
