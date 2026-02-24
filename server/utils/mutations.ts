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
