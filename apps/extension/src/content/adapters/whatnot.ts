import type {
  AudienceActionEvent,
  BidEvent,
  SaleEvent,
  ShareEvent,
  ShowEvent,
  TipEvent
} from "@duck-desk/shared";

type WhatnotDetectedEvent = ShowEvent;
type EmitShowEvent = (event: WhatnotDetectedEvent) => void;

const SALE_TEXT = /\b(sold|auction ended|winner|won)\b/i;
const BID_TEXT = /\b(bid|bidder|current bid|high bid|placed a bid)\b/i;
const ACTION_TEXT = /\b(followed|bookmark|liked|reacted|joined|commented|chat)\b/i;
const TIP_TEXT = /\b(tipped|sent\s+(?:a\s+)?(?:\$[\d,.]+\s+)?tip|tip\s+from)\b/i;
const SHARE_TEXT = /\b(shared\s+(?:the|this|your)\s+(?:show|stream)|shared\s+(?:a\s+)?show)\b/i;
const PRICE_TEXT = /\$([0-9][0-9,]*(?:\.[0-9]{1,2})?)/;
const USER_TEXT = /@([a-z0-9_.-]{2,32})/i;

export function createWhatnotObserver(emitEvent: EmitShowEvent): { start: () => void; stop: () => void } {
  let observer: MutationObserver | null = null;
  const recentlySeen = new Set<string>();
  let shareCountBaseline: number | null = null;
  let hasObservedShareCount = false;
  let shareScanScheduled = false;
  let lastAttributedShareAt = 0;

  function start(): void {
    if (observer) {
      return;
    }
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const changedNodes = mutation.type === "childList"
          ? Array.from(mutation.addedNodes)
          : [mutation.target];
        for (const node of changedNodes) {
          const event = parseNodeForShowEvent(node);
          if (!event) {
            continue;
          }

          if (event.type === "share") {
            lastAttributedShareAt = Date.now();
          }
          emitOnce(event);
        }
      }
      scheduleShareCountScan();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "title"]
    });

    const initialShareCount = findVisibleShareCount();
    shareCountBaseline = initialShareCount ?? 0;
    hasObservedShareCount = initialShareCount !== null;
  }

  function stop(): void {
    observer?.disconnect();
    observer = null;
  }

  return { start, stop };

  function emitOnce(event: WhatnotDetectedEvent): void {
    const signature = signatureForEvent(event);
    if (recentlySeen.has(signature)) {
      return;
    }

    recentlySeen.add(signature);
    window.setTimeout(() => recentlySeen.delete(signature), 30_000);
    emitEvent(event);
  }

  function scheduleShareCountScan(): void {
    if (shareScanScheduled) {
      return;
    }
    shareScanScheduled = true;
    window.setTimeout(() => {
      shareScanScheduled = false;
      scanShareCount();
    }, 80);
  }

  function scanShareCount(): void {
    const count = findVisibleShareCount();
    if (count === null) {
      return;
    }
    const transition = evaluateShareCountTransition(
      shareCountBaseline,
      count,
      hasObservedShareCount
    );
    shareCountBaseline = transition.baseline;
    hasObservedShareCount = transition.hasObservedCount;
    if (transition.delta === null) {
      return;
    }

    if (Date.now() - lastAttributedShareAt < 1_500) {
      return;
    }
    emitOnce({
      type: "share",
      shareCount: count,
      delta: transition.delta,
      timestamp: Date.now()
    });
  }
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

  const event = parseWhatnotText(scope.textContent ?? "");
  if ((event?.type === "tip" || event?.type === "share") && !isTrustedSystemNotification(scope)) {
    return null;
  }
  return event;
}

export function parseWhatnotText(rawText: string): WhatnotDetectedEvent | null {
  const text = collapseText(rawText);
  return parseTipText(text) ?? parseShareText(text) ?? parseSaleText(text) ?? parseBidText(text) ?? parseAudienceActionText(text);
}

function signatureForEvent(event: WhatnotDetectedEvent): string {
  if (event.type === "sale") {
    return `${event.type}:${event.buyer}:${event.amount}:${event.item ?? ""}`;
  }

  if (event.type === "bid") {
    return `${event.type}:${event.bidder}:${event.amount}:${event.item ?? ""}`;
  }

  if (event.type === "tip") {
    return `${event.type}:${event.tipper}:${event.amount}:${event.message ?? ""}`;
  }

  if (event.type === "share") {
    return `${event.type}:${event.actor ?? "count"}:${event.shareCount ?? ""}:${event.delta ?? ""}`;
  }

  return `${event.type}:${event.actor}:${event.action}:${event.message ?? ""}`;
}

function parseTipText(text: string): TipEvent | null {
  if (!TIP_TEXT.test(text)) {
    return null;
  }

  const amount = extractAmount(text);
  const tipper = extractActor(text, /([a-z0-9_.-]{2,32})\s+(?:tipped|sent\s+(?:a\s+)?(?:\$[\d,.]+\s+)?tip)\b/i)
    ?? text.match(/\btip\s+from\s*:?[ ]*([a-z0-9_.-]{2,32})\b/i)?.[1]
    ?? null;
  if (!amount || !tipper) {
    return null;
  }

  return {
    type: "tip",
    tipper,
    amount,
    message: extractTipMessage(text),
    timestamp: Date.now()
  };
}

