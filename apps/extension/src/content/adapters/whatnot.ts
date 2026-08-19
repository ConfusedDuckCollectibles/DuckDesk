import type { SaleEvent } from "@duck-desk/shared";

type EmitSale = (event: SaleEvent) => void;

const SALE_TEXT = /\b(sold|auction ended|winner|won)\b/i;
const PRICE_TEXT = /\$([0-9][0-9,]*(?:\.[0-9]{1,2})?)/;
const USER_TEXT = /@([a-z0-9_.-]{2,32})/i;

export function createWhatnotObserver(emitSale: EmitSale): { start: () => void; stop: () => void } {
  let observer: MutationObserver | null = null;
  const recentlySeen = new Set<string>();

  function start(): void {
    if (observer) {
      return;
    }

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          const sale = parseNodeForSale(node);
          if (!sale) {
            continue;
          }

          const signature = `${sale.buyer}:${sale.amount}:${sale.item ?? ""}`;
          if (recentlySeen.has(signature)) {
            continue;
          }

          recentlySeen.add(signature);
          window.setTimeout(() => recentlySeen.delete(signature), 30_000);
          emitSale(sale);
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

function parseNodeForSale(node: Node): SaleEvent | null {
  const element = node instanceof Element ? node : node.parentElement;
  if (!element) {
    return null;
  }

  const scope = findLikelySaleScope(element);
  if (!scope) {
    return null;
  }

  const text = collapseText(scope.textContent ?? "");
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

function findLikelySaleScope(element: Element): Element | null {
  let current: Element | null = element;

  for (let depth = 0; current && depth < 4; depth += 1) {
    const text = collapseText(current.textContent ?? "");
    if (text.length > 8 && text.length < 600 && SALE_TEXT.test(text)) {
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

function extractItem(text: string): string | undefined {
  const item = text.match(/(?:item|auction|lot)\s*:?\s*([^$@]{3,80})/i);
  return item ? item[1].trim() : undefined;
}

function collapseText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
