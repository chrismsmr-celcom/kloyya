import { TOOLKIT_REGISTRY, ToolkitDefinition } from "./registry";

/**
 * Fine couche au-dessus du SDK `composio-core`.
 *
 * Sans COMPOSIO_API_KEY, l'app tourne en "mode demo" : le registre statique
 * fait office de catalogue, les connexions passent directement en `active`,
 * et l'agent simule ses appels d'outils (voir lib/agent/orchestrator.ts).
 * C'est volontaire : le produit doit rester demontrable sans aucune cle,
 * et passer en mode reel des que la cle est renseignee — sans changement de code.
 */

export const COMPOSIO_ENABLED = !!process.env.COMPOSIO_API_KEY;

let _client: any = null;

/** Lazy singleton pour ne charger composio-core que si necessaire. */
export async function getComposioClient() {
  if (!COMPOSIO_ENABLED) return null;
  if (_client) return _client;

  // Import dynamique : evite d'echouer au build si la dependance/typing bouge.
  const { Composio } = await import("composio-core");
  _client = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
  return _client;
}

export async function listAvailableToolkits(): Promise<ToolkitDefinition[]> {
  // USE_LIVE_TOOLKIT_LIST=true -> interroge Composio pour la liste complete
  // des toolkits disponibles sur le compte, au lieu du registre curatee.
  if (COMPOSIO_ENABLED && process.env.USE_LIVE_TOOLKIT_LIST === "true") {
    try {
      const client = await getComposioClient();
      const remote = await client.toolkits.list();
      return remote.items.map((t: any) => ({
        slug: t.slug,
        name: t.name,
        description: t.meta?.description ?? "",
        category: "productivity",
        letter: (t.name?.[0] ?? "?").toUpperCase(),
        color: "#2159C5",
      }));
    } catch (err) {
      console.error("[composio] listAvailableToolkits fallback:", err);
    }
  }
  return TOOLKIT_REGISTRY;
}

/**
 * Demarre le flux de connexion OAuth pour un toolkit donne.
 * Retourne une URL de redirection vers l'ecran d'autorisation du fournisseur,
 * ou null en mode demo (la connexion est alors activee immediatement).
 */
export async function initiateToolkitConnection(opts: {
  userId: string;
  toolkitSlug: string;
  redirectUrl: string;
}): Promise<{ redirectUrl: string | null; composioConnectionId: string | null }> {
  if (!COMPOSIO_ENABLED) {
    return { redirectUrl: null, composioConnectionId: null };
  }
  const client = await getComposioClient();
  const connection = await client.connectedAccounts.initiate({
    // Le "entity id" Composio = l'identifiant Kloyya de l'utilisateur.
    entityId: opts.userId,
    appName: opts.toolkitSlug,
    redirectUri: opts.redirectUrl,
  });
  return {
    redirectUrl: connection.redirectUrl ?? null,
    composioConnectionId: connection.connectedAccountId ?? connection.id ?? null,
  };
}

/**
 * Recupere, pour un set de toolkits connectes, les schemas d'outils au
 * format "tool use" attendu par l'API Anthropic. En mode demo, on genere
 * des schemas generiques mais coherents (une action "search" et une action
 * "act" par toolkit) pour que l'orchestrateur agent ait toujours quelque
 * chose de plausible a appeler.
 */
export async function getToolSchemasForToolkits(toolkitSlugs: string[]) {
  if (COMPOSIO_ENABLED) {
    const client = await getComposioClient();
    const tools = await client.tools.get({ toolkits: toolkitSlugs, format: "anthropic" });
    return tools;
  }

  return toolkitSlugs.flatMap((slug) => [
    {
      name: `${slug}_search`,
      description: `Rechercher des informations pertinentes dans ${slug} (mode demo, donnees simulees).`,
      input_schema: {
        type: "object",
        properties: { query: { type: "string", description: "Ce qu'il faut chercher" } },
        required: ["query"],
      },
    },
    {
      name: `${slug}_act`,
      description: `Effectuer une action dans ${slug} (ex: envoyer un message, creer un evenement) — mode demo, aucune action reelle n'est executee.`,
      input_schema: {
        type: "object",
        properties: { instruction: { type: "string", description: "Action a effectuer, en langage naturel" } },
        required: ["instruction"],
      },
    },
  ]);
}

/** Execute un appel d'outil Composio reel (ou simule en mode demo). */
export async function executeToolCall(opts: {
  userId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
}): Promise<{ success: boolean; data: unknown }> {
  if (!COMPOSIO_ENABLED) {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 700));
    return {
      success: true,
      data: {
        demo: true,
        note: "Resultat simule — branchez COMPOSIO_API_KEY pour executer reellement cet appel.",
        tool: opts.toolName,
        input: opts.toolInput,
      },
    };
  }

  const client = await getComposioClient();
  const result = await client.tools.execute(opts.toolName, {
    userId: opts.userId,
    arguments: opts.toolInput,
  });
  return { success: !!result?.successful, data: result?.data ?? result };
}
