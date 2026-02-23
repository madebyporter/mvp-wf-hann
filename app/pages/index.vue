<template>
  <div class="parent h-full max-h-dvh flex flex-col min-h-0 overflow-hidden">
    <div class="main flex-1 min-h-0 grid gap-0 xl:grid-cols-[320px_minmax(0,1fr)_280px] xl:divide-x xl:divide-black overflow-hidden">
      <aside ref="chatWindowEl" class="chat-window h-full min-h-0 overflow-y-auto p-4 space-y-4">
        <div class="rounded-xl border p-4 bg-slate-50">
          <p class="text-xs uppercase tracking-wide text-slate-500">AI Dispatch Copilot</p>
          <p class="mt-1 text-sm text-slate-700">Answers status questions + applies workflow updates</p>
        </div>

        <div v-for="(msg, i) in chatMessages" :key="i" class="flex" :class="msg.role === 'human' ? 'justify-start' : 'justify-end'">
          <div class="w-[80%] rounded-xl px-4 py-3 text-sm border" :class="msg.role === 'human' ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700'">
            <p class="text-[11px] uppercase tracking-wide mb-1" :class="msg.role === 'human' ? 'text-slate-500' : 'text-blue-700'">
              {{ msg.role === 'human' ? 'Dispatcher' : 'AI Ops' }}
            </p>
            {{ msg.text }}
          </div>
        </div>

        <div v-if="isAiTyping" class="flex justify-end">
          <div class="w-[80%] rounded-xl px-4 py-3 text-sm border bg-slate-100 border-slate-200 text-slate-700">
            <p class="text-[11px] uppercase tracking-wide mb-1 text-blue-700">AI Ops</p>
            <div class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
              <span class="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.1s]" />
              <span class="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
            </div>
          </div>
        </div>
      </aside>

      <section class="jobqueue h-full min-h-0 overflow-y-auto p-4 space-y-4">

        <template v-if="currentView !== 'crm' && selectedJob">
          <button type="button" class="text-sm text-blue-700 hover:underline" @click="selectedJob = null">← Back</button>
          <div class="rounded-xl border p-5">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">{{ detailTitle }}</h2>
              <span v-if="selectedJob.priority" class="text-xs px-2 py-1 rounded" :class="selectedJob.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ selectedJob.priority }}</span>
              <span v-else class="text-xs px-2 py-1 rounded" :class="selectedJob.stageClass">{{ selectedJob.stage }}</span>
            </div>
            <div class="mt-4 grid md:grid-cols-2 gap-6 text-sm">
              <div class="space-y-2">
                <p><span class="text-slate-500">Location</span><br><strong>{{ selectedJob.city || selectedJob.location }}</strong></p>
                <p v-if="selectedJob.issue"><span class="text-slate-500">Issue</span><br><strong>{{ selectedJob.issue }}</strong></p>
                <p v-if="selectedJob.scope"><span class="text-slate-500">Scope</span><br><strong>{{ selectedJob.scope }}</strong></p>
              </div>
              <div class="space-y-2">
                <p v-if="selectedJob.eta"><span class="text-slate-500">ETA target</span><br><strong>{{ selectedJob.eta }}</strong></p>
                <p v-if="selectedJob.status"><span class="text-slate-500">Dispatch status</span><br><strong>{{ selectedJob.status }}</strong></p>
                <p v-if="selectedJob.stage"><span class="text-slate-500">Project stage</span><br><strong>{{ selectedJob.stage }}</strong></p>
              </div>
            </div>
          </div>

          <div v-if="selectedJob.id && selectedJob.notes?.length" class="rounded-xl border p-5">
            <h3 class="font-semibold">Project notes timeline</h3>
            <ul class="mt-3 space-y-2 text-sm text-slate-700">
              <li v-for="(note, idx) in selectedJob.notes" :key="idx" class="flex gap-2">
                <span class="text-slate-400">•</span>
                <span>{{ note }}</span>
              </li>
            </ul>
          </div>
        </template>

        <template v-else-if="currentView === 'crm' && selectedOpportunity">
          <button type="button" class="text-sm text-blue-700 hover:underline" @click="selectedOpportunity = null">← Back to CRM</button>
          <div class="rounded-xl border p-5">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">{{ opportunityDetailTitle }}</h2>
              <span class="text-xs px-2 py-1 rounded" :class="opportunityStageClassFor(selectedOpportunity.stage)">{{ selectedOpportunity.stage }}</span>
            </div>
            <div class="mt-4 grid md:grid-cols-2 gap-6 text-sm">
              <div class="space-y-2">
                <p><span class="text-slate-500">Company</span><br><strong>{{ selectedOpportunity.company }}</strong></p>
                <p><span class="text-slate-500">Contact</span><br><strong>{{ selectedOpportunity.contact }}</strong></p>
                <p><span class="text-slate-500">Source</span><br><strong>{{ selectedOpportunity.source }}</strong></p>
              </div>
              <div class="space-y-2">
                <p><span class="text-slate-500">Created</span><br><strong>{{ selectedOpportunity.createdDate }}</strong></p>
                <p><span class="text-slate-500">Last update</span><br><strong>{{ selectedOpportunity.updatedDate }}</strong></p>
                <p><span class="text-slate-500">Value</span><br><strong>${{ selectedOpportunity.value.toLocaleString() }}</strong></p>
              </div>
            </div>
          </div>
          <div v-if="selectedOpportunity.notes?.length" class="rounded-xl border p-5">
            <h3 class="font-semibold">Opportunity timeline</h3>
            <ul class="mt-3 space-y-2 text-sm text-slate-700">
              <li v-for="(note, idx) in selectedOpportunity.notes" :key="idx" class="flex gap-2"><span class="text-slate-400">•</span><span>{{ note }}</span></li>
            </ul>
          </div>
        </template>

        <template v-else-if="currentView === 'crm'">
          <div class="rounded-xl border p-5">
            <h2 class="font-semibold">CRM Overview</h2>
            <div class="mt-4 grid sm:grid-cols-3 gap-3 text-center">
              <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">{{ dashboardStats.quoteConversion.quotesSent }}</p><p class="text-sm text-slate-600">Quotes Sent</p></div>
              <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">{{ dashboardStats.quoteConversion.won }}</p><p class="text-sm text-slate-600">Won</p></div>
              <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">{{ dashboardStats.quoteConversion.conversion }}%</p><p class="text-sm text-slate-600">Conversion</p></div>
            </div>

            <div class="mt-6 flex items-center justify-between">
              <h3 class="font-semibold">Recent opportunities</h3>
              <span class="text-xs text-slate-400">Top 5</span>
            </div>
            <div class="mt-3 space-y-2">
              <button v-for="opp in recentOpportunities" :key="opp.id" type="button" class="w-full text-left rounded-lg border p-3 flex justify-between items-center hover:bg-slate-50" @click="openOpportunity(opp.id)">
                <div>
                  <p class="font-medium">{{ opp.id }} — {{ opp.company }}</p>
                  <p class="text-sm text-slate-600">{{ opp.createdDate }} · USD {{ opp.value.toLocaleString() }}</p>
                </div>
                <span class="text-xs px-2 py-1 rounded" :class="opportunityStageClassFor(opp.stage)">{{ opp.stage }}</span>
              </button>
            </div>
          </div>
        </template>


        <template v-else>
          <div class="rounded-xl border p-5">
            <div class="flex items-center justify-between gap-3">
              <h2 class="font-semibold">Emergency Queue (24/7)</h2>
              <span class="text-xs text-slate-400">Priority response</span>
            </div>
            <div class="mt-4 space-y-2">
              <button v-for="item in emergencyQueue" :key="item.ticket" type="button" class="w-full text-left rounded-lg border p-3 flex justify-between items-center hover:bg-slate-50" @click="openEmergency(item.ticket)">
                <div>
                  <p class="font-medium">{{ item.ticket }} — {{ item.issue }}</p>
                  <p class="text-sm text-slate-600">{{ item.city }} · ETA target {{ item.eta }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs px-2 py-1 rounded" :class="item.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ item.priority }}</span>
                  <span class="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{{ item.status }}</span>
                </div>
              </button>
            </div>
          </div>

          <div class="rounded-xl border p-5">
            <div class="flex items-center justify-between gap-3">
              <h2 class="font-semibold">Commercial / Non-Emergency Install Pipeline</h2>
              <span class="text-xs text-slate-400">Scheduled projects</span>
            </div>
            <div class="mt-4 space-y-2">
              <button v-for="job in installJobs" :key="job.id" type="button" class="w-full text-left rounded-lg border p-3 flex justify-between items-center hover:bg-slate-50" @click="openProject(job.id)">
                <div>
                  <p class="font-medium">{{ job.id }} — {{ job.client }}</p>
                  <p class="text-sm text-slate-600">{{ job.scope }} · {{ job.location }}</p>
                </div>
                <span class="text-xs px-2 py-1 rounded" :class="job.stageClass">{{ job.stage }}</span>
              </button>
            </div>
          </div>

          <div v-if="currentView === 'dashboard'" class="rounded-xl border p-5">
            <button type="button" class="w-full text-left" @click="openView('crm')">
              <h2 class="font-semibold">Quote → Job Conversion</h2>
              <div class="mt-4 grid sm:grid-cols-3 gap-3 text-center">
                <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">{{ dashboardStats.quoteConversion.quotesSent }}</p><p class="text-sm text-slate-600">Quotes Sent</p></div>
                <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">{{ dashboardStats.quoteConversion.won }}</p><p class="text-sm text-slate-600">Won</p></div>
                <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">{{ dashboardStats.quoteConversion.conversion }}%</p><p class="text-sm text-slate-600">Conversion</p></div>
              </div>
            </button>
          </div>

          <div v-if="currentView === 'dashboard'" class="rounded-xl border p-5">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">Most recent opportunities</h2>
              <button type="button" class="text-xs text-blue-700" @click="openView('crm')">View all</button>
            </div>
            <div class="mt-3 space-y-2">
              <button v-for="opp in recentOpportunities" :key="opp.id" type="button" class="w-full text-left rounded-lg border p-3 flex justify-between items-center hover:bg-slate-50" @click="openOpportunity(opp.id)">
                <div>
                  <p class="font-medium">{{ opp.company }}</p>
                  <p class="text-sm text-slate-600">{{ opp.createdDate }}</p>
                </div>
                <span class="text-xs px-2 py-1 rounded" :class="opportunityStageClassFor(opp.stage)">{{ opp.stage }}</span>
              </button>
            </div>
          </div>
        </template>
      </section>

      <aside class="analytics h-full min-h-0 overflow-y-auto p-4 space-y-4">
        <div class="rounded-xl border p-5">
          <h2 class="font-semibold">Home Service Plans</h2>
          <ul class="mt-3 space-y-2 text-sm">
            <li class="flex justify-between"><span>Renewals due (7d)</span><strong>{{ dashboardStats.homeServicePlans.renewalsDue7d }}</strong></li>
            <li class="flex justify-between"><span>Scheduled visits</span><strong>{{ dashboardStats.homeServicePlans.scheduledVisits }}</strong></li>
            <li class="flex justify-between"><span>At-risk accounts</span><strong>{{ dashboardStats.homeServicePlans.atRiskAccounts }}</strong></li>
          </ul>
        </div>
        <div class="rounded-xl border p-5">
          <h2 class="font-semibold">Install Capacity Snapshot</h2>
          <ul class="mt-3 space-y-2 text-sm">
            <li class="flex justify-between"><span>Large installs active</span><strong>{{ dashboardStats.installCapacity.largeInstallsActive }}</strong></li>
            <li class="flex justify-between"><span>Crews assigned</span><strong>{{ dashboardStats.installCapacity.crewsAssigned }}</strong></li>
            <li class="flex justify-between"><span>Pending permits</span><strong>{{ dashboardStats.installCapacity.pendingPermits }}</strong></li>
          </ul>
        </div>
      </aside>
    </div>

    <footer class="footer border-t p-4 shrink-0 bg-white">
      <form class="chat-input rounded-xl border bg-slate-100 px-3 py-2 flex items-center gap-2" @submit.prevent="sendChat">
        <div class="mr-auto w-full relative">
          <input
            ref="chatInputEl"
            v-model="chatInput"
            class="w-full bg-transparent outline-none text-sm text-slate-800 relative z-10"
            placeholder="How can I help you..."
            @keydown.tab.prevent="acceptSuggestion"
          >
          <div v-if="suggestionTail" class="absolute inset-y-0 left-0 flex items-center text-sm text-slate-400 pointer-events-none">
            <span class="invisible">{{ chatInput }}</span><span>{{ suggestionTail }}</span>
          </div>
        </div>
        <button type="button" class="text-xs rounded-md border bg-white px-2 py-1 hover:bg-slate-50 whitespace-nowrap" @click="quickAsk('Status of EM-2042')">Status EM-2042</button>
        <button type="button" class="text-xs rounded-md border bg-white px-2 py-1 hover:bg-slate-50 whitespace-nowrap" @click="quickAsk('Reassign EM-2042 to Crew A2')">Reassign EM-2042</button>
        <button type="submit" class="rounded-full bg-slate-900 text-white px-3 py-1.5 text-sm">➤</button>
      </form>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import emergencySeed from '~/data/emergencyQueue.json'
