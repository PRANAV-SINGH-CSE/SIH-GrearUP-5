import { IComplianceRule } from './rule.interface';
import {
  Rule06ManufacturerPacker,
  Rule06GenericName,
  Rule06NetQuantityPresence,
  Rule07StandardMetricUnit,
  Rule06MRP,
  Rule06MfgPackingDate,
  Rule06CountryOfOrigin,
  Rule06ConsumerCare,
  Rule06UnitSalePrice,
  Rule09PDPProminence,
  Rule06FoodExpiry,
} from './lmpc-2011-rules';

export class RuleRegistry {
  private static rules: Map<string, IComplianceRule> = new Map();

  static {
    // Register all authoritative LMPC 2011 rules
    this.registerRule(new Rule06ManufacturerPacker());
    this.registerRule(new Rule06GenericName());
    this.registerRule(new Rule06NetQuantityPresence());
    this.registerRule(new Rule07StandardMetricUnit());
    this.registerRule(new Rule06MRP());
    this.registerRule(new Rule06MfgPackingDate());
    this.registerRule(new Rule06CountryOfOrigin());
    this.registerRule(new Rule06ConsumerCare());
    this.registerRule(new Rule06UnitSalePrice());
    this.registerRule(new Rule09PDPProminence());
    this.registerRule(new Rule06FoodExpiry());
  }

  static registerRule(rule: IComplianceRule): void {
    this.rules.set(rule.id, rule);
  }

  static getRule(id: string): IComplianceRule | undefined {
    return this.rules.get(id);
  }

  static getAllRules(): IComplianceRule[] {
    return Array.from(this.rules.values());
  }

  static getRulesForCategory(category: string): IComplianceRule[] {
    return Array.from(this.rules.values()).filter((rule) => {
      if (rule.applicability === 'ALL_PACKAGED_COMMODITIES') return true;
      if (rule.applicability === category) return true;
      return false;
    });
  }
}
