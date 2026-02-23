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
        <template v-if="!selectedJob">
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

          <div class="rounded-xl border p-5">
            <h2 class="font-semibold">Quote → Job Conversion</h2>
            <div class="mt-4 grid sm:grid-cols-3 gap-3 text-center">
              <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">31</p><p class="text-sm text-slate-600">Quotes Sent</p></div>
              <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">19</p><p class="text-sm text-slate-600">Won</p></div>
              <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">61%</p><p class="text-sm text-slate-600">Conversion</p></div>
            </div>
          </div>
        </template>

        <template v-else>
          <button type="button" class="text-sm text-blue-700 hover:underline" @click="selectedJob = null">← Back to dashboard</button>
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
      </section>

      <aside class="analytics h-full min-h-0 overflow-y-auto p-4 space-y-4">
        <div class="rounded-xl border p-5">
          <h2 class="font-semibold">Home Service Plans</h2>
          <ul class="mt-3 space-y-2 text-sm">
            <li class="flex justify-between"><span>Renewals due (7d)</span><strong>46</strong></li>
            <li class="flex justify-between"><span>Scheduled visits</span><strong>28</strong></li>
            <li class="flex justify-between"><span>At-risk accounts</span><strong>9</strong></li>
          </ul>
        </div>
        <div class="rounded-xl border p-5">
          <h2 class="font-semibold">Install Capacity Snapshot</h2>
          <ul class="mt-3 space-y-2 text-sm">
            <li class="flex justify-between"><span>Large installs active</span><strong>7</strong></li>
            <li class="flex justify-between"><span>Crews assigned</span><strong>11</strong></li>
            <li class="flex justify-between"><span>Pending permits</span><strong>3</strong></li>
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

type EmergencyJob = { ticket: string; issue: string; city: string; eta: string; priority: string; status: string }
type ProjectJob = { id: string; client: string; scope: string; location: string; stage: string; stageClass: string; currentWork?: string; nextStep?: string; notes?: string[] }

type ChatMessage = { role: 'human' | 'ai'; text: string }

const emergencyQueue = ref<EmergencyJob[]>(JSON.parse(JSON.stringify(emergencySeed)))
const installJobs = ref<ProjectJob[]>(JSON.parse(JSON.stringify(installSeed)))
const chatMessages = ref<ChatMessage[]>(JSON.parse(JSON.stringify(chatSeed)))
const actionLog = ref<string[]>(JSON.parse(JSON.stringify(actionSeed)))

const selectedJob = ref<any>(null)
const chatInput = ref('')
const chatInputEl = ref<HTMLInputElement | null>(null)
const chatWindowEl = ref<HTMLElement | null>(null)
const isAiTyping = ref(false)

const conversationState = ref<{ lastProjectId?: string; awaitingStageForProject?: boolean }>({})

const allCodes = computed(() => [
  ...emergencyQueue.value.map((j) => j.ticket),
  ...installJobs.value.map((j) => j.id)
])

const suggestedCode = computed(() => {
  const value = chatInput.value
  const upper = value.toUpperCase()
  const partial = upper.match(/(?:\b|^)(EM|PRJ)(?:-|\s)?([A-Z0-9]*)$/)

  if (partial) {
    const prefix = partial[1] === 'EM' ? 'EM-' : 'PRJ-'
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
  const partial = upper.match(/(?:\b|^)(EM|PRJ)(?:-|\s)?([A-Z0-9]*)$/)

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
  const partial = value.match(/(?:\b|^)(EM|PRJ)(?:-|\s)?([A-Z0-9]*)$/i)

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

function openEmergency(ticket: string) {
  selectedJob.value = emergencyQueue.value.find((job) => job.ticket === ticket) || null
}

function openProject(id: string) {
  selectedJob.value = installJobs.value.find((job) => job.id === id) || null
}

function stageClassFor(stage: string) {
  if (/progress/i.test(stage)) return 'bg-blue-100 text-blue-700'
  if (/permit|await/i.test(stage)) return 'bg-amber-100 text-amber-700'
  if (/scheduled/i.test(stage)) return 'bg-emerald-100 text-emerald-700'
  return 'bg-purple-100 text-purple-700'
}

function pushAction(action: string) {
  actionLog.value.unshift(action)
}

function botReply(input: string) {
  const normalized = input.trim()
  const text = normalized.toLowerCase()
  const emergencyId = normalized.match(/EM-\d+/i)?.[0]?.toUpperCase()
  const projectId = normalized.match(/PRJ-\d+/i)?.[0]?.toUpperCase()

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
  const targetId = emergencyId || projectId || conversationState.value.lastProjectId

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
    return 'I can help — tell me the job code (EM-xxxx or PRJ-xxxx), or a client name like “Lakewood School District”.'
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

  return 'I can answer project updates by client name and also change stages/statuses. Try “what is being worked on for Lakewood School District?” then “set it to In Progress”.'
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
onMounted(scrollChatToBottom)
</script>
