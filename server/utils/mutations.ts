import type { Client, Deal, DealStage, DemoState, EmergencyJob, ProjectJob, ServicePlanTier } from './demo-types'

const DEAL_STAGES: DealStage[] = ['Lead', 'Proposal Sent', 'Won', 'Lost']
const SERVICE_TIERS: ServicePlanTier[] = ['None', 'Basic', 'Gold', 'Platinum']
const EMERGENCY_STATUSES = ['Awaiting crew', 'En route', 'On site', 'Completed'] as const

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown'
}

function nextDealId(state: DemoState): string {
  const nums = state.deals
    .map((d) => d.id.match(/^OPP-(\d+)$/i)?.[1])
    .filter(Boolean)
    .map(Number)
  const max = nums.length ? Math.max(...nums) : 5000
  return `OPP-${max + 1}`
}

function nextEmergencyTicket(state: DemoState): string {
  const nums = state.jobs.emergency
    .map((j) => j.ticket.match(/^EM-(\d+)$/i)?.[1])
    .filter(Boolean)
    .map(Number)
  const max = nums.length ? Math.max(...nums) : 2040
  return `EM-${max + 1}`
}

export function createEmergencyJob(
  state: DemoState,
  args: { issue: string; city: string; priority?: string }
): { state: DemoState; systemMessages: string[] } {
  const issue = args.issue?.trim() || 'Emergency call'
  const city = args.city?.trim() || 'TBD'
  const priority = args.priority === 'Med' ? 'Med' : 'High'
  const ticket = nextEmergencyTicket(state)
  const newJob: EmergencyJob = {
    ticket,
    issue,
    city,
    eta: 'TBD',
    priority,
    status: 'Awaiting crew'
  }
  const emergency = [...state.jobs.emergency, newJob]
  const next: DemoState = { ...state, jobs: { ...state.jobs, emergency } }
  return {
    state: next,
    systemMessages: [`Created emergency ${ticket}: ${issue} in ${city} (${priority}). Awaiting crew.`]
  }
}

const PROJECT_STAGES = [
  'Planned',
  'Scheduled',
  'In Progress',
  'Awaiting Permit',
  'Permit Follow-up Sent',
  'On Hold',
  'Complete',
  'Cancelled'
] as const

function projectStageClass(stage: string): string {
  if (/progress/i.test(stage)) return 'bg-blue-100 text-blue-700'
  if (/permit|await/i.test(stage)) return 'bg-amber-100 text-amber-700'
  if (/scheduled|complete/i.test(stage)) return 'bg-emerald-100 text-emerald-700'
  if (/hold|cancelled/i.test(stage)) return 'bg-slate-100 text-slate-700'
  return 'bg-purple-100 text-purple-700'
}

function nextProjectId(state: DemoState): string {
  const nums = state.jobs.install
    .map((j) => j.id.match(/^PRJ-(\d+)$/i)?.[1])
    .filter(Boolean)
    .map(Number)
  const max = nums.length ? Math.max(...nums) : 4100
  return `PRJ-${max + 1}`
}

export function createProjectJob(
  state: DemoState,
  args: { client: string; scope: string; location: string; stage?: string }
): { state: DemoState; systemMessages: string[] } {
  const client = args.client?.trim() || 'Unknown client'
  const scope = args.scope?.trim() || 'Install / service'
  const location = args.location?.trim() || 'TBD'
  const stageVal = args.stage?.trim()
  const stage = stageVal && (PROJECT_STAGES as readonly string[]).includes(stageVal) ? stageVal : 'Planned'
  const id = nextProjectId(state)
  const newJob: ProjectJob = {
    id,
    client,
    scope,
    location,
    stage,
    stageClass: projectStageClass(stage),
    notes: []
  }
  const install = [...state.jobs.install, newJob]
  const next: DemoState = { ...state, jobs: { ...state.jobs, install } }
  return {
    state: next,
    systemMessages: [`Created project ${id}: ${client} — ${scope} (${location}). Stage: ${stage}.`]
  }
}

