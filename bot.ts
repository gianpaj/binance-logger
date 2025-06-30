import { Bot } from "https://deno.land/x/grammy/mod.ts";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN environment variable not set");
}

// open Deno KV store
const kv = await Deno.openKv();

// key helpers
const SUBSCRIBERS_KEY = ["subscribers"];
const TOP_SYMBOLS_KEY = ["topSymbols"];
function baselineKey(symbol: string) {
  return ["baseline", symbol];
}

// Telegram bot setup
const bot = new Bot(BOT_TOKEN);

bot.command("start", async (ctx) => {
  const subs = (await kv.get<number[]>(SUBSCRIBERS_KEY)).value ?? [];
  const active = subs.includes(ctx.chat.id);
  await ctx.reply(
    active ? "Alerts active." : "Alerts inactive. Use /alertme to subscribe.",
  );
});

bot.command("alertme", async (ctx) => {
  const chatId = ctx.chat.id;
  const subs = new Set<number>(
    (await kv.get<number[]>(SUBSCRIBERS_KEY)).value ?? [],
  );
  subs.add(chatId);
  await kv.set(SUBSCRIBERS_KEY, Array.from(subs));
  await ctx.reply("You will receive price alerts.");
});

async function getSubscribers(): Promise<number[]> {
  return (await kv.get<number[]>(SUBSCRIBERS_KEY)).value ?? [];
}

async function fetchTopSymbols() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
    const data = await res.json();
    data.sort((a: any, b: any) => Number(b.quoteVolume) - Number(a.quoteVolume));
    const top: string[] = data.slice(0, 10).map((d: any) => d.symbol);
    await kv.set(TOP_SYMBOLS_KEY, top);
    for (const sym of top) {
      const info = data.find((d: any) => d.symbol === sym);
      await kv.set(baselineKey(sym), Number(info.lastPrice));
    }
    console.log("Updated top symbols", top);
  } catch (err) {
    console.error("Failed to fetch top symbols", err);
  }
}

let ws: WebSocket | null = null;

async function connectWs() {
  ws = new WebSocket("wss://stream.binance.com:9443/ws/!miniTicker@arr");

  ws.onopen = () => console.log("WebSocket connected");

  ws.onmessage = async (evt) => {
    const updates = JSON.parse(evt.data);
    const top = (await kv.get<string[]>(TOP_SYMBOLS_KEY)).value ?? [];
    for (const u of updates) {
      if (!top.includes(u.s)) continue;
      const key = baselineKey(u.s);
      const baseline = (await kv.get<number>(key)).value;
      const price = Number(u.c);
      if (baseline === undefined) {
        await kv.set(key, price);
        continue;
      }
      const diff = (price - baseline) / baseline;
      if (Math.abs(diff) >= 0.03) {
        const subs = await getSubscribers();
        for (const id of subs) {
          await bot.api.sendMessage(
            id,
            `${u.s} moved ${(diff * 100).toFixed(2)}% to ${price}`,
          );
        }
        await kv.set(key, price);
      }
    }
  };

  ws.onclose = () => {
    console.log("WebSocket closed, reconnecting...");
    setTimeout(connectWs, 5000);
  };

  ws.onerror = (err) => {
    console.error("WebSocket error", err);
    ws?.close();
  };
}

await fetchTopSymbols();
setInterval(fetchTopSymbols, 4 * 60 * 60 * 1000);
connectWs();

bot.start();
