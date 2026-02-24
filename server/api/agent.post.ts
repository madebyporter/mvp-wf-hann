import type { DemoState } from '../utils/demo-types'
import {
  appendSystemMessages,
  convertDealToJob,
  createDeal,
  createEmergencyJob,
  createProjectJob,
  deleteProjectJob,
  dispatchEmergencyJob,
  recomputeQuoteConversion,
  updateDealStage,
  updateProjectJob
} from '../utils/mutations'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'create_deal',
      description: 'Create a new CRM deal: upsert client by name and create a deal with stage, amount, service plan, renewal.',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string', description: 'Client or company name' },
          dealTitle: { type: 'string', description: 'Deal title' },
          dealStage: { type: 'string', enum: ['Lead', 'Proposal Sent', 'Won', 'Lost'] },
          dealAmount: { type: 'number', description: 'Deal value in USD' },
          servicePlanTier: { type: 'string', enum: ['None', 'Basic', 'Gold', 'Platinum'] },
          renewalDueInDays: { type: 'number', description: 'Days until renewal' },
          phone: { type: 'string' },
          email: { type: 'string' },
          address: { type: 'string' }
        },
        required: ['clientName', 'dealTitle', 'dealStage']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_emergency',
      description: 'Create a new emergency job in the queue. Use when the user asks to create, log, or add an emergency (e.g. "no heat in Lakewood", "burst pipe Cleveland high priority").',
      parameters: {
        type: 'object',
        properties: {
          issue: { type: 'string', description: 'Brief description of the emergency e.g. No heat, Burst pipe, Boiler reset' },
          city: { type: 'string', description: 'City or location e.g. Lakewood, Parma, Cleveland' },
          priority: { type: 'string', enum: ['High', 'Med'], description: 'Priority level' }
        },
        required: ['issue', 'city']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_job',
      description: 'Create a NEW commercial/install (project) job. Use ONLY when the user explicitly wants to create a new project (e.g. "create a new project for X", "add a new job"). Do NOT use for editing an existing project—use update_project_job instead when the user gives an existing project id (e.g. PRJ-4104).',
      parameters: {
        type: 'object',
        properties: {
          client: { type: 'string', description: 'Client or company name e.g. Westlake Medical Campus' },
          scope: { type: 'string', description: 'Scope of work e.g. Rooftop unit replacement + controls retrofit' },
          location: { type: 'string', description: 'City or location e.g. Westlake, Parma' },
          stage: { type: 'string', enum: ['Planned', 'Scheduled', 'In Progress', 'Awaiting Permit', 'On Hold', 'Complete'], description: 'Project stage' }
        },
        required: ['client', 'scope', 'location']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_project_job',
      description: 'Edit an EXISTING project job by id. Use when the user asks to edit, update, or change an existing project and provides a project id (e.g. PRJ-4104, PRJ-4105). Examples: "edit PRJ-4104", "set location for PRJ-4104 to Shaw High School", "update project PRJ-4104 scope to Chiller upgrade". Do NOT use create_job for these—use this tool.',
      parameters: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'Project id e.g. PRJ-4104' },
          client: { type: 'string', description: 'Client name' },
          scope: { type: 'string', description: 'Scope of work' },
          location: { type: 'string', description: 'Location e.g. Shaw High School, TBD' },
          stage: { type: 'string', enum: ['Planned', 'Scheduled', 'In Progress', 'Awaiting Permit', 'Permit Follow-up Sent', 'On Hold', 'Complete', 'Cancelled'] },
          currentWork: { type: 'string' },
          nextStep: { type: 'string' }
        },
        required: ['jobId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_project_job',
      description: 'Delete/remove an existing project job by id. Use when the user asks to delete, remove, or get rid of a project (e.g. "delete PRJ-4105", "remove the duplicate project PRJ-4105").',
      parameters: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'Project id e.g. PRJ-4105' }
        },
        required: ['jobId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'dispatch_emergency',
      description: 'Dispatch an existing emergency job: assign crew, set status (Awaiting crew, En route, On site, Completed), ETA in minutes, optionally notify customer.',
      parameters: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'Emergency ticket id e.g. EM-2042' },
          assignCrew: { type: 'string', description: 'Crew id or name e.g. crew-a2 or Crew A2' },
          status: { type: 'string', enum: ['Awaiting crew', 'En route', 'On site', 'Completed'] },
          etaTargetMinutes: { type: 'number' },
          notifyCustomer: { type: 'boolean' },
          note: { type: 'string' }
        },
        required: ['jobId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_deal',
      description: 'Update an existing deal, e.g. set its stage to Won, Lost, Proposal Sent, or Lead. Use when the user says to change a deal status (e.g. "change East Cleveland deal to won", "mark OPP-5030 as won"). Use find_entities with type "deals" to get deal id by client name.',
      parameters: {
        type: 'object',
        properties: {
          dealId: { type: 'string', description: 'Deal id e.g. OPP-5030' },
          dealStage: { type: 'string', enum: ['Lead', 'Proposal Sent', 'Won', 'Lost'] }
        },
        required: ['dealId', 'dealStage']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'convert_deal_to_job',
      description: 'Convert a won deal to a commercial/install job. Creates a new job from the deal (client, scope from deal title, location from client) and links the deal to that job. Call this when the user confirms they want to convert (e.g. after you set a deal to Won and asked "Do you want to convert this to a job?" and they said yes).',
      parameters: {
        type: 'object',
        properties: {
          dealId: { type: 'string', description: 'Deal id e.g. OPP-5030' }
        },
        required: ['dealId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'find_entities',
      description: 'Resolve crews, emergency jobs, project jobs, or CRM deals. Use type "deals" or "project_jobs" with a client/name query to get ids (e.g. for update_deal, update_project_job, or delete_project_job).',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['crews', 'emergency_jobs', 'deals', 'project_jobs'] },
          query: { type: 'string', description: 'Partial name or id to match' }
        },
        required: ['type', 'query']
      }
    }
  }
]