export function updateDealStage(
  state: DemoState,
  args: { dealId: string; dealStage: DealStage }
): { state: DemoState; systemMessages: string[] } {
  const idx = state.deals.findIndex((d) => d.id === args.dealId)
  if (idx < 0) return { state, systemMessages: [`Deal ${args.dealId} not found.`] }
  const dateStr = new Date().toISOString().slice(0, 10)
  const deals = state.deals.map((d, i) =>
    i === idx ? { ...d, dealStage: args.dealStage, updatedDate: dateStr } : d
  )
  const next = recomputeQuoteConversion({ ...state, deals })
  return { state: next, systemMessages: [`Updated ${args.dealId} to ${args.dealStage}.`] }
}

export type UpdateDealArgs = {
  dealId: string
  dealTitle?: string
  dealAmount?: number
  dealStage?: DealStage
  servicePlanTier?: ServicePlanTier
  renewalDueInDays?: number
  source?: string
}

export function updateDeal(
  state: DemoState,
  args: UpdateDealArgs
): { state: DemoState; systemMessages: string[] } {
  const idx = state.deals.findIndex((d) => d.id === args.dealId)
  if (idx < 0) return { state, systemMessages: [`Deal ${args.dealId} not found.`] }
  const dateStr = new Date().toISOString().slice(0, 10)
  const existing = state.deals[idx]
  const dealStage = args.dealStage ?? existing.dealStage
  const servicePlanTier = args.servicePlanTier ?? existing.servicePlanTier
  const updated: Deal = {
    ...existing,
    dealTitle: args.dealTitle !== undefined ? args.dealTitle : existing.dealTitle,
    dealAmount: args.dealAmount !== undefined ? args.dealAmount : existing.dealAmount,
    dealStage: DEAL_STAGES.includes(dealStage) ? dealStage : existing.dealStage,
    servicePlanTier: SERVICE_TIERS.includes(servicePlanTier) ? servicePlanTier : existing.servicePlanTier,
    renewalDueInDays: args.renewalDueInDays !== undefined ? args.renewalDueInDays : existing.renewalDueInDays,
    source: args.source !== undefined ? args.source : existing.source,
    updatedDate: dateStr
  }
  const deals = state.deals.map((d, i) => (i === idx ? updated : d))
  const next = recomputeQuoteConversion({ ...state, deals })
  return { state: next, systemMessages: [`Updated deal ${args.dealId}.`] }
}

export function updateEmergencyJob(
  state: DemoState,
  args: {
    jobId: string
    issue?: string
    city?: string
    priority?: string
    status?: string
    crewId?: string
    eta?: string
  }
): { state: DemoState; systemMessages: string[] } {
  const list = state.jobs.emergency
  const idx = list.findIndex((j) => j.ticket === args.jobId)
  if (idx < 0) return { state, systemMessages: [`Emergency job ${args.jobId} not found.`] }
  const job = list[idx]
  const status =
    args.status != null && args.status.trim()
      ? (EMERGENCY_STATUSES.find((s) => s.toLowerCase() === args.status!.trim().toLowerCase()) ?? args.status.trim())
      : job.status
  const updated: EmergencyJob = {
    ...job,
    issue: args.issue !== undefined ? args.issue.trim() : job.issue,
    city: args.city !== undefined ? args.city.trim() : job.city,
    priority: args.priority !== undefined ? (args.priority === 'Med' ? 'Med' : 'High') : job.priority,
    status,
    crewId: args.crewId !== undefined ? args.crewId : job.crewId,
    eta: args.eta !== undefined ? args.eta : job.eta
  }
  const emergency = list.map((j, i) => (i === idx ? updated : j))
  const next: DemoState = { ...state, jobs: { ...state.jobs, emergency } }
  return { state: next, systemMessages: [`Updated emergency ${args.jobId}.`] }
}

