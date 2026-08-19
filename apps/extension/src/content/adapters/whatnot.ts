import type { BidEvent, SaleEvent } from "@duck-desk/shared";

type WhatnotDetectedEvent = SaleEvent | BidEvent;
type EmitShowEvent = (event: WhatnotDetectedEvent) => void;

const SALE_TEXT = /\b(sold|auction ended|winner|won)\b/i;
const BID_TEXT = /\b(bid|bidder|current bid|high bid|placed a bid)\b/i;
const PRICE_TEXT = /\$([0-9][0-9,]*(?:\.[0-9]{1,2})?)/;
const USER_TEXT = /@([a-z0-9_.-]{2,32})/i;

export function createWhatnotObserver(emitEvent: EmitShowEvent): { start: () => void; stop: () => void } {
  let observer: MutationObserver | null = null;
  const recentlySeen = new Set<string>();

  function start(): void {
    if (observer) {
      return;
    }

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          const event = parseNodeForShowEvent(node);
          if (!event) {
            continue;
          }

          const signature = event.type === "sale"
            ? `${event.type}:${event.buyer}:${event.amount}:${event.item ?? ""}`
            : `${event.type}:${event.bidder}:${event.amount}:${event.item ?? ""}`;
          if (recentlySeen.has(signature)) {
            continue;
          }

          recentlySeen.add(signature);
          window.setTimeout(() => recentlySeen.delete(signature), 30_000);
          emitEvent(event);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  function stop(): void {
    observer?.disconnect();
    observer = null;
  }

  return { start, stop };
}

function parseNodeForShowEvent(node: Node): WhatnotDetectedEvent | null {
  const element = node instanceof Element ? node : node.parentElement;
  if (!element) {
    return null;
  }

  const scope = findLikelyEventScope(element);
  if (!scope) {
    return null;
  }

  const text = collapseText(scope.textContent ?? "");
  return parseSaleText(text) ?? parseBidText(text);
}

function parseSaleText(text: string): SaleEvent | null {
  if (!SALE_TEXT.test(text)) {
    return null;
  }

  const amount = extractAmount(text);
  const buyer = extractBuyer(text);
  if (!amount || !buyer) {
    return null;
  }

  return {
    type: "sale",
    buyer,
    amount,
    item: extractItem(text),
    timestamp: Date.now()
  };
}

function parseBidText(text: string): BidEvent | null {
  if (SALE_TEXT.test(text) || !BID_TEXT.test(text)) {
    return null;
  }

  const amount = extractAmount(text);
  const bidder = extractBidder(text);
  if (!amount || !bidder) {
    return null;
  }

  return {
    type: "bid",
    bidder,
    amount,
    item: extractItem(text),
    timestamp: Date.now()
  };
}

function findLikelyEventScope(element: Element): Element | null {
  let current: Element | null = element;

  for (let depth = 0; current && depth < 4; depth += 1) {
    const text = collapseText(current.textContent ?? "");
    if (text.length > 8 && text.length < 600 && (SALE_TEXT.test(text) || BID_TEXT.test(text))) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

function extractAmount(text: string): number | null {
  const match = text.match(PRICE_TEXT);
  return match ? Number(match[1].replace(/,/g, "")) : null;
}

function extractBuyer(text: string): string | null {
  const explicitUser = text.match(USER_TEXT);
  if (explicitUser) {
    return explicitUser[1];
  }

  const winner = text.match(/(?:winner|won by|buyer)\s*:?\s*([a-z0-9_.-]{2,32})/i);
  return winner ? winner[1] : null;
}

function extractBidder(text: string): string | null {
  const explicitUser = text.match(USER_TEXT);
  if (explicitUser) {
    return explicitUser[1];
  }

  const bidder = text.match(/(?:bidder|bid by|high bid|from)\s*:?\s*([a-z0-9_.-]{2,32})/i);
  return bidder ? bidder[1] : null;
}

function extractItem(text: string): string | undefined {
  const item = text.match(/(?:item|auction|lot)\s*:?\s*([^$@]{3,80})/i);
  return item ? item[1].trim() : undefined;
}

function collapseText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