import installSeed from '~/data/installJobs.json'
import chatSeed from '~/data/chatSeed.json'
import actionSeed from '~/data/actionLogSeed.json'
import dashboardStatsSeed from '~/data/dashboardStats.json'
import opportunitiesSeed from '~/data/opportunities.json'

type EmergencyJob = { ticket: string; issue: string; city: string; eta: string; priority: string; status: string }
type ProjectJob = { id: string; client: string; scope: string; location: string; stage: string; stageClass: string; currentWork?: string; nextStep?: string; notes?: string[] }

type ChatMessage = { role: 'human' | 'ai'; text: string }
type DashboardStats = {
  quoteConversion: { quotesSent: number; won: number; conversion: number }
  homeServicePlans: { renewalsDue7d: number; scheduledVisits: number; atRiskAccounts: number }
  installCapacity: { largeInstallsActive: number; crewsAssigned: number; pendingPermits: number }
}
type Opportunity = {
  id: string
  company: string
  contact: string
  stage: string
  value: number
  createdDate: string
  updatedDate: string
  source: string
  notes?: string[]
}

const emergencyQueue = ref<EmergencyJob[]>(JSON.parse(JSON.stringify(emergencySeed)))
const installJobs = ref<ProjectJob[]>(JSON.parse(JSON.stringify(installSeed)))
const chatMessages = ref<ChatMessage[]>(JSON.parse(JSON.stringify(chatSeed)))
const actionLog = ref<string[]>(JSON.parse(JSON.stringify(actionSeed)))
const dashboardStats = ref<DashboardStats>(JSON.parse(JSON.stringify(dashboardStatsSeed)))
const opportunities = ref<Opportunity[]>(JSON.parse(JSON.stringify(opportunitiesSeed)))

