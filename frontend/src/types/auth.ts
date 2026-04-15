export type WorkMode = 'Remote' | 'Onsite' | 'Hybrid'

export type OpportunityType = 'hackathon' | 'internship' | 'job' | 'both'

export type Target = 'student' | 'job seeker'

export type User = {
  id: string
  username: string
  email?: string
}

export type Preferences = {
  timeCommitment: string
  location: string
  workMode: WorkMode
  skills: string[]
  college?: string
  year?: string
  reward: string
  opportunityType: OpportunityType
  target: Target
}

export type LoginInput = {
  username: string
  password: string
}

export type SignupInput = {
  username: string
  email: string
  password: string
}

export type AuthResponse = {
  token: string
  user: User
}
