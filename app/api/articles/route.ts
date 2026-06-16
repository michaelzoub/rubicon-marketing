import { NextResponse } from "next/server";
import { createArticle, readArticleRegistry, type CreateArticleInput } from "@/lib/articles";

export async function GET() {
  const registry = await readArticleRegistry();
  return NextResponse.json(registry);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateArticleInput>;

  if (!body.gated_post_url || !body.title || !body.content || !body.price_per_word || !body.max_price || !body.connected_profile_source || !body.author_username || !body.verification_status) {
    return NextResponse.json({ error: "gated_post_url, title, content, price_per_word, max_price, connected_profile_source, author_username, and verification_status are required" }, { status: 400 });
  }

  const article = await createArticle({
    gated_post_url: body.gated_post_url,
    title: body.title,
    content: body.content,
    price_per_word: body.price_per_word,
    max_price: body.max_price,
    connected_profile_source: body.connected_profile_source,
    author_username: body.author_username,
    author_wallet_address: body.author_wallet_address,
    verification_status: body.verification_status,
  });

  return NextResponse.json({ article }, { status: 201 });
}
