import "dotenv/config";
import connectDatabase from "../config/database.js";
import Preference from "../models/Preference.js";
import User from "../models/User.js";
import { createPasswordHash } from "../services/passwordService.js";

const FIXED_PASSWORD = "Test@123";
const TEST_EMAILS = Array.from(
  { length: 15 },
  (_, index) => `user${index + 1}@test.com`,
);

const testProfiles = [
  {
    username: "user1",
    name: "Aarav Sharma",
    location: "Remote",
    experienceLevel: "beginner" as const,
    target: "student" as const,
    reward: ["certificate", "internship_offer"],
    workMode: ["Remote"],
    timeCommitment: ["1_week", "2_weeks"],
    opportunityType: ["hackathon", "internship"],
    skills: ["react", "node", "dsa"],
  },
  {
    username: "user2",
    name: "Ishita Patel",
    location: "Mumbai",
    experienceLevel: "intermediate" as const,
    target: "job seeker" as const,
    reward: ["job_offer", "cash_prize"],
    workMode: ["Hybrid", "Onsite"],
    timeCommitment: ["1_month", "long_term"],
    opportunityType: ["job"],
    skills: ["java", "dsa", "node"],
  },
  {
    username: "user3",
    name: "Rohan Nair",
    location: "Bangalore",
    experienceLevel: "beginner" as const,
    target: "student" as const,
    reward: ["certificate", "swags"],
    workMode: ["Remote", "Hybrid"],
    timeCommitment: ["1_day", "1_week"],
    opportunityType: ["hackathon"],
    skills: ["python", "ml", "react"],
  },
  {
    username: "user4",
    name: "Sneha Reddy",
    location: "Chennai",
    experienceLevel: "intermediate" as const,
    target: "job seeker" as const,
    reward: ["job_offer"],
    workMode: ["Onsite"],
    timeCommitment: ["long_term"],
    opportunityType: ["job", "internship"],
    skills: ["java", "node", "dsa"],
  },
  {
    username: "user5",
    name: "Karthik Iyer",
    location: "Remote",
    experienceLevel: "advanced" as const,
    target: "student" as const,
    reward: ["cash_prize", "certificate"],
    workMode: ["Remote"],
    timeCommitment: ["1_day", "1_week"],
    opportunityType: ["hackathon", "job"],
    skills: ["python", "ml", "node"],
  },
  {
    username: "user6",
    name: "Meera Joshi",
    location: "Mumbai",
    experienceLevel: "beginner" as const,
    target: "student" as const,
    reward: ["internship_offer"],
    workMode: ["Hybrid"],
    timeCommitment: ["2_weeks", "1_month"],
    opportunityType: ["internship"],
    skills: ["react", "dsa", "java"],
  },
  {
    username: "user7",
    name: "Aditya Verma",
    location: "Bangalore",
    experienceLevel: "intermediate" as const,
    target: "job seeker" as const,
    reward: ["job_offer", "experience"],
    workMode: ["Remote", "Hybrid"],
    timeCommitment: ["1_month", "long_term"],
    opportunityType: ["job"],
    skills: ["node", "react", "java"],
  },
  {
    username: "user8",
    name: "Priya Kulkarni",
    location: "Chennai",
    experienceLevel: "beginner" as const,
    target: "student" as const,
    reward: ["certificate", "swags"],
    workMode: ["Onsite", "Hybrid"],
    timeCommitment: ["1_week"],
    opportunityType: ["hackathon", "internship"],
    skills: ["ml", "python", "dsa"],
  },
  {
    username: "user9",
    name: "Nikhil Gupta",
    location: "Remote",
    experienceLevel: "advanced" as const,
    target: "job seeker" as const,
    reward: ["job_offer"],
    workMode: ["Remote"],
    timeCommitment: ["long_term"],
    opportunityType: ["job", "internship"],
    skills: ["node", "react", "ml"],
  },
  {
    username: "user10",
    name: "Ananya Singh",
    location: "Mumbai",
    experienceLevel: "intermediate" as const,
    target: "student" as const,
    reward: ["cash_prize", "internship_offer"],
    workMode: ["Hybrid", "Remote"],
    timeCommitment: ["2_weeks"],
    opportunityType: ["hackathon", "internship"],
    skills: ["react", "python", "ml"],
  },
  {
    username: "user11",
    name: "Rahul Deshmukh",
    location: "Bangalore",
    experienceLevel: "advanced" as const,
    target: "job seeker" as const,
    reward: ["job_offer", "experience"],
    workMode: ["Onsite", "Hybrid"],
    timeCommitment: ["1_month", "long_term"],
    opportunityType: ["job"],
    skills: ["java", "dsa", "node"],
  },
  {
    username: "user12",
    name: "Kavya Menon",
    location: "Chennai",
    experienceLevel: "beginner" as const,
    target: "student" as const,
    reward: ["certificate", "experience"],
    workMode: ["Remote"],
    timeCommitment: ["1_week", "2_weeks"],
    opportunityType: ["internship"],
    skills: ["react", "node", "python"],
  },
  {
    username: "user13",
    name: "Vikram Malhotra",
    location: "Remote",
    experienceLevel: "intermediate" as const,
    target: "job seeker" as const,
    reward: ["cash_prize", "job_offer"],
    workMode: ["Remote", "Onsite"],
    timeCommitment: ["1_day", "1_week"],
    opportunityType: ["hackathon", "job"],
    skills: ["java", "python", "ml"],
  },
  {
    username: "user14",
    name: "Pooja Chawla",
    location: "Mumbai",
    experienceLevel: "beginner" as const,
    target: "student" as const,
    reward: ["internship_offer", "certificate"],
    workMode: ["Hybrid"],
    timeCommitment: ["1_month"],
    opportunityType: ["internship", "job"],
    skills: ["react", "dsa", "node"],
  },
  {
    username: "user15",
    name: "Arjun Bhattacharya",
    location: "Bangalore",
    experienceLevel: "advanced" as const,
    target: "job seeker" as const,
    reward: ["job_offer", "experience"],
    workMode: ["Remote", "Hybrid"],
    timeCommitment: ["long_term"],
    opportunityType: ["job", "hackathon"],
    skills: ["node", "java", "ml"],
  },
];

