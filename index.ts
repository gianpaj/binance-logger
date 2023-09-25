import {
  FuturesPositionTrade,
  MainClient,
  NewSpotOrderParams,
  OrderResponseFull,
  SymbolPrice,
  USDMClient,
} from "binance";
import _ from "lodash";
import { table } from "table";

const key = process.env.APIKEY || "";
const secret = process.env.APISECRET || "";

// const client = new MainClient({
//   api_key: key,
//   api_secret: secret,
//   beautifyResponses: true,
// });

const usdmClient = new USDMClient({
  api_key: key,
  api_secret: secret,
  beautifyResponses: true,
});

interface TradeElem extends Pick<FuturesPositionTrade, "symbol" | "price" | "qty" | "commission" | "realizedPnl"> {
  time: string | number;
  side: string | number;
}
//

function trimToDecimalPlaces(number: number, precision: number = 4): number {
  return parseFloat(Number(number).toFixed(precision));
  // const array: any[] = number.toString().split(".");
  // array.push(array.pop().substring(0, precision));
  // const trimmedstr = array.join(".");
  // return parseFloat(trimmedstr);
}

/**
 * This is a very silly demonstration on placing market orders using various parts of the module.
 * By default it will use 50% of your available USDT balance to buy BTC and sell it again.
 */

(async () => {
  try {
    /**
     * Get available balance
     */

    // const balance = await usdmClient.getBalance();
    // const usdtBal = balance.find((assetBal) => assetBal.asset === "USDT");
    // console.log("USDT balance object: ", usdtBal);

    // yesterday at midnight
    const yesterdayAtMidnight = new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000;

    // const todayAtMidnight = new Date().setHours(0, 0, 0, 0);
    const startTime = new Date(yesterdayAtMidnight).getTime();

    // @ts-ignore
    let trades = await usdmClient.getAccountTrades({ startTime });
    // @ts-ignore
    const mytrades = trades.map<TradeElem>((trade) => {
      const mytrade = _.pick(trade, ["time", "symbol", "side", "price", "qty", "commission", "realizedPnl"]);
      return {
        ...mytrade,
        time: new Date(trade.time).toLocaleString(),
        realizedPnl: trimToDecimalPlaces(Number(mytrade.realizedPnl)),
      };
    });

    // add header
    mytrades.unshift({
      time: "time",
      symbol: "symbol",
      side: "side",
      price: "price",
      qty: "qty",
      commission: "commission",
      realizedPnl: "realizedPnl",
    });

    const commissions = trades.reduce((sum, trade) => sum + Number(trade.commission), 0);
    // console.log("commissions:", trimToDecimalPlaces(commissions), "USDT");

    const realizedPnl = trades.reduce((sum, trade) => sum + Number(trade.realizedPnl), 0);
    // console.log("realizedPnl:", trimToDecimalPlaces(realizedPnl), "USDT");

    // add totals
    mytrades.push({
      time: "total",
      symbol: "",
      side: "",
      price: "",
      qty: "",
      commission: trimToDecimalPlaces(commissions),
      realizedPnl: trimToDecimalPlaces(realizedPnl),
    });

    const arrayOfArrays = mytrades.map((trade) => Object.values(trade));

    console.log(table(arrayOfArrays));

    console.log("number of trades:", trades.length);

    const wins = trades.filter((trade) => Number(trade.realizedPnl) > 0);
    const losses = trades.filter((trade) => Number(trade.realizedPnl) < 0);
    console.log("wins:", wins.length);
    console.log("losses:", losses.length);

    const winLossRatio = wins.length / (wins.length + losses.length);
    console.log("win-loss ratio:", trimToDecimalPlaces(winLossRatio * 100, 2), "%");

    // per symbol stats
    const symbols = _.uniq(trades.map((trade) => trade.symbol));

    // for each symbol display stats
    const perSymbolTrades = symbols.map((symbol) => {
      const symbolTrades = trades.filter((trade) => trade.symbol === symbol);
      const realizedPnl = symbolTrades.reduce((sum, trade) => sum + Number(trade.realizedPnl), 0);
      return {
        symbol,
        realizedPnl: trimToDecimalPlaces(realizedPnl),
        trades: symbolTrades.length,
      };
    });
    perSymbolTrades.unshift({
      symbol: "symbol",
      realizedPnl: "realizedPnl",
      trades: "trades",
    });
    console.log(table(perSymbolTrades.map((trade) => Object.values(trade))));

    // /**
    //  * Get last asset price
    //  */
    // const btcTicker = (await client.getSymbolPriceTicker({ symbol: symbol })) as SymbolPrice;
    // const lastPrice = btcTicker?.price;
    // if (!lastPrice) {
    //   return console.error("Error: no price returned");
    // }

    // /**
    //  * Calculate and submit buy amount
    //  */
    // const buyAmountBtc = +(buyAmountValue / Number(lastPrice)).toFixed(assetDecimalPlaces);
    // console.log(`Last ${symbol} price: ${lastPrice} => will buy ${buyAmountBtc} ${symbol}`);

    // const buyOrderRequest: NewSpotOrderParams = {
    //   symbol: symbol,
    //   quantity: buyAmountBtc,
    //   side: "BUY",
    //   type: "MARKET",
    //   /**
    //    * ACK = confirmation of order acceptance (no placement/fill information) -> OrderResponseACK
    //    * RESULT = fill state -> OrderResponseResult
    //    * FULL = fill state + detail on fills and other detail -> OrderResponseFull
    //    */
    //   newOrderRespType: "FULL",
    // };

    // console.log(`Submitting buy order: `, buyOrderRequest);
    // await client.testNewOrder(buyOrderRequest);
    // const buyOrderResult = (await client.submitNewOrder(buyOrderRequest)) as OrderResponseFull;
    // console.log(`Order result: `, JSON.stringify({ request: buyOrderRequest, response: buyOrderResult }, null, 2));

    // /**
    //  * Process bought fills and submit sell amount
    //  */
    // const assetAmountBought = buyOrderResult.executedQty;
    // const assetFillsMinusFees = buyOrderResult.fills.reduce(
    //   (sum, fill) => sum + Number(fill.qty) - (fill.commissionAsset !== "BNB" ? Number(fill.commission) : 0),
    //   0
    // );
    // console.log(`Filled buy ${symbol} ${assetAmountBought} : bought minus fees ${assetFillsMinusFees}`);

    // const sellOrderRequest: NewSpotOrderParams = {
    //   symbol: symbol,
    //   quantity: trimToDecimalPlaces(assetFillsMinusFees, assetDecimalPlaces),
    //   side: "SELL",
    //   type: "MARKET",
    //   newOrderRespType: "FULL",
    // };

    // console.log(`Submitting sell order: `, sellOrderRequest);
    // await client.testNewOrder(sellOrderRequest);
    // const sellOrderResult = (await client.submitNewOrder(sellOrderRequest)) as OrderResponseFull;
    // console.log(`Order result: `, JSON.stringify({ request: sellOrderRequest, response: sellOrderResult }, null, 2));

    // console.log(`All ${symbol} should have been sold!`);
  } catch (e) {
    console.error("Error: request failed: ", e);
  }

  // process.exit(1);
})();