const currentView = ref<'dashboard' | 'jobs' | 'crm'>('dashboard')
const selectedOpportunity = ref<Opportunity | null>(null)
const selectedJob = ref<any>(null)
const chatInput = ref('')
const chatInputEl = ref<HTMLInputElement | null>(null)
const chatWindowEl = ref<HTMLElement | null>(null)
const isAiTyping = ref(false)

const route = useRoute()
const router = useRouter()

const conversationState = ref<{ lastProjectId?: string; awaitingStageForProject?: boolean; lastOpportunityId?: string }>({})

const allCodes = computed(() => [
  ...emergencyQueue.value.map((j) => j.ticket),
  ...installJobs.value.map((j) => j.id),
  ...opportunities.value.map((o) => o.id)
])

const recentOpportunities = computed(() => [...opportunities.value].sort((a, b) => b.updatedDate.localeCompare(a.updatedDate)).slice(0, 5))

const suggestedCode = computed(() => {
  const value = chatInput.value
  const upper = value.toUpperCase()
  const partial = upper.match(/(?:\b|^)(EM|PRJ|OPP)(?:-|\s)?([A-Z0-9]*)$/)

  if (partial) {
    const prefix = partial[1] === 'EM' ? 'EM-' : partial[1] === 'PRJ' ? 'PRJ-' : 'OPP-'
    const typed = partial[2] || ''
    const match = allCodes.value.find((code) => code.startsWith(`${prefix}${typed}`))
    return match || ''
  }

  if (/\bset\s+p$/i.test(value)) return 'PRJ-4101'
  if (/\bset\s+e$/i.test(value)) return 'EM-2042'
  return ''
})

