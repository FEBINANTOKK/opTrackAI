import OpportunityModel from "../../../models/Opportunity.js";
import type { Opportunity } from "./types.js";

export interface UpsertResultSummary {
  upsertedCount: number;
  modifiedCount: number;
}

export const upsertOpportunities = async (
  opportunities: Opportunity[],
): Promise<UpsertResultSummary> => {
  let upsertedCount = 0;
  let modifiedCount = 0;

  for (const item of opportunities) {
    const normalizedType = item.type.toLowerCase();

    const result = await OpportunityModel.updateOne(
      {
        title: item.title,
        company: item.company,
      },
      {
        $set: {
          skills: item.skills,
          location: item.location,
          type: normalizedType,
          deadline: item.deadline,
          reward: item.reward,
          source: item.source,
          link: item.link,
          createdAt: item.createdAt,
        },
      },
      {
        upsert: true,
      },
    );

    if (result.upsertedCount > 0) {
      upsertedCount += result.upsertedCount;
    }

    if (result.modifiedCount > 0) {
      modifiedCount += result.modifiedCount;
    }
  }

  return {
    upsertedCount,
    modifiedCount,
  };
};
