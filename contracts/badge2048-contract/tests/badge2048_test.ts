import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

// simnet is available globally via vitest-environment-clarinet
// Type definitions are in vitest.d.ts

describe("Badge2048 Contract Tests", () => {
  describe("Mint Badge", () => {
    it("should mint badge with valid score", () => {
      const wallet1 = simnet.deployer;
      
      // Mint bronze badge with score 1024
      const result = simnet.callPublicFn(
        "badge2048",
        "mint-badge",
        [Cl.stringAscii("bronze"), Cl.uint(1024)],
        wallet1
      );
      
      expect(result.result).toBeOk(Cl.uint(1));
      
      // Check ownership
      // get-badge-ownership returns (ok (map-get? ...)) which is ResponseOk, not OptionalSome
      const ownership = simnet.callReadOnlyFn(
        "badge2048",
        "get-badge-ownership",
        [Cl.principal(wallet1), Cl.stringAscii("bronze")],
        wallet1
      );
      expect(ownership.result).toBeOk(Cl.some(Cl.uint(1)));
      
      // Check high score updated
      const highScore = simnet.callReadOnlyFn(
        "badge2048",
        "get-high-score",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(highScore.result).toBeOk(Cl.uint(1024));
    });

    it("should fail to mint badge with invalid score (too low)", () => {
      const wallet1 = simnet.deployer;
      
      // Try to mint bronze badge with score below threshold
      const result = simnet.callPublicFn(
        "badge2048",
        "mint-badge",
        [Cl.stringAscii("bronze"), Cl.uint(500)], // Below 1024 threshold
        wallet1
      );
      
      expect(result.result).toBeErr(Cl.uint(1002)); // ERR-SCORE-TOO-LOW
    });

    it("should fail to mint duplicate badge", () => {
      const wallet1 = simnet.deployer;
      
      // Mint bronze badge first time
      const result1 = simnet.callPublicFn(
        "badge2048",
        "mint-badge",
        [Cl.stringAscii("bronze"), Cl.uint(1024)],
        wallet1
      );
      expect(result1.result).toBeOk(Cl.uint(1));
      
      // Try to mint same badge again
      const result2 = simnet.callPublicFn(
        "badge2048",
        "mint-badge",
        [Cl.stringAscii("bronze"), Cl.uint(2048)],
        wallet1
      );
      
      expect(result2.result).toBeErr(Cl.uint(1003)); // ERR-ALREADY-MINTED
    });

    it("should mint all badge tiers", () => {
      const wallet1 = simnet.deployer;
      
      // Mint all tiers
      const bronzeResult = simnet.callPublicFn(
        "badge2048",
        "mint-badge",
        [Cl.stringAscii("bronze"), Cl.uint(1024)],
        wallet1
      );
      expect(bronzeResult.result).toBeOk(Cl.uint(1));
      
      const silverResult = simnet.callPublicFn(
        "badge2048",
        "mint-badge",
        [Cl.stringAscii("silver"), Cl.uint(2048)],
        wallet1
      );
      expect(silverResult.result).toBeOk(Cl.uint(2));
      
      const goldResult = simnet.callPublicFn(
        "badge2048",
        "mint-badge",
        [Cl.stringAscii("gold"), Cl.uint(4096)],
        wallet1
      );
      expect(goldResult.result).toBeOk(Cl.uint(3));
      
      const eliteResult = simnet.callPublicFn(
        "badge2048",
        "mint-badge",
        [Cl.stringAscii("elite"), Cl.uint(8192)],
        wallet1
      );
      expect(eliteResult.result).toBeOk(Cl.uint(4));
      
      // Verify all badges owned
      // get-badge-ownership returns (ok (map-get? ...)) which is ResponseOk
      const bronze = simnet.callReadOnlyFn(
        "badge2048",
        "get-badge-ownership",
        [Cl.principal(wallet1), Cl.stringAscii("bronze")],
        wallet1
      );
      expect(bronze.result).toBeOk(Cl.some(Cl.uint(1)));
      
      const silver = simnet.callReadOnlyFn(
        "badge2048",
        "get-badge-ownership",
        [Cl.principal(wallet1), Cl.stringAscii("silver")],
        wallet1
      );
      expect(silver.result).toBeOk(Cl.some(Cl.uint(2)));
      
      const gold = simnet.callReadOnlyFn(
        "badge2048",
        "get-badge-ownership",
        [Cl.principal(wallet1), Cl.stringAscii("gold")],
        wallet1
      );
      expect(gold.result).toBeOk(Cl.some(Cl.uint(3)));
      
      const elite = simnet.callReadOnlyFn(
        "badge2048",
        "get-badge-ownership",
        [Cl.principal(wallet1), Cl.stringAscii("elite")],
        wallet1
      );
      expect(elite.result).toBeOk(Cl.some(Cl.uint(4)));
    });
  });

  describe("High Score", () => {
    it("should update high score", () => {
      const wallet1 = simnet.deployer;
      
      // Update with initial score
      const result1 = simnet.callPublicFn(
        "badge2048",
        "update-high-score",
        [Cl.uint(1000)],
        wallet1
      );
      expect(result1.result).toBeOk(Cl.bool(true));
      
      // Update with higher score
      const result2 = simnet.callPublicFn(
        "badge2048",
        "update-high-score",
        [Cl.uint(2000)],
        wallet1
      );
      expect(result2.result).toBeOk(Cl.bool(true));
      
      // Try to update with lower score (should return false)
      const result3 = simnet.callPublicFn(
        "badge2048",
        "update-high-score",
        [Cl.uint(1500)],
        wallet1
      );
      expect(result3.result).toBeOk(Cl.bool(false));
      
      // Verify high score is still 2000
      const highScore = simnet.callReadOnlyFn(
        "badge2048",
        "get-high-score",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(highScore.result).toBeOk(Cl.uint(2000));
    });

    it("should get player high score", () => {
      const wallet1 = simnet.deployer;
      
      // Set high score via mint
      simnet.callPublicFn(
        "badge2048",
        "mint-badge",
        [Cl.stringAscii("bronze"), Cl.uint(1024)],
        wallet1
      );
      
      // Get high score
      const highScore = simnet.callReadOnlyFn(
        "badge2048",
        "get-high-score",
        [Cl.principal(wallet1)],
        wallet1
      );
      expect(highScore.result).toBeOk(Cl.uint(1024));
    });
  });

  describe("Badge Ownership", () => {
    it("should get badge ownership", () => {
      const wallet1 = simnet.deployer;
      // Use your testnet wallet address for testing
      const wallet2 = "ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5";
      
      // Mint badge for wallet1
      simnet.callPublicFn(
        "badge2048",
        "mint-badge",
        [Cl.stringAscii("silver"), Cl.uint(2048)],
        wallet1
      );
      
      // Check wallet1 owns silver badge
      // get-badge-ownership returns (ok (map-get? ...)) which is ResponseOk
      const ownership1 = simnet.callReadOnlyFn(
        "badge2048",
        "get-badge-ownership",
        [Cl.principal(wallet1), Cl.stringAscii("silver")],
        wallet1
      );
      expect(ownership1.result).toBeOk(Cl.some(Cl.uint(1)));
      
      // Check wallet2 does not own silver badge
      const ownership2 = simnet.callReadOnlyFn(
        "badge2048",
        "get-badge-ownership",
        [Cl.principal(wallet2), Cl.stringAscii("silver")],
        wallet2
      );
      expect(ownership2.result).toBeOk(Cl.none());
    });
  });

  describe("Events", () => {
    it("should emit badge-minted event on mint", () => {
      const wallet1 = simnet.deployer;
      const { result, events } = simnet.callPublicFn(
        "badge2048",
        "mint-badge",
        [Cl.stringAscii("bronze"), Cl.uint(1024)],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1));
      expect(events.length).toBeGreaterThan(0);
      const eventsStr = JSON.stringify(events);
      expect(eventsStr).toContain("badge-minted");
    });

    it("should emit high-score-updated event on update", () => {
      const wallet1 = simnet.deployer;
      const { result, events } = simnet.callPublicFn(
        "badge2048",
        "update-high-score",
        [Cl.uint(3000)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
      expect(events.length).toBeGreaterThan(0);
      const eventsStr = JSON.stringify(events);
      expect(eventsStr).toContain("high-score-updated");
    });

    it("should not emit high-score-updated when score not higher", () => {
      const wallet1 = simnet.deployer;
      simnet.callPublicFn(
        "badge2048",
        "update-high-score",
        [Cl.uint(5000)],
        wallet1
      );
      const { result, events } = simnet.callPublicFn(
        "badge2048",
        "update-high-score",
        [Cl.uint(4000)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(false));
      expect(events.length).toBe(0);
    });
  });

  describe("SIP-009 NFT Functions", () => {
    it("should implement SIP-009 NFT functions", () => {
      const wallet1 = simnet.deployer;
      // Use your testnet wallet address for testing
      const wallet2 = "ST22ZCY5GAH27T4CK3ATG4QTZJQV6FXPRBAQ0BRW5";
      
      // Mint a badge
      const mintResult = simnet.callPublicFn(
        "badge2048",
        "mint-badge",
        [Cl.stringAscii("bronze"), Cl.uint(1024)],
        wallet1
      );
      expect(mintResult.result).toBeOk(Cl.uint(1));
      
      // Test get-owner
      const owner = simnet.callReadOnlyFn(
        "badge2048",
        "get-owner",
        [Cl.uint(1)],
        wallet1
      );
      expect(owner.result).toBeOk(Cl.some(Cl.principal(wallet1)));
      
      // Test get-last-token-id
      const lastId = simnet.callReadOnlyFn(
        "badge2048",
        "get-last-token-id",
        [],
        wallet1
      );
      expect(lastId.result).toBeOk(Cl.uint(1));
      
      // Test get-token-uri
      // Contract returns string-ascii, not string-utf8
      const tokenUri = simnet.callReadOnlyFn(
        "badge2048",
        "get-token-uri",
        [Cl.uint(1)],
        wallet1
      );
      expect(tokenUri.result).toBeOk(Cl.some(Cl.stringAscii("https://badge2048.com/metadata/")));
      
      // Test transfer
      const transferResult = simnet.callPublicFn(
        "badge2048",
        "transfer",
        [
          Cl.uint(1),
          Cl.principal(wallet1),
          Cl.principal(wallet2)
        ],
        wallet1
      );
      expect(transferResult.result).toBeOk(Cl.bool(true));
      
      // Verify new owner
      const newOwner = simnet.callReadOnlyFn(
        "badge2048",
        "get-owner",
        [Cl.uint(1)],
        wallet2
      );
      expect(newOwner.result).toBeOk(Cl.some(Cl.principal(wallet2)));
    });
  });
});