const seedUsers = async (): Promise<void> => {
  await connectDatabase();

  try {
    const existingUsers = await User.find({
      email: { $in: TEST_EMAILS },
    }).select("_id email");
    const existingUserIds = existingUsers.map((user) => user._id);

    if (existingUserIds.length > 0) {
      await Preference.deleteMany({ userId: { $in: existingUserIds } });
      await User.deleteMany({ _id: { $in: existingUserIds } });
    }

    const createdUsers = [] as Array<{
      userId: string;
      email: string;
      password: string;
      skills: string[];
      opportunityType: string[];
    }>;

    for (const [index, profile] of testProfiles.entries()) {
      const passwordHash = await createPasswordHash(FIXED_PASSWORD);
      const email = TEST_EMAILS[index];

      const user = await User.create({
        username: profile.username,
        name: profile.name,
        email,
        passwordHash,
        skills: profile.skills,
        preferredTypes: profile.opportunityType,
        location: profile.location,
        experienceLevel: profile.experienceLevel,
      });

      await Preference.create({
        userId: user._id,
        target: profile.target,
        reward: profile.reward,
        location: profile.location,
        workMode: profile.workMode,
        timeCommitment: profile.timeCommitment,
        opportunityType: profile.opportunityType,
        skills: profile.skills,
        college:
          profile.target === "student" ? "Test Engineering College" : undefined,
        year: profile.target === "student" ? "3rd Year" : undefined,
      });

      createdUsers.push({
        userId: user._id.toString(),
        email,
        password: FIXED_PASSWORD,
        skills: profile.skills,
        opportunityType: profile.opportunityType,
      });
    }

    console.log("Seeding completed successfully");
    console.table(
      createdUsers.map(({ email, password }) => ({ email, password })),
    );
    console.log(`Total users created: ${createdUsers.length}`);
    console.table(
      createdUsers.map(({ userId, email, skills, opportunityType }) => ({
        userId,
        email,
        skills: skills.join(", "),
        opportunityType: opportunityType.join(", "),
      })),
    );
  } finally {
    await User.db.close();
  }
};

seedUsers().catch((error) => {
  console.error("Failed to seed test users:", error);
  process.exitCode = 1;
});