export function updateProjectJob(
  state: DemoState,
  args: {
    jobId: string
    client?: string
    scope?: string
    location?: string
    stage?: string
    currentWork?: string
    nextStep?: string
  }
): { state: DemoState; systemMessages: string[] } {
  const list = state.jobs.install
  const idx = list.findIndex((j) => j.id === args.jobId)
  if (idx < 0) return { state, systemMessages: [`Project job ${args.jobId} not found.`] }
  const job = list[idx]
  const stageVal = args.stage?.trim()
  const stage =
    stageVal && (PROJECT_STAGES as readonly string[]).includes(stageVal) ? stageVal : job.stage
  const updated: ProjectJob = {
    ...job,
    client: args.client !== undefined ? args.client.trim() : job.client,
    scope: args.scope !== undefined ? args.scope.trim() : job.scope,
    location: args.location !== undefined ? args.location.trim() : job.location,
    stage: args.stage !== undefined ? stage : job.stage,
    stageClass: args.stage !== undefined ? projectStageClass(stage) : job.stageClass,
    currentWork: args.currentWork !== undefined ? args.currentWork : job.currentWork,
    nextStep: args.nextStep !== undefined ? args.nextStep : job.nextStep
  }
  const install = list.map((j, i) => (i === idx ? updated : j))
  const next: DemoState = { ...state, jobs: { ...state.jobs, install } }
  return { state: next, systemMessages: [`Updated project ${args.jobId}.`] }
}

export function convertDealToJob(
  state: DemoState,
  args: { dealId: string }
): { state: DemoState; systemMessages: string[] } {
  const deal = state.deals.find((d) => d.id === args.dealId)
  if (!deal) return { state, systemMessages: [`Deal ${args.dealId} not found.`] }
  if (deal.projectJobId) {
    return { state, systemMessages: [`Deal ${args.dealId} already converted to job ${deal.projectJobId}.`] }
  }
  const client = state.clients.find((c) => c.id === deal.clientId)
  const clientName = client?.name ?? deal.clientId
  const location = (client?.address ?? '').trim() || 'TBD'
  const { state: next, systemMessages: createMsgs } = createProjectJob(state, {
    client: clientName,
    scope: deal.dealTitle,
    location,
    stage: 'Planned'
  })
  const newJob = next.jobs.install[next.jobs.install.length - 1]
  if (!newJob) return { state, systemMessages: createMsgs }
  const deals = next.deals.map((d) => (d.id === args.dealId ? { ...d, projectJobId: newJob.id } : d))
  return {
    state: { ...next, deals },
    systemMessages: [...createMsgs, `Linked deal ${args.dealId} to job ${newJob.id}.`]
  }
}

export function upsertClient(
  state: DemoState,
  args: { clientName: string; phone?: string; email?: string; address?: string }
): { state: DemoState; systemMessages: string[] } {
  const name = args.clientName.trim()
  if (!name) return { state, systemMessages: [] }
  const id = normalizeName(name)
  const now = new Date().toISOString()
  const existing = state.clients.find((c) => c.id === id)
  const clients =
    existing != null
      ? state.clients.map((c) =>
          c.id === id
            ? { ...c, name, phone: args.phone ?? c.phone, email: args.email ?? c.email, address: args.address ?? c.address, updatedAt: now }
            : c
        )
      : [...state.clients, { id, name, phone: args.phone, email: args.email, address: args.address, updatedAt: now } as Client]
  const msg = existing ? `Updated client: ${name} (${id}).` : `Created client: ${name} (${id}).`
  return { state: { ...state, clients }, systemMessages: [msg] }
}

export function createDeal(
  state: DemoState,
  args: {
    clientName: string
    phone?: string
    email?: string
    address?: string
    dealTitle: string
    dealAmount?: number
    dealStage: DealStage
    servicePlanTier: ServicePlanTier
    renewalDueInDays?: number
  }
): { state: DemoState; systemMessages: string[] } {
  const allMessages: string[] = []
  let next = state
  const { state: afterClient, systemMessages: clientMsgs } = upsertClient(next, {
    clientName: args.clientName,
    phone: args.phone,
    email: args.email,
    address: args.address
  })
  next = afterClient
  allMessages.push(...clientMsgs)
  const clientId = normalizeName(args.clientName.trim())
  const now = new Date().toISOString()
  const dateStr = now.slice(0, 10)
  const dealId = nextDealId(next)
  const deal: Deal = {
    id: dealId,
    clientId,
    dealTitle: args.dealTitle.trim(),
    dealAmount: args.dealAmount,
    dealStage: args.dealStage,
    servicePlanTier: args.servicePlanTier,
    renewalDueInDays: args.renewalDueInDays,
    createdDate: dateStr,
    updatedDate: dateStr,
    notes: []
  }
  const deals = [...next.deals, deal]
  next = { ...next, deals }
  allMessages.push(
    `Created deal ${dealId}: ${deal.dealTitle}, stage ${deal.dealStage}${deal.dealAmount != null ? `, $${deal.dealAmount.toLocaleString()}` : ''}.`
  )
  if (deal.servicePlanTier !== 'None' || deal.renewalDueInDays != null) {
    allMessages.push(
      `Service plan: ${deal.servicePlanTier}.${deal.renewalDueInDays != null ? ` Renewal due in ${deal.renewalDueInDays} days.` : ''}`
    )
  }
  return { state: next, systemMessages: allMessages }
}