const suggestionTail = computed(() => {
  const code = suggestedCode.value
  if (!code) return ''
  const value = chatInput.value
  const upper = value.toUpperCase()
  const partial = upper.match(/(?:\b|^)(EM|PRJ|OPP)(?:-|\s)?([A-Z0-9]*)$/)

  if (partial) {
    const typedPrefix = partial[1]
    const typedRest = partial[2] || ''
    const normalizedTyped = `${typedPrefix}-${typedRest}`
    if (!code.startsWith(normalizedTyped)) return ''
    return code.slice(normalizedTyped.length)
  }

  if (/\bset\s+[pe]$/i.test(value)) return code.slice(1)
  return ''
})

function acceptSuggestion() {
  if (!suggestedCode.value) return
  const value = chatInput.value
  const partial = value.match(/(?:\b|^)(EM|PRJ|OPP)(?:-|\s)?([A-Z0-9]*)$/i)

  if (partial) {
    const start = partial.index ?? 0
    chatInput.value = `${value.slice(0, start)}${suggestedCode.value}`
  } else if (/\bset\s+[pe]$/i.test(value)) {
    chatInput.value = `${value.slice(0, -1)}${suggestedCode.value}`
  }

  nextTick(() => chatInputEl.value?.focus())
}

const detailTitle = computed(() => {
  if (!selectedJob.value) return ''
  return selectedJob.value.ticket ? `Emergency Job Detail — ${selectedJob.value.ticket}` : `Project Detail — ${selectedJob.value.id}`
})

