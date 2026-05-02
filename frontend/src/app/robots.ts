import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

/**
 * robots.txt — explicitly allows all major AI crawlers + standard bots.
 *
 * Rationale: MesaHomes is content-heavy (market data, neighborhood
 * guides, legal content, AI-drafted posts). We want LLMs (ChatGPT,
 * Claude, Perplexity, Google AI Overviews) to cite our primary-source
 * content to build authority. Blocking them would hurt long-term
 * discoverability.
 *
 * Reference: AI bot identification via
 * https://darkvisitors.com/agents (community-maintained list)
 */
export default function robots(): MetadataRoute.Robots {
  const allowAllWithDashboardBlocked = (ua: string) => ({
    userAgent: ua,
    allow: '/',
    disallow: ['/dashboard/', '/auth/'],
  });

  return {
    rules: [
      allowAllWithDashboardBlocked('*'),

      // OpenAI crawlers
      allowAllWithDashboardBlocked('GPTBot'),
      allowAllWithDashboardBlocked('OAI-SearchBot'), // ChatGPT search results
      allowAllWithDashboardBlocked('ChatGPT-User'), // user-initiated fetches

      // Anthropic (Claude)
      allowAllWithDashboardBlocked('ClaudeBot'),
      allowAllWithDashboardBlocked('anthropic-ai'),
      allowAllWithDashboardBlocked('Claude-Web'),

      // Perplexity
      allowAllWithDashboardBlocked('PerplexityBot'),
      allowAllWithDashboardBlocked('Perplexity-User'),

      // Google AI Overviews and Gemini
      allowAllWithDashboardBlocked('Google-Extended'),
      allowAllWithDashboardBlocked('GoogleOther'),

      // Microsoft Copilot / Bing AI
      allowAllWithDashboardBlocked('cohere-ai'),

      // Meta AI (Llama-trained crawlers)
      allowAllWithDashboardBlocked('FacebookBot'),
      allowAllWithDashboardBlocked('meta-externalagent'),

      // Common Crawl (used by many LLMs for training data)
      allowAllWithDashboardBlocked('CCBot'),

      // Apple Intelligence
      allowAllWithDashboardBlocked('Applebot-Extended'),

      // Amazon (Alexa / Q)
      allowAllWithDashboardBlocked('Amazonbot'),

      // You.com, Bytespider (TikTok/ByteDance), Mistral
      allowAllWithDashboardBlocked('YouBot'),
      allowAllWithDashboardBlocked('Bytespider'),
      allowAllWithDashboardBlocked('MistralAI-User'),

      // Brave Leo
      allowAllWithDashboardBlocked('Brave-Search'),

      // DuckDuckGo (upstream of many LLMs)
      allowAllWithDashboardBlocked('DuckAssistBot'),
    ],
    sitemap: 'https://mesahomes.com/sitemap.xml',
    host: 'https://mesahomes.com',
  };
}
