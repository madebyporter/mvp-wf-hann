export type DealStage = 'Lead' | 'Proposal Sent' | 'Won' | 'Lost'
export type ServicePlanTier = 'None' | 'Basic' | 'Gold' | 'Platinum'

export type Client = {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  updatedAt: string
}

export type Deal = {
  id: string
  clientId: string
  dealTitle: string
  dealAmount?: number
  dealStage: DealStage
  servicePlanTier: ServicePlanTier
  renewalDueInDays?: number
  createdDate: string
  updatedDate: string
  source?: string
  notes?: string[]
}

export type EmergencyJob = {
  ticket: string
  issue: string
  city: string
  eta: string
  etaTargetMinutes?: number
  priority: string
  status: string
  crewId?: string
}

export type ProjectJob = {
  id: string
  client: string
  scope: string
  location: string
  stage: string
  stageClass: string
  currentWork?: string
  nextStep?: string
  notes?: string[]
}

export type Crew = { id: string; name: string }
export type Notification = {
  id: string
  jobId: string
  type: string
  createdAt: string
  payload?: Record<string, unknown>
}
export type ChatMessage = { role: 'human' | 'ai' | 'system'; text: string }
export type DashboardStats = {
  quoteConversion: { quotesSent: number; won: number; conversion: number }
  homeServicePlans: { renewalsDue7d: number; scheduledVisits: number; atRiskAccounts: number }
  installCapacity: { largeInstallsActive: number; crewsAssigned: number; pendingPermits: number }
}

export type DemoState = {
  clients: Client[]
  deals: Deal[]
  jobs: { emergency: EmergencyJob[]; install: ProjectJob[] }
  crews: Crew[]
  notifications: Notification[]
  chatMessages: ChatMessage[]
  dashboardStats: DashboardStats
}
