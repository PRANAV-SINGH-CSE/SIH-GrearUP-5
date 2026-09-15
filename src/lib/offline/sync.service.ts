import { IScanRepository } from '../repository/repository.interface';
import { ComplianceEngine } from '../compliance/engine';
import {
  OfflineSyncBatchRequest,
  OfflineSyncBatchResponse,
  SyncItemResult,
} from './offline.interface';

export class OfflineSyncService {
  private repository: IScanRepository;
  private complianceEngine: ComplianceEngine;
  private currentServerRulesetVersion = 'LMPC-2011.v2026';

  constructor(repository: IScanRepository, complianceEngine?: ComplianceEngine) {
    this.repository = repository;
    this.complianceEngine = complianceEngine || new ComplianceEngine();
  }

  async processSyncBatch(batch: OfflineSyncBatchRequest): Promise<OfflineSyncBatchResponse> {
    const results: SyncItemResult[] = [];

    for (const item of batch.items) {
      try {
        // 1. Check idempotency: Has this scan already been synced?
        const existing = await this.repository.findScanByOfflineClientId(item.offlineClientId);
        if (existing) {
          results.push({
            offlineClientId: item.offlineClientId,
            serverScanId: existing.id,
            syncStatus: 'SYNCED',
            serverOverallStatus: existing.overallStatus || 'NEEDS_REVIEW',
            message: 'Scan was previously synchronized.',
          });
          continue;
        }

        // 2. Create scan record on server
        const scan = await this.repository.createScan({
          category: item.category,
          offlineClientId: item.offlineClientId,
          rulesetVersion: this.currentServerRulesetVersion,
        });

        // 3. Save extracted declarations
        await this.repository.saveExtraction(scan.id, item.extractedDeclarations);

        // 4. Check ruleset version conflict
        const isRulesetOutdated = item.localRulesetVersion !== this.currentServerRulesetVersion;

        let finalEvaluation;
        let syncStatus: 'SYNCED' | 'CONFLICT_RULES_UPDATED' = 'SYNCED';
        let message = 'Synchronized successfully with server.';

        if (isRulesetOutdated || !item.localEvaluation) {
          // Re-evaluate deterministically using server's latest ruleset
          finalEvaluation = this.complianceEngine.evaluate({
            scanId: scan.id,
            product: item.extractedDeclarations,
            category: item.category,
            rulesetVersion: this.currentServerRulesetVersion,
          });
          if (isRulesetOutdated) {
            syncStatus = 'CONFLICT_RULES_UPDATED';
            message = `Client ruleset (${item.localRulesetVersion}) was updated to latest server ruleset (${this.currentServerRulesetVersion}). Compliance re-evaluated.`;
          } else {
            syncStatus = 'SYNCED';
            message = 'Synchronized and evaluated successfully on server.';
          }
        } else {
          finalEvaluation = item.localEvaluation;
        }

        // 5. Persist evaluation
        await this.repository.saveComplianceEvaluation(
          scan.id,
          finalEvaluation,
          finalEvaluation.overallStatus
        );

        results.push({
          offlineClientId: item.offlineClientId,
          serverScanId: scan.id,
          syncStatus,
          serverOverallStatus: finalEvaluation.overallStatus,
          message,
        });
      } catch (err: any) {
        results.push({
          offlineClientId: item.offlineClientId,
          serverScanId: '',
          syncStatus: 'FAILED',
          serverOverallStatus: 'NEEDS_REVIEW',
          message: `Sync failed: ${err.message}`,
        });
      }
    }

    return {
      success: results.every((r) => r.syncStatus !== 'FAILED'),
      processedCount: results.length,
      results,
    };
  }
}