const opportunityDetailTitle = computed(() => {
  if (!selectedOpportunity.value) return ''
  return `Opportunity Detail — ${selectedOpportunity.value.id}`
})

function openEmergency(ticket: string) {
  selectedJob.value = emergencyQueue.value.find((job) => job.ticket === ticket) || null
}

function openProject(id: string) {
  selectedJob.value = installJobs.value.find((job) => job.id === id) || null
}

function openOpportunity(id: string) {
  selectedOpportunity.value = opportunities.value.find((opp) => opp.id === id) || null
  currentView.value = 'crm'
}

function openView(view: 'dashboard' | 'jobs' | 'crm') {
  currentView.value = view
  selectedJob.value = null
  selectedOpportunity.value = null
  router.replace({ query: { ...route.query, view } })
}

function stageClassFor(stage: string) {
  if (/progress/i.test(stage)) return 'bg-blue-100 text-blue-700'
  if (/permit|await/i.test(stage)) return 'bg-amber-100 text-amber-700'
  if (/scheduled/i.test(stage)) return 'bg-emerald-100 text-emerald-700'
  return 'bg-purple-100 text-purple-700'
}

function opportunityStageClassFor(stage: string) {
  if (/won/i.test(stage)) return 'bg-emerald-100 text-emerald-700'
  if (/proposal/i.test(stage)) return 'bg-blue-100 text-blue-700'
  if (/lost/i.test(stage)) return 'bg-rose-100 text-rose-700'
  return 'bg-amber-100 text-amber-700'
}

function normalizeOpportunityStage(input: string) {
  if (/won|closed\s*won/.test(input)) return 'Won'
  if (/lost|closed\s*lost/.test(input)) return 'Lost'
  if (/proposal|quote\s*sent/.test(input)) return 'Proposal Sent'
  if (/lead|new/.test(input)) return 'Lead'
  return ''
}

function recomputeQuoteStats() {
  const quotesSent = opportunities.value.length
  const won = opportunities.value.filter((o) => /won/i.test(o.stage)).length
  const conversion = quotesSent ? Math.round((won / quotesSent) * 100) : 0
  dashboardStats.value.quoteConversion = { quotesSent, won, conversion }
}

function pushAction(action: string) {
  actionLog.value.unshift(action)
}