const MAX_CHAT_MESSAGES_FOR_CONTEXT = 50

function buildOpenAIMessages(chatMessages: { role: string; text: string }[]) {
  const recent =
    chatMessages.length <= MAX_CHAT_MESSAGES_FOR_CONTEXT
      ? chatMessages
      : chatMessages.slice(-MAX_CHAT_MESSAGES_FOR_CONTEXT)
  const out: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    {
      role: 'system',
      content:
        'You are an HVAC Ops Dispatch assistant. Use the full conversation history: the user\'s latest message often refers to the previous message (e.g. "yes", "do that", "edit that project", "delete the duplicate")—always interpret it in that context. You can: create CRM deals (create_deal), update a deal stage (update_deal), convert a won deal to a job (convert_deal_to_job), create new emergency jobs (create_emergency), create new commercial/install jobs (create_job), edit existing projects (update_project_job), delete projects (delete_project_job), and dispatch emergency jobs (dispatch_emergency). IMPORTANT: When the user asks to EDIT or UPDATE an existing project and gives a project id (e.g. PRJ-4104), use update_project_job with that jobId—do NOT use create_job. Use create_job only for creating a brand NEW project. When the user asks to delete or remove a project (e.g. "delete PRJ-4105"), use delete_project_job. Use find_entities with type "deals" or "project_jobs" to resolve ids by client name. When the user sets a deal to Won, call update_deal then ask if they want to convert to a job; if yes, call convert_deal_to_job. Be concise.'
    }
  ]
  for (const m of recent) {
    if (m.role === 'human') out.push({ role: 'user', content: m.text })
    else if (m.role === 'ai') out.push({ role: 'assistant', content: m.text })
    // skip system in API messages
  }
  return out
}

const OPENAI_FETCH_TIMEOUT_MS = 60_000

