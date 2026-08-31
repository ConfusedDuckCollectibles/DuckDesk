import assert from "node:assert/strict";
import test from "node:test";
import { parseWhatnotText } from "./whatnot";

test("parses purchase wording without an @ handle", () => {
  const event = parseWhatnotText("SleeveKing bought Live Card Lot for $42");
  assert.equal(event?.type, "sale");
  assert.equal(event?.type === "sale" ? event.buyer : undefined, "SleeveKing");
  assert.equal(event?.type === "sale" ? event.amount : undefined, 42);
});

test("parses sold-to winner wording", () => {
  const event = parseWhatnotText("Auction ended Sold to CardFox $115 lot: Holo stack");
  assert.equal(event?.type, "sale");
  assert.equal(event?.type === "sale" ? event.buyer : undefined, "CardFox");
  assert.equal(event?.type === "sale" ? event.amount : undefined, 115);
});

test("parses bid wording without an @ handle", () => {
  const event = parseWhatnotText("TopLoader placed a bid of $31 on Duck Lot");
  assert.equal(event?.type, "bid");
  assert.equal(event?.type === "bid" ? event.bidder : undefined, "TopLoader");
  assert.equal(event?.type === "bid" ? event.amount : undefined, 31);
});

test("parses leading bidder wording", () => {
  const event = parseWhatnotText("High bid from RipCity $28");
  assert.equal(event?.type, "bid");
  assert.equal(event?.type === "bid" ? event.bidder : undefined, "RipCity");
  assert.equal(event?.type === "bid" ? event.amount : undefined, 28);
});

test("keeps sale text from being misread as a bid", () => {
  const event = parseWhatnotText("Auction ended winner: MintStack high bid $64");
  assert.equal(event?.type, "sale");
  assert.equal(event?.type === "sale" ? event.buyer : undefined, "MintStack");
  assert.equal(event?.type === "sale" ? event.amount : undefined, 64);
});