function parseShareText(text: string): ShareEvent | null {
  if (!SHARE_TEXT.test(text)) {
    return null;
  }

  const actor = extractActor(text, /([a-z0-9_.-]{2,32})\s+shared\s+(?:the|this|your|a)\s+(?:show|stream)\b/i);
  if (!actor) {
    return null;
  }

  return {
    type: "share",
    actor,
    delta: 1,
    timestamp: Date.now()
  };
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

function parseAudienceActionText(text: string): AudienceActionEvent | null {
  if (!ACTION_TEXT.test(text) || SALE_TEXT.test(text) || BID_TEXT.test(text) || TIP_TEXT.test(text) || SHARE_TEXT.test(text)) {
    return null;
  }

  const actor = extractActor(text, /([a-z0-9_.-]{2,32})\s+(?:followed|bookmarked|liked|reacted|joined|commented)\b/i);
  if (!actor) {
    return null;
  }

  return {
    type: "audience_action",
    actor,
    action: text.match(/\b(followed|follow)\b/i)
      ? "follow"
      : text.match(/\b(bookmark|bookmarked)\b/i)
        ? "bookmark"
        : text.match(/\b(commented|chat)\b/i)
          ? "chat"
          : "reaction",
    message: text.slice(0, 120),
    timestamp: Date.now()
  };
}

function findLikelyEventScope(element: Element): Element | null {
  let current: Element | null = element;

  for (let depth = 0; current && depth < 4; depth += 1) {
    const text = collapseText(current.textContent ?? "");
    if (
      text.length > 8 &&
      text.length < 600 &&
      (SALE_TEXT.test(text) || BID_TEXT.test(text) || ACTION_TEXT.test(text) || TIP_TEXT.test(text) || SHARE_TEXT.test(text))
    ) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

function isTrustedSystemNotification(element: Element): boolean {
  let current: Element | null = element;

  for (let depth = 0; current && depth < 5; depth += 1) {
    const role = current.getAttribute("role")?.toLowerCase();
    const currentText = collapseText(current.textContent ?? "");
    if ((role === "status" || role === "alert") && currentText.length < 220) {
      return true;
    }

    const markers = [
      current.getAttribute("data-testid"),
      current.getAttribute("data-test"),
      current.getAttribute("data-qa"),
      current.getAttribute("aria-label"),
      current.getAttribute("class")
    ]
      .filter((value): value is string => Boolean(value))
      .join(" ")
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase();
    if (
      /(?:^|[\s_-])(?:system[-_ ]?(?:message|notification)|tip[-_ ]?(?:event|notification|message)|event[-_ ]?message|transaction[-_ ]?event|auction[-_ ]?event)(?:[\s_-]|$)/.test(markers)
    ) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

function extractActor(text: string, fallbackPattern: RegExp): string | null {
  return text.match(USER_TEXT)?.[1] ?? text.match(fallbackPattern)?.[1] ?? null;
}

function findVisibleShareCount(): number | null {
  const labeledCandidates = Array.from(document.querySelectorAll<HTMLElement>(
    "[aria-label*='share' i], [title*='share' i], [data-testid*='share' i]"
  ));
  const textCandidates = Array.from(document.querySelectorAll<HTMLElement>("button, [role='button']"))
    .filter((element) => /\bshares?\b/i.test(collapseText(element.textContent ?? "")));

  for (const candidate of [...labeledCandidates, ...textCandidates]) {
    const labels = [
      candidate.getAttribute("aria-label") ?? "",
      candidate.getAttribute("title") ?? "",
      candidate.textContent ?? "",
      candidate.parentElement?.textContent ?? ""
    ].map(collapseText).filter((text) => text.length > 0 && text.length < 120);

    for (const label of labels) {
      const count = parseShareCount(label, true);
      if (count !== null) {
        return count;
      }
    }
  }

  return null;
}

export function parseShareCount(text: string, shareContext = true): number | null {
  const collapsed = collapseText(text);
  const contextual = collapsed.match(/(?:shares?|shared)(?:\s+count)?\s*[:\-]?\s*(\d[\d,.]*[kKmM]?)/i)
    ?? collapsed.match(/(\d[\d,.]*[kKmM]?)\s*(?:shares?|shared)\b/i);
  const exact = shareContext ? collapsed.match(/^(\d[\d,.]*[kKmM]?)$/) : null;
  const token = contextual?.[1] ?? exact?.[1];
  if (!token) {
    return null;
  }

  const suffix = token.slice(-1).toLowerCase();
  const multiplier = suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : 1;
  const numeric = Number(token.replace(/[kKmM,]/g, ""));
  return Number.isFinite(numeric) ? Math.round(numeric * multiplier) : null;
}

export function evaluateShareCountTransition(
  baseline: number | null,
  count: number,
  hasObservedCount: boolean
): { baseline: number; delta: number | null; hasObservedCount: boolean } {
  if (!hasObservedCount && count > 1) {
    return { baseline: count, delta: null, hasObservedCount: true };
  }

  baseline ??= 0;

  if (count <= baseline) {
    return { baseline: count, delta: null, hasObservedCount: true };
  }

  return { baseline: count, delta: count - baseline, hasObservedCount: true };
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

function extractTipMessage(text: string): string | undefined {
  const message = text.match(/\$[0-9][0-9,]*(?:\.[0-9]{1,2})?\s*(?:[-|:])\s*(.{2,100})$/)?.[1];
  return message?.trim() || undefined;
}

function collapseText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
