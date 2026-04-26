import { APP_BRAND } from "./appConstants";

export type LegalDocumentKind = "privacy" | "terms";

type LegalDocumentSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDocumentContent = {
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalDocumentSection[];
  footer: string;
};

const lastUpdated = "2026-04-19";
const supportEmail = "support@menura.app";

export const LEGAL_DOCUMENTS: Record<"es" | "en", Record<LegalDocumentKind, LegalDocumentContent>> = {
  es: {
    privacy: {
      title: "Politica de privacidad",
      intro: `${APP_BRAND} funciona principalmente offline. Esta politica explica que datos usa la app, como se almacenan y que depende de Google Play para las compras in-app.`,
      lastUpdated,
      sections: [
        {
          heading: "1. Datos que guarda la app",
          paragraphs: [
            `${APP_BRAND} guarda informacion local en tu dispositivo para que la app funcione: recetas, favoritos, plan semanal, lista de compras, idioma, tema visual y estado de premium en cache.`,
            "Estos datos se guardan en SQLite y AsyncStorage dentro del dispositivo y no se envian a un backend propio porque hoy la app no usa cuenta ni sincronizacion en la nube.",
          ],
        },
        {
          heading: "2. Compras in-app",
          paragraphs: [
            "Las compras in-app y suscripciones se procesan mediante Google Play Billing.",
            "Google puede tratar datos relacionados con pagos, suscripciones, restauracion de compras y validacion de entitlement bajo sus propias politicas y terminos.",
          ],
        },
        {
          heading: "3. Permisos y acceso",
          paragraphs: [
            `${APP_BRAND} esta diseñada para operar con el minimo de permisos necesarios.`,
            "La app no solicita inicio de sesion, no usa publicidad y no incorpora analytics o tracking de terceros en la implementacion actual del proyecto.",
          ],
        },
        {
          heading: "4. Retencion y control",
          paragraphs: [
            "Los datos locales permanecen en tu dispositivo hasta que desinstales la app o limpies sus datos.",
            "Puedes borrar recetas propias, favoritos y planificaciones desde la experiencia de uso de la app.",
          ],
        },
        {
          heading: "5. Derechos del usuario",
          paragraphs: [
            "Como los datos son locales puedes, en cualquier momento, borrarlos desinstalando la app o limpiando los datos desde los ajustes del sistema (Ajustes > Aplicaciones > Menura > Almacenamiento > Borrar datos).",
            `Si tienes dudas sobre esta politica o quieres ejercer algun derecho previsto por tu legislacion local (GDPR, LGPD, CCPA u otra), escribenos a ${supportEmail}.`,
          ],
        },
        {
          heading: "6. Cambios a esta politica",
          paragraphs: [
            "Si agregamos backend, analytics, sincronizacion o nuevos servicios de terceros, esta politica y la seccion Data safety de Google Play se actualizaran antes de publicar esos cambios.",
          ],
        },
        {
          heading: "7. Contacto",
          paragraphs: [
            `Responsable del tratamiento: equipo de ${APP_BRAND}.`,
            `Correo de contacto: ${supportEmail}.`,
          ],
        },
      ],
      footer: `Ultima actualizacion: ${lastUpdated}. Si tienes dudas, escribe a ${supportEmail}.`,
    },
    terms: {
      title: "Terminos de servicio",
      intro: `Estos terminos regulan el uso de ${APP_BRAND} como app de planificacion de comidas y compras para uso personal.`,
      lastUpdated,
      sections: [
        {
          heading: "1. Uso de la app",
          paragraphs: [
            `${APP_BRAND} se entrega como una herramienta de productividad personal para organizar recetas, semanas y listas de compras.`,
            "No garantizamos que la informacion nutricional, disponibilidad de ingredientes o resultados de recetas sea exacta para todos los casos.",
          ],
        },
        {
          heading: "2. Contenido y responsabilidad del usuario",
          paragraphs: [
            "Eres responsable del contenido que agregas manualmente, incluyendo recetas propias, notas, ingredientes y listas.",
            "Debes revisar alergenos, porciones y seguridad alimentaria antes de cocinar o compartir una receta.",
          ],
        },
        {
          heading: "3. Premium, suscripciones y compra unica",
          paragraphs: [
            "La app puede ofrecer un plan mensual auto-renovable y una compra unica premium.",
            "Los precios, renovacion, cancelacion y reembolsos se rigen por Google Play y por las condiciones que se muestran en el paywall al momento de la compra.",
          ],
        },
        {
          heading: "4. Disponibilidad y cambios",
          paragraphs: [
            "Podemos actualizar, mejorar o retirar funciones de la app para mantener compatibilidad, seguridad y cumplimiento con Google Play.",
            "Si una funcionalidad premium cambia, la comunicacion al usuario debe mantenerse clara y no engañosa.",
          ],
        },
        {
          heading: "5. Limitacion de responsabilidad",
          paragraphs: [
            `${APP_BRAND} se ofrece tal cual, dentro de lo permitido por la ley aplicable.`,
            "No somos responsables por perdidas indirectas, interrupciones del servicio o decisiones de compra basadas en informacion incompleta introducida por el usuario.",
          ],
        },
        {
          heading: "6. Contacto",
          paragraphs: [
            `Para soporte, reportes o consultas legales escribe a ${supportEmail}.`,
          ],
        },
      ],
      footer: `Ultima actualizacion: ${lastUpdated}. Si tienes dudas, escribe a ${supportEmail}.`,
    },
  },
  en: {
    privacy: {
      title: "Privacy Policy",
      intro: `${APP_BRAND} works primarily offline. This policy explains what data the app uses, how it is stored, and what depends on Google Play for in-app purchases.`,
      lastUpdated,
      sections: [
        {
          heading: "1. Data stored by the app",
          paragraphs: [
            `${APP_BRAND} stores information locally on your device so the app can work: recipes, favorites, weekly plans, shopping lists, language, visual theme, and cached premium state.`,
            "This information is stored in SQLite and AsyncStorage on the device and is not sent to a custom backend because the current app does not use sign-in or cloud sync.",
          ],
        },
        {
          heading: "2. In-app purchases",
          paragraphs: [
            "In-app purchases and subscriptions are processed through Google Play Billing.",
            "Google may process payment, subscription, restore-purchase, and entitlement-validation data under its own terms and privacy policies.",
          ],
        },
        {
          heading: "3. Permissions and access",
          paragraphs: [
            `${APP_BRAND} is designed to work with the minimum permissions required.`,
            "The app does not require sign-in, does not use ads, and does not include third-party analytics or tracking in the current implementation.",
          ],
        },
        {
          heading: "4. Retention and control",
          paragraphs: [
            "Local data stays on your device until you uninstall the app or clear app data.",
            "You can delete custom recipes, favorites, and plans from within the app experience.",
          ],
        },
        {
          heading: "5. Your rights",
          paragraphs: [
            "Because data is local, you can delete it at any time by uninstalling the app or clearing app data from your device settings (Settings > Apps > Menura > Storage > Clear data).",
            `If you have questions or want to exercise any right granted by your local laws (GDPR, LGPD, CCPA, or others), contact us at ${supportEmail}.`,
          ],
        },
        {
          heading: "6. Changes to this policy",
          paragraphs: [
            "If we add a backend, analytics, sync, or new third-party services, this policy and the Google Play Data safety answers must be updated before releasing those changes.",
          ],
        },
        {
          heading: "7. Contact",
          paragraphs: [
            `Data controller: ${APP_BRAND} team.`,
            `Contact email: ${supportEmail}.`,
          ],
        },
      ],
      footer: `Last updated: ${lastUpdated}. Contact ${supportEmail} for questions.`,
    },
    terms: {
      title: "Terms of Service",
      intro: `These terms govern the use of ${APP_BRAND} as a meal planning and shopping app for personal use.`,
      lastUpdated,
      sections: [
        {
          heading: "1. App usage",
          paragraphs: [
            `${APP_BRAND} is provided as a personal productivity tool for organizing recipes, weeks, and shopping lists.`,
            "We do not guarantee that nutritional information, ingredient availability, or recipe outcomes will be accurate in every situation.",
          ],
        },
        {
          heading: "2. User content and responsibility",
          paragraphs: [
            "You are responsible for content you add manually, including custom recipes, notes, ingredients, and shopping items.",
            "You should review allergens, servings, and food safety details before cooking or sharing a recipe.",
          ],
        },
        {
          heading: "3. Premium, subscriptions, and lifetime purchase",
          paragraphs: [
            "The app may offer an auto-renewing monthly plan and a premium lifetime purchase.",
            "Pricing, renewal, cancellation, and refunds are governed by Google Play and by the purchase disclosures shown in the paywall at the time of purchase.",
          ],
        },
        {
          heading: "4. Availability and changes",
          paragraphs: [
            "We may update, improve, or remove app features to maintain compatibility, security, and Google Play compliance.",
            "If premium functionality changes, user-facing communication must remain clear and non-misleading.",
          ],
        },
        {
          heading: "5. Limitation of liability",
          paragraphs: [
            `${APP_BRAND} is provided as-is to the extent permitted by applicable law.`,
            "We are not responsible for indirect losses, service interruptions, or purchase decisions based on incomplete information entered by the user.",
          ],
        },
        {
          heading: "6. Contact",
          paragraphs: [
            `For support, reports, or legal inquiries, contact us at ${supportEmail}.`,
          ],
        },
      ],
      footer: `Last updated: ${lastUpdated}. Contact ${supportEmail} for questions.`,
    },
  },
};

