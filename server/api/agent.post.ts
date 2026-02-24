import type { DemoState } from '../utils/demo-types'
import {
  appendSystemMessages,
  createDeal,
  dispatchEmergencyJob,
  recomputeQuoteConversion
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
      name: 'dispatch_emergency',
      description: 'Dispatch an emergency job: assign crew, set status (Awaiting crew, En route, On site, Completed), ETA in minutes, optionally notify customer.',
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
      name: 'find_entities',
      description: 'Resolve crew names/ids or job ids from the current state. Returns list of matching crews or emergency jobs.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['crews', 'emergency_jobs'] },
          query: { type: 'string', description: 'Partial name or id to match' }
        },
        required: ['type', 'query']
      }
    }
  }
]

function buildOpenAIMessages(chatMessages: { role: string; text: string }[]) {
  const out: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    {
      role: 'system',
      content:
        'You are an HVAC Ops Dispatch assistant. You can create CRM deals (create_deal) and dispatch emergency jobs (dispatch_emergency). Use find_entities to resolve crew or job ids when needed. Be concise. After performing an action, summarize what you did for the user.'
    }
  ]
  for (const m of chatMessages) {
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
          } else {
            result = JSON.stringify({ error: 'Unknown type' })
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
