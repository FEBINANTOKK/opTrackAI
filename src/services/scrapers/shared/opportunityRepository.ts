import OpportunityModel from "../../../models/Opportunity.js";
import type { Opportunity } from "./types.js";

export interface UpsertResultSummary {
  upsertedCount: number;
  modifiedCount: number;
}

export const upsertOpportunities = async (
  opportunities: Opportunity[],
): Promise<UpsertResultSummary> => {
  if (!opportunities.length) {
    return {
      upsertedCount: 0,
      modifiedCount: 0,
    };
  }

  try {
    const operations = opportunities
      .filter((item) => Boolean(item.link))
      .map((item) => {
        const normalizedType = item.type.toLowerCase();

        return {
          updateOne: {
            filter: { link: item.link },
            update: {
              $set: {
                ...item,
                type: normalizedType,
              },
            },
            upsert: true,
          },
        };
      });

    if (!operations.length) {
      return {
        upsertedCount: 0,
        modifiedCount: 0,
      };
    }

    const result = await OpportunityModel.bulkWrite(operations);

    return {
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    console.error("Failed to upsert opportunities with bulkWrite:", error);
    throw error;
  }
};
