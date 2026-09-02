/**
 * Registre des outils disponibles pour Kloyya.
 *
 * Composio expose des centaines de toolkits (Gmail, Slack, Notion, GitHub,
 * HubSpot, WhatsApp, Linear, Airtable, Google Calendar, Salesforce...).
 * Pour ne pas dependre d'un appel reseau a chaque affichage, on garde ici
 * une liste "vitrine" curatee de depart : c'est la SEULE liste a completer
 * pour exposer un nouvel outil dans l'UI (Connections, composeur d'outcome).
 *
 * En production, `listAvailableToolkits()` (voir client.ts) peut a la place
 * interroger l'API Composio (`composio.toolkits.list()`) pour obtenir
 * dynamiquement TOUS les toolkits disponibles sur le compte Composio —
 * il suffit de basculer USE_LIVE_TOOLKIT_LIST=true une fois la cle API en place.
 */

export type ToolkitCategory =
  | "email"
  | "calendar"
  | "messaging"
  | "crm"
  | "docs"
  | "dev"
  | "productivity";

export interface ToolkitDefinition {
  slug: string;
  name: string;
  description: string;
  category: ToolkitCategory;
  /** initiale utilisee comme avatar tant qu'on n'a pas d'icone dediee */
  letter: string;
  color: string;
}

export const TOOLKIT_REGISTRY: ToolkitDefinition[] = [
  { slug: "gmail", name: "Gmail", description: "Lire et envoyer des emails", category: "email", letter: "G", color: "#D93025" },
  { slug: "googlecalendar", name: "Google Calendar", description: "Voir et poser des evenements", category: "calendar", letter: "C", color: "#2159C5" },
  { slug: "googledrive", name: "Google Drive", description: "Rechercher et lire des documents", category: "docs", letter: "D", color: "#1E8C96" },
  { slug: "slack", name: "Slack", description: "Lire les canaux, envoyer des messages", category: "messaging", letter: "S", color: "#4A154B" },
  { slug: "notion", name: "Notion", description: "Pages, bases de donnees et notes", category: "docs", letter: "N", color: "#14161A" },
  { slug: "github", name: "GitHub", description: "Issues, PRs et repos", category: "dev", letter: "H", color: "#14161A" },
  { slug: "linear", name: "Linear", description: "Tickets et cycles produit", category: "productivity", letter: "L", color: "#5E6AD2" },
  { slug: "hubspot", name: "HubSpot", description: "Contacts, deals et pipeline CRM", category: "crm", letter: "U", color: "#FF7A59" },
  { slug: "salesforce", name: "Salesforce", description: "Opportunites et comptes", category: "crm", letter: "F", color: "#00A1E0" },
  { slug: "airtable", name: "Airtable", description: "Bases et enregistrements", category: "productivity", letter: "A", color: "#1E7A52" },
  { slug: "outlook", name: "Outlook", description: "Emails et agenda Microsoft", category: "email", letter: "O", color: "#2159C5" },
  { slug: "whatsapp_business", name: "WhatsApp Business", description: "Conversations clients", category: "messaging", letter: "W", color: "#1E7A52" },
];

export function getToolkit(slug: string): ToolkitDefinition | undefined {
  return TOOLKIT_REGISTRY.find((t) => t.slug === slug);
}