async function openAIChat(
  apiKey: string,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  tools?: typeof TOOLS
) {
  const body: Record<string, unknown> = {
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 1024
  }
  if (tools?.length) {
    body.tools = tools
    body.tool_choice = 'auto'
  }
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenAI API error: ${res.status} ${err}`)
    }
    return res.json()
  } finally {
    clearTimeout(timeoutId)
  }
}

const defaultDashboardStats = {
  quoteConversion: { quotesSent: 0, won: 0, conversion: 0 },
  homeServicePlans: { renewalsDue7d: 0, scheduledVisits: 0, atRiskAccounts: 0 },
  installCapacity: { largeInstallsActive: 0, crewsAssigned: 0, pendingPermits: 0 }
}

function normalizeState(raw: unknown): DemoState {
  const s = JSON.parse(JSON.stringify(raw || {})) as Record<string, unknown>
  if (!s.clients || !Array.isArray(s.clients)) s.clients = []
  if (!s.deals || !Array.isArray(s.deals)) s.deals = []
  if (!s.jobs || typeof s.jobs !== 'object') s.jobs = { emergency: [], install: [] }
  if (!Array.isArray((s.jobs as any).emergency)) (s.jobs as any).emergency = []
  if (!Array.isArray((s.jobs as any).install)) (s.jobs as any).install = []
  if (!s.crews || !Array.isArray(s.crews)) s.crews = []
  if (!s.notifications || !Array.isArray(s.notifications)) s.notifications = []
  if (!s.chatMessages || !Array.isArray(s.chatMessages)) s.chatMessages = []
  s.dashboardStats = { ...defaultDashboardStats, ...(s.dashboardStats || {}) }
  return s as DemoState
}

export default defineEventHandler(async (event) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY || process.env.NUXT_OPENAI_API_KEY
    if (!apiKey) {
      throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY not configured' })
    }

    const body = await readBody<{ messages: { role: string; text: string }[]; state: unknown }>(event)
    const { messages: chatMessages, state: rawState } = body || {}
    if (!rawState || !Array.isArray(chatMessages)) {
      throw createError({ statusCode: 400, statusMessage: 'Body must include messages and state' })
    }

    let state: DemoState = normalizeState(rawState)
    const systemMessages: string[] = []
    let openAIMessages = buildOpenAIMessages(chatMessages)
    let assistantContent = ''
    let iterations = 0
    const maxIterations = 5

    while (iterations < maxIterations) {
    iterations++
    const response = await openAIChat(apiKey, openAIMessages, TOOLS)
    const choice = response.choices?.[0]
    if (!choice) {
      assistantContent = 'No response from assistant.'
      break
    }

    const msg = choice.message || {}
    const toolCalls = msg.tool_calls

    if (msg.content) assistantContent = (assistantContent + (msg.content || '')).trim()

    if (!toolCalls?.length) break

    openAIMessages.push({
      role: 'assistant',
      content: msg.content || null,
      tool_calls: toolCalls
    })

    for (const tc of toolCalls) {
      const name = tc.function?.name
      const argsRaw = tc.function?.arguments
      let result: string
      try {
        const args = typeof argsRaw === 'string' ? JSON.parse(argsRaw) : argsRaw || {}

        if (name === 'find_entities') {
          const { type, query } = args
          const q = (query || '').toLowerCase()
          if (type === 'crews') {
            const crews = state.crews.filter(
              (c) => c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
            )
            result = JSON.stringify(crews)
          } else if (type === 'emergency_jobs') {
            const jobs = state.jobs.emergency.filter(
              (j) => j.ticket.toLowerCase().includes(q) || j.issue?.toLowerCase().includes(q)
            )
            result = JSON.stringify(jobs.map((j) => ({ ticket: j.ticket, issue: j.issue, status: j.status })))
          } else if (type === 'deals') {
            const deals = state.deals.filter((d) => {
              const clientName = state.clients.find((c) => c.id === d.clientId)?.name?.toLowerCase() ?? ''
              return (
                d.id.toLowerCase().includes(q) ||
                d.dealTitle?.toLowerCase().includes(q) ||
                clientName.includes(q)
              )
            })
            result = JSON.stringify(
              deals.map((d) => ({
                id: d.id,
                dealTitle: d.dealTitle,
                dealStage: d.dealStage,
                clientId: d.clientId
              }))
            )
          } else if (type === 'project_jobs') {
            const jobs = state.jobs.install.filter(
              (j) =>
                j.id.toLowerCase().includes(q) ||
                j.client?.toLowerCase().includes(q) ||
                j.scope?.toLowerCase().includes(q)
            )
            result = JSON.stringify(
              jobs.map((j) => ({ id: j.id, client: j.client, scope: j.scope, location: j.location, stage: j.stage }))
            )
          } else {
            result = JSON.stringify({ error: 'Unknown type' })
          }
        } else if (name === 'update_deal') {
          const { dealId, dealStage } = args
          if (!dealId || !dealStage) {
            result = JSON.stringify({ error: 'dealId and dealStage required' })
          } else {
            const validStage = ['Lead', 'Proposal Sent', 'Won', 'Lost'].includes(dealStage) ? dealStage : null
            if (!validStage) {
              result = JSON.stringify({ error: 'dealStage must be Lead, Proposal Sent, Won, or Lost' })
            } else {
              const { state: next, systemMessages: msgs } = updateDealStage(state, {
                dealId: String(dealId),
                dealStage: validStage
              })
              state = next
              systemMessages.push(...msgs)
              result = JSON.stringify({ ok: true, messages: msgs })
            }
          }
        } else if (name === 'convert_deal_to_job') {
          const { dealId } = args
          if (!dealId) {
            result = JSON.stringify({ error: 'dealId required' })
          } else {
            const { state: next, systemMessages: msgs } = convertDealToJob(state, { dealId: String(dealId) })
            state = next
            systemMessages.push(...msgs)
            result = JSON.stringify({ ok: true, messages: msgs })
          }
        } else if (name === 'create_deal') {
          const {
            clientName,
            dealTitle,
            dealStage,
            dealAmount,
            servicePlanTier,
            renewalDueInDays,
            phone,
            email,
            address
          } = args
          if (!clientName || !dealTitle || !dealStage) {
            result = JSON.stringify({ error: 'clientName, dealTitle, dealStage required' })
          } else {
            const { state: next, systemMessages: msgs } = createDeal(state, {
              clientName: String(clientName),
              dealTitle: String(dealTitle),
              dealStage: ['Lead', 'Proposal Sent', 'Won', 'Lost'].includes(dealStage) ? dealStage : 'Lead',
              servicePlanTier: ['None', 'Basic', 'Gold', 'Platinum'].includes(servicePlanTier) ? servicePlanTier : 'None',
              dealAmount: typeof dealAmount === 'number' ? dealAmount : undefined,
              renewalDueInDays: typeof renewalDueInDays === 'number' ? renewalDueInDays : undefined,
              phone: phone ? String(phone) : undefined,
              email: email ? String(email) : undefined,
              address: address ? String(address) : undefined
            })
            state = recomputeQuoteConversion(next)
            systemMessages.push(...msgs)
            result = JSON.stringify({ ok: true, messages: msgs })
          }
        } else if (name === 'create_emergency') {
          const { issue, city, priority } = args
          if (!issue || !city) {
            result = JSON.stringify({ error: 'issue and city required' })
          } else {
            const { state: next, systemMessages: msgs } = createEmergencyJob(state, {
              issue: String(issue),
              city: String(city),
              priority: priority === 'Med' ? 'Med' : 'High'
            })
            state = next
            systemMessages.push(...msgs)
            result = JSON.stringify({ ok: true, messages: msgs })
          }
        } else if (name === 'create_job') {
          const { client, scope, location, stage } = args
          if (!client || !scope || !location) {
            result = JSON.stringify({ error: 'client, scope, and location required' })
          } else {
            const { state: next, systemMessages: msgs } = createProjectJob(state, {
              client: String(client),
              scope: String(scope),
              location: String(location),
              stage: stage ? String(stage) : undefined
            })
            state = next
            systemMessages.push(...msgs)
            result = JSON.stringify({ ok: true, messages: msgs })
          }
        } else if (name === 'update_project_job') {
          const { jobId, client, scope, location, stage, currentWork, nextStep } = args
          if (!jobId) {
            result = JSON.stringify({ error: 'jobId required' })
          } else {
            const { state: next, systemMessages: msgs } = updateProjectJob(state, {
              jobId: String(jobId),
              client: client != null ? String(client) : undefined,
              scope: scope != null ? String(scope) : undefined,
              location: location != null ? String(location) : undefined,
              stage: stage != null ? String(stage) : undefined,
              currentWork: currentWork != null ? String(currentWork) : undefined,
              nextStep: nextStep != null ? String(nextStep) : undefined
            })
            state = next
            systemMessages.push(...msgs)
            result = JSON.stringify({ ok: true, messages: msgs })
          }
        } else if (name === 'delete_project_job') {
          const { jobId } = args
          if (!jobId) {
            result = JSON.stringify({ error: 'jobId required' })
          } else {
            const { state: next, systemMessages: msgs } = deleteProjectJob(state, { jobId: String(jobId) })
            state = next
            systemMessages.push(...msgs)
            result = JSON.stringify({ ok: true, messages: msgs })
          }
        } else if (name === 'dispatch_emergency') {
          const { jobId, assignCrew, status, etaTargetMinutes, notifyCustomer, note } = args
          if (!jobId) {
            result = JSON.stringify({ error: 'jobId required' })
          } else {
            const { state: next, systemMessages: msgs } = dispatchEmergencyJob(state, {
              jobId: String(jobId),
              assignCrew: assignCrew != null ? String(assignCrew) : undefined,
              status: status != null ? String(status) : undefined,
              etaTargetMinutes: typeof etaTargetMinutes === 'number' ? etaTargetMinutes : undefined,
              notifyCustomer: Boolean(notifyCustomer),
              note: note ? String(note) : undefined
            })
            state = next
            systemMessages.push(...msgs)
            result = JSON.stringify({ ok: true, messages: msgs })
          }
        } else {
          result = JSON.stringify({ error: `Unknown tool: ${name}` })
        }
      } catch (e) {
        result = JSON.stringify({ error: String(e) })
      }

      openAIMessages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result
      })
    }
  }

  // Append assistant message and system messages to state for client
  state = {
    ...state,
    chatMessages: [
      ...state.chatMessages,
      ...systemMessages.map((text) => ({ role: 'system' as const, text })),
      { role: 'ai' as const, text: assistantContent }
    ]
  }
    return {
      assistantMessage: assistantContent,
      updatedState: state,
      systemMessages
    }
  } catch (err: unknown) {
    const anyErr = err as { statusCode?: number; data?: { message?: string }; message?: string; statusMessage?: string; name?: string; cause?: { message?: string } }
    if (anyErr?.statusCode && (anyErr.statusCode === 400 || anyErr.statusCode === 500)) {
      throw err
    }
    const raw = anyErr?.message || anyErr?.cause?.message || String(err)
    const isNetwork =
      /fetch failed|timeout|ECONNREFUSED|ENOTFOUND|connect timeout|abort/i.test(raw) ||
      anyErr?.name === 'AbortError'
    const message = isNetwork
      ? 'Connection to OpenAI timed out or failed. Check your network, firewall, or try again in a moment.'
      : raw || 'Agent request failed'
    console.error('[api/agent]', err)
    throw createError({
      statusCode: 500,
      statusMessage: message
    })
  }
})