export function dispatchEmergencyJob(
  state: DemoState,
  args: {
    jobId: string
    assignCrew?: string
    status?: string
    etaTargetMinutes?: number
    notifyCustomer?: boolean
    note?: string
  }
): { state: DemoState; systemMessages: string[] } {
  const list = state.jobs.emergency
  const idx = list.findIndex((j) => j.ticket === args.jobId)
  if (idx < 0) return { state, systemMessages: [`Job ${args.jobId} not found.`] }
  const job = list[idx]
  const messages: string[] = []
  const updated: EmergencyJob = { ...job }
  if (args.assignCrew != null && args.assignCrew.trim()) {
    const crewId =
      state.crews.find(
        (c) => c.id === args.assignCrew!.trim() || c.name.toLowerCase() === args.assignCrew!.trim().toLowerCase()
      )?.id ?? args.assignCrew.trim().toLowerCase().replace(/\s+/g, '-')
    updated.crewId = crewId
    const crewName = state.crews.find((c) => c.id === crewId)?.name ?? crewId
    messages.push(`Assigned crew: ${crewName} (${crewId}).`)
  }
  if (args.status != null && args.status.trim()) {
    const status = EMERGENCY_STATUSES.find((s) => s.toLowerCase() === args.status!.trim().toLowerCase()) ?? args.status.trim()
    updated.status = status
    if (args.etaTargetMinutes != null) {
      updated.etaTargetMinutes = args.etaTargetMinutes
      updated.eta = `${args.etaTargetMinutes} min`
    }
    messages.push(`Updated status: ${status}${updated.eta ? `, ETA ${updated.eta}` : ''}.`)
  } else if (args.etaTargetMinutes != null) {
    updated.etaTargetMinutes = args.etaTargetMinutes
    updated.eta = `${args.etaTargetMinutes} min`
    messages.push(`Updated ETA: ${args.etaTargetMinutes} min.`)
  }
  const emergency = list.map((j, i) => (i === idx ? updated : j))
  let next: DemoState = { ...state, jobs: { ...state.jobs, emergency } }
  if (args.notifyCustomer) {
    const { state: afterNotif, systemMessages: notifMsgs } = queueNotification(next, {
      jobId: args.jobId,
      type: 'customer_eta',
      payload: { note: args.note }
    })
    next = afterNotif
    messages.push(...notifMsgs)
  }
  return { state: next, systemMessages: messages }
}

export function queueNotification(
  state: DemoState,
  args: { jobId: string; type: string; payload?: Record<string, unknown> }
): { state: DemoState; systemMessages: string[] } {
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const notifications = [
    ...state.notifications,
    { id, jobId: args.jobId, type: args.type, createdAt: new Date().toISOString(), payload: args.payload }
  ]
  return { state: { ...state, notifications }, systemMessages: ['Notifications queued.'] }
}

export function appendSystemMessages(state: DemoState, systemMessages: string[]): DemoState {
  if (!systemMessages.length) return state
  const newMsgs = systemMessages.map((text) => ({ role: 'system' as const, text }))
  return { ...state, chatMessages: [...state.chatMessages, ...newMsgs] }
}

export function recomputeQuoteConversion(state: DemoState): DemoState {
  const quotesSent = state.deals.length
  const won = state.deals.filter((d) => d.dealStage === 'Won').length
  const conversion = quotesSent ? Math.round((won / quotesSent) * 100) : 0
  return {
    ...state,
    dashboardStats: {
      ...state.dashboardStats,
      quoteConversion: { quotesSent, won, conversion }
    }
  }
}