function botReply(input: string) {
  const normalized = input.trim()
  const text = normalized.toLowerCase()
  const emergencyId = normalized.match(/EM-\d+/i)?.[0]?.toUpperCase()
  const projectId = normalized.match(/PRJ-\d+/i)?.[0]?.toUpperCase()
  const opportunityId = normalized.match(/OPP-\d+/i)?.[0]?.toUpperCase()

  const isUpdateIntent = /\b(set|change|mark|make|move|switch|update)\b/.test(text)
  const isStatusIntent = /\b(status|stage|where|what('| i)?s|current|progress|worked on|happening|update)\b/.test(text)

  const commercialStatusOptions = ['Scheduled', 'In Progress', 'Awaiting Permit', 'Permit Follow-up Sent', 'Complete', 'On Hold', 'Cancelled']
  const emergencyStatusOptions = ['Awaiting crew', 'En route', 'On site', 'Parts check', 'Resolved', 'Closed']

  const extractTargetValue = () => {
    const toMatch = normalized.match(/\bto\b\s+([\w\s-]+)/i)?.[1]
    if (toMatch) return toMatch.trim().replace(/[.?!]$/, '')

    if (/\bcomplete|completed|done|finish|finished\b/i.test(normalized)) return 'Complete'
    if (/\bin\s*progress|working\s*on|started\b/i.test(normalized)) return 'In Progress'
    if (/\bscheduled|schedule\b/i.test(normalized)) return 'Scheduled'
    if (/\bawaiting\s*permit|permit\b/i.test(normalized)) return 'Awaiting Permit'
    if (/\ben\s*route|dispatched\b/i.test(normalized)) return 'En route'
    if (/\bon\s*hold|blocked\b/i.test(normalized)) return 'On Hold'
    return ''
  }

  const targetValue = extractTargetValue()
  const isCasualAssignment = /\b(is now|now|set to|moved to|move to|went to|switch to|make it|mark it|also)\b/.test(text)
  const targetId = emergencyId || projectId || opportunityId || conversationState.value.lastProjectId || conversationState.value.lastOpportunityId

  if (/^(yes|yeah|yep|sure|do it|go ahead)$/i.test(text) && conversationState.value.awaitingStageForProject && conversationState.value.lastProjectId) {
    return `Perfect — what stage should I set for ${conversationState.value.lastProjectId}? For example: In Progress, Scheduled, Complete, or On Hold.`
  }

  if (/what.*(statuses|status options|options).*(commercial|project|prj)/i.test(text)) {
    return `For commercial jobs (PRJ), you can set: ${commercialStatusOptions.join(', ')}.`
  }

  if (/what.*(statuses|status options|options).*(emergency|em-|dispatch)/i.test(text)) {
    return `For emergency jobs (EM), you can set: ${emergencyStatusOptions.join(', ')}.`
  }

  if (/(what can i set|help|commands|how do i use)/i.test(text) && !targetId) {
    return [
      'Absolutely — quick guide:',
      `Commercial status options: ${commercialStatusOptions.join(', ')}.`,
      `Emergency status options: ${emergencyStatusOptions.join(', ')}.`,
      'You can ask things like: “what is being worked on for Lakewood School District?”, “set PRJ-4101 to complete”, or “where is EM-2042?”'
    ].join(' ')
  }

  if (/\b(quote|quotes|conversion|won|renewals|scheduled visits|at-risk|capacity|crews assigned|pending permits)\b/.test(text)) {
    const { quoteConversion, homeServicePlans, installCapacity } = dashboardStats.value

    if (/how many.*quotes|quotes sent|quote count/.test(text)) {
      return `Quotes sent so far: ${quoteConversion.quotesSent}. Won: ${quoteConversion.won}. Conversion: ${quoteConversion.conversion}%.`
    }

    if (/how many.*won|jobs won|wins\b/.test(text)) {
      return `Won so far: ${quoteConversion.won} out of ${quoteConversion.quotesSent} quotes (${quoteConversion.conversion}% conversion).`
    }

    if (/renewals/.test(text)) return `Renewals due in 7 days: ${homeServicePlans.renewalsDue7d}.`
    if (/scheduled visits/.test(text)) return `Scheduled visits: ${homeServicePlans.scheduledVisits}.`
    if (/at-risk/.test(text)) return `At-risk accounts: ${homeServicePlans.atRiskAccounts}.`
    if (/large installs/.test(text)) return `Large installs active: ${installCapacity.largeInstallsActive}.`
    if (/crews assigned/.test(text)) return `Crews assigned: ${installCapacity.crewsAssigned}.`
    if (/pending permits/.test(text)) return `Pending permits: ${installCapacity.pendingPermits}.`

    return `Current stats — Quotes sent: ${quoteConversion.quotesSent}, Won: ${quoteConversion.won}, Conversion: ${quoteConversion.conversion}%, Renewals due (7d): ${homeServicePlans.renewalsDue7d}, Scheduled visits: ${homeServicePlans.scheduledVisits}, At-risk accounts: ${homeServicePlans.atRiskAccounts}, Large installs active: ${installCapacity.largeInstallsActive}, Crews assigned: ${installCapacity.crewsAssigned}, Pending permits: ${installCapacity.pendingPermits}.`
  }

  const opportunityByName = opportunities.value.find((opp) => {
    const company = opp.company.toLowerCase()
    return text.includes(company) || text.includes(company.split(' ')[0])
  })

  const opportunityStage = normalizeOpportunityStage(text)
  if (opportunityByName && opportunityStage && (isUpdateIntent || isCasualAssignment) && !/\?/.test(text)) {
    opportunityByName.stage = opportunityStage
    opportunityByName.updatedDate = new Date().toISOString().slice(0, 10)
    opportunityByName.notes = opportunityByName.notes || []
    opportunityByName.notes.unshift(`Stage changed to ${opportunityStage} via dispatcher chat.`)
    conversationState.value.lastOpportunityId = opportunityByName.id
    pushAction(`${opportunityByName.id} updated to ${opportunityStage}`)
    recomputeQuoteStats()
    return `Done — ${opportunityByName.company} is now ${opportunityStage}.`
  }

  if ((/opportunity|crm|lead|proposal|won|lost/.test(text) && opportunityByName && /\?/.test(text)) || (opportunityByName && /status|stage/.test(text))) {
    conversationState.value.lastOpportunityId = opportunityByName.id
    return `${opportunityByName.id} (${opportunityByName.company}) is currently ${opportunityByName.stage}. Created ${opportunityByName.createdDate}, last updated ${opportunityByName.updatedDate}.`
  }

  if (/recent opportunities|recent leads|show crm|open crm/.test(text)) {
    currentView.value = 'crm'
    selectedOpportunity.value = null
    return `Opened CRM view. Top recent opportunities are ${recentOpportunities.value.map((o) => o.id).join(', ')}.`
  }

  const projectByName = installJobs.value.find((job) => {
    const client = job.client.toLowerCase()
    const location = job.location.toLowerCase()
    return text.includes(client) || text.includes(location)
  })

  if (projectByName && targetValue && (isUpdateIntent || isCasualAssignment) && !/\?/.test(text)) {
    projectByName.stage = targetValue
    projectByName.stageClass = stageClassFor(targetValue)
    pushAction(`${projectByName.id} stage changed to ${targetValue}`)
    conversationState.value.lastProjectId = projectByName.id
    conversationState.value.awaitingStageForProject = false
    return `Got it — updated ${projectByName.client} (${projectByName.id}) to ${targetValue}.`
  }

  if (projectByName && isStatusIntent) {
    conversationState.value.lastProjectId = projectByName.id
    conversationState.value.awaitingStageForProject = true
    return [
      `Right now for ${projectByName.client}:`,
      `${projectByName.currentWork || projectByName.scope}`,
      `Current stage is ${projectByName.stage}.`,
      `Next up: ${projectByName.nextStep || 'confirm next milestone and crew timing.'}`,
      `If you want, I can change the stage label for ${projectByName.id} right now.`
    ].join(' ')
  }

  if (!targetId) {
    return 'I can help — tell me a code (EM/PRJ/OPP) or a client/company name, and I can update status/stage immediately.'
  }

  if (/^OPP-\d+$/i.test(targetId)) {
    const opp = opportunities.value.find((o) => o.id === targetId)
    if (!opp) return `I couldn't find ${targetId}.`
    conversationState.value.lastOpportunityId = opp.id

    if (opportunityStage && (isUpdateIntent || isCasualAssignment || /^(yes|yeah|yep|sure)/.test(text))) {
      opp.stage = opportunityStage
      opp.updatedDate = new Date().toISOString().slice(0, 10)
      opp.notes = opp.notes || []
      opp.notes.unshift(`Stage changed to ${opportunityStage} via dispatcher chat.`)
      pushAction(`${opp.id} updated to ${opportunityStage}`)
      recomputeQuoteStats()
      return `Done — ${opp.id} is now ${opportunityStage}.`
    }

    if (isStatusIntent || /\?$/.test(text)) {
      return `${opp.id} for ${opp.company} is ${opp.stage}. Value is $${opp.value.toLocaleString()}.`
    }
  }

  if (/^PRJ-\d+$/i.test(targetId)) {
    const job = installJobs.value.find((j) => j.id === targetId)
    if (!job) return `I couldn't find ${targetId}.`
    conversationState.value.lastProjectId = job.id

    if (/\bpermit\b/.test(text) && isUpdateIntent) {
      job.stage = 'Permit Follow-up Sent'
      job.stageClass = 'bg-purple-100 text-purple-700'
      pushAction(`${job.id} permit follow-up logged`)
      conversationState.value.awaitingStageForProject = false
      return `Done — ${job.id} is now Permit Follow-up Sent. Want me to add a note in the timeline too?`
    }

    if (isUpdateIntent || (targetValue && isCasualAssignment && !/\?/.test(text)) || (conversationState.value.awaitingStageForProject && !!targetValue)) {
      const nextStage = targetValue || 'In Progress'
      job.stage = nextStage
      job.stageClass = stageClassFor(nextStage)
      pushAction(`${job.id} stage changed to ${nextStage}`)
      conversationState.value.awaitingStageForProject = false
      return `Done — I changed ${job.id} to ${nextStage}.` 
    }

    if (isStatusIntent || /\?$/.test(text)) {
      conversationState.value.awaitingStageForProject = true
      return `${job.id} is currently ${job.stage}. Current work: ${job.currentWork || job.scope}. Want me to change the stage?`
    }
  }

  if (/^EM-\d+$/i.test(targetId)) {
    const job = emergencyQueue.value.find((j) => j.ticket === targetId)
    if (!job) return `I couldn't find ${targetId}.`

    if (/\breassign|assign|dispatch\b/.test(text)) {
      job.status = 'En route'
      pushAction(`${job.ticket} reassigned and status set to En route`)
      return `Done — ${job.ticket} is now En route. I can also adjust ETA notes if you want.`
    }

    if (isUpdateIntent) {
      const nextStatus = extractTargetValue() || 'In Progress'
      job.status = nextStatus
      pushAction(`${job.ticket} status changed to ${nextStatus}`)
      return `Got it — I updated ${job.ticket} to ${nextStatus}.`
    }

    if (isStatusIntent || /\?$/.test(text)) {
      return `${job.ticket} is currently ${job.status}. ETA target is ${job.eta} in ${job.city}.`
    }
  }

  return 'I can handle jobs + CRM updates. Try: “westlake is now complete”, “set OPP-5008 to won”, or “open crm”.'
}

async function sendChat() {
  const text = chatInput.value.trim()
  if (!text || isAiTyping.value) return

  chatMessages.value.push({ role: 'human', text })
  chatInput.value = ''
  isAiTyping.value = true
  await scrollChatToBottom()

  const delayMs = 900 + Math.floor(Math.random() * 700)
  await new Promise((resolve) => setTimeout(resolve, delayMs))

  const reply = botReply(text)
  isAiTyping.value = false
  chatMessages.value.push({ role: 'ai', text: reply })
  await scrollChatToBottom()
}

function quickAsk(text: string) {
  chatInput.value = text
  sendChat()
}

async function scrollChatToBottom() {
  await nextTick()
  if (chatWindowEl.value) {
    chatWindowEl.value.scrollTop = chatWindowEl.value.scrollHeight
  }
}

watch(chatMessages, scrollChatToBottom, { deep: true })
onMounted(() => {
  recomputeQuoteStats()
  const qv = String(route.query.view || 'dashboard')
  if (qv === 'jobs' || qv === 'crm' || qv === 'dashboard') currentView.value = qv
  scrollChatToBottom()
})

watch(() => route.query.view, (v) => {
  const view = String(v || 'dashboard')
  if (view === 'jobs' || view === 'crm' || view === 'dashboard') {
    currentView.value = view
    selectedJob.value = null
    selectedOpportunity.value = null
  }
})
</script>
