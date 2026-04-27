#!/usr/bin/env node
/**
 * Build-time script: fetch published blog posts from DDB -> JSON.
 *
 * Runs as part of `npm run build` (prebuild step).
 * Writes frontend/src/data/published-blogs.json which is imported
 * by blog/page.tsx and blog/[slug]/page.tsx at compile time so the
 * resulting static HTML includes the AI-drafted posts.
 *
 * In local dev without AWS creds, writes an empty array and the
 * frontend falls back to its hardcoded posts.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const REGION = process.env.AWS_REGION ?? 'us-west-2';
const TABLE = 'mesahomes-main';
const OUT_PATH = join(
  dirname(new URL(import.meta.url).pathname),
  '..',
  'src',
  'data',
  'published-blogs.json',
);

interface PublishedBlog {
  slug: string;
  title: string;
  metaDescription: string;
  bodyMarkdown: string;
  topic: string;
  publishedAt: string;
  photos: { url: string; attribution: string; alt: string }[];
  citationSources: { url: string; attribution: string }[];
}

async function fetchBlogs(): Promise<PublishedBlog[]> {
  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

  const resp = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk',
      ExpressionAttributeValues: { ':pk': 'BLOG#PUBLISHED' },
      ScanIndexForward: false,
      Limit: 500,
    }),
  );

  return (resp.Items ?? []).map((item) => {
    const data = item.data ?? item; // handle both nested and flat storage
    return {
      slug: data.slug ?? item.slug,
      title: data.title ?? item.title,
      metaDescription: data.metaDescription ?? item.metaDescription,
      bodyMarkdown: data.bodyMarkdown ?? item.bodyMarkdown,
      topic: data.topic ?? item.topic,
      publishedAt: data.publishedAt ?? item.publishedAt,
      photos: data.photos ?? item.photos ?? [],
      citationSources: data.citationSources ?? item.citationSources ?? [],
    };
  });
}

async function main() {
  let blogs: PublishedBlog[] = [];
  try {
    blogs = await fetchBlogs();
    console.log(`[fetch-blog] Fetched ${blogs.length} published blog posts from DDB`);
  } catch (err) {
    console.warn(
      `[fetch-blog] DDB fetch failed (${(err as Error).message}). Writing empty blog list — static build will fall back to hardcoded posts.`,
    );
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(blogs, null, 2));
  console.log(`[fetch-blog] Wrote ${OUT_PATH}`);
}

void main();
