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
      </aside>

      <section class="jobqueue h-full min-h-0 overflow-y-auto p-4 space-y-4">
        <template v-if="!selectedJob">
          <div class="rounded-xl border p-5">
            <div class="flex items-center justify-between gap-3">
              <h2 class="font-semibold">Emergency Queue (24/7)</h2>
              <span class="text-xs px-2 py-1 rounded bg-rose-100 text-rose-700">Priority response</span>
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
              <span class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">Scheduled projects</span>
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
        <input
          v-model="chatInput"
          class="mr-auto w-full bg-transparent outline-none text-sm text-slate-800"
          placeholder="How can I help you..."
        >
        <button type="button" class="text-xs rounded-md border bg-white px-2 py-1 hover:bg-slate-50" @click="quickAsk('Status of EM-2042')">Status EM-2042</button>
        <button type="button" class="text-xs rounded-md border bg-white px-2 py-1 hover:bg-slate-50" @click="quickAsk('Reassign EM-2042 to Crew A2')">Reassign EM-2042</button>
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
type ProjectJob = { id: string; client: string; scope: string; location: string; stage: string; stageClass: string }

type ChatMessage = { role: 'human' | 'ai'; text: string }

const emergencyQueue = ref<EmergencyJob[]>(JSON.parse(JSON.stringify(emergencySeed)))
const installJobs = ref<ProjectJob[]>(JSON.parse(JSON.stringify(installSeed)))
const chatMessages = ref<ChatMessage[]>(JSON.parse(JSON.stringify(chatSeed)))
const actionLog = ref<string[]>(JSON.parse(JSON.stringify(actionSeed)))

const selectedJob = ref<any>(null)
const chatInput = ref('')
const chatWindowEl = ref<HTMLElement | null>(null)

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
  const emergencyId = normalized.match(/EM-\d+/i)?.[0]?.toUpperCase()
  const projectId = normalized.match(/PRJ-\d+/i)?.[0]?.toUpperCase()

  if (emergencyId && /status|where|update/i.test(normalized)) {
    const job = emergencyQueue.value.find((j) => j.ticket === emergencyId)
    if (!job) return `I couldn't find ${emergencyId}.`
    pushAction(`Status query answered for ${emergencyId}`)
    return `${emergencyId} is ${job.status}. ETA target is ${job.eta} in ${job.city}.`
  }

  if (projectId && /status|stage|update/i.test(normalized) && !/set|change|mark/i.test(normalized)) {
    const job = installJobs.value.find((j) => j.id === projectId)
    if (!job) return `I couldn't find ${projectId}.`
    pushAction(`Stage query answered for ${projectId}`)
    return `${projectId} is currently ${job.stage}.`
  }

  if (emergencyId && /reassign|assign|dispatch/i.test(normalized)) {
    const job = emergencyQueue.value.find((j) => j.ticket === emergencyId)
    if (!job) return `I couldn't find ${emergencyId}.`
    job.status = 'En route'
    pushAction(`${emergencyId} reassigned and status set to En route`)
    return `Done. ${emergencyId} is now En route.`
  }

  const setEmergency = normalized.match(/(EM-\d+).*(set|change|mark).*(to)\s+([\w\s-]+)/i)
  if (setEmergency) {
    const id = setEmergency[1].toUpperCase()
    const nextStatus = setEmergency[4].trim()
    const job = emergencyQueue.value.find((j) => j.ticket === id)
    if (!job) return `I couldn't find ${id}.`
    job.status = nextStatus
    pushAction(`${id} status changed to ${nextStatus}`)
    return `Updated ${id} to ${nextStatus}.`
  }

  const setProject = normalized.match(/(PRJ-\d+).*(set|change|mark).*(to)\s+([\w\s-]+)/i)
  if (setProject) {
    const id = setProject[1].toUpperCase()
    const nextStage = setProject[4].trim()
    const job = installJobs.value.find((j) => j.id === id)
    if (!job) return `I couldn't find ${id}.`
    job.stage = nextStage
    job.stageClass = stageClassFor(nextStage)
    pushAction(`${id} stage changed to ${nextStage}`)
    return `Updated ${id} to ${nextStage}.`
  }

  if (projectId && /permit/i.test(normalized)) {
    const job = installJobs.value.find((j) => j.id === projectId)
    if (!job) return `I couldn't find ${projectId}.`
    job.stage = 'Permit Follow-up Sent'
    job.stageClass = 'bg-purple-100 text-purple-700'
    pushAction(`${projectId} permit follow-up logged`)
    return `Done. ${projectId} marked Permit Follow-up Sent.`
  }

  return 'I can help with status lookups and updates. Try: “Status of EM-2042” or “Set PRJ-4102 to In Progress”.'
}

async function sendChat() {
  const text = chatInput.value.trim()
  if (!text) return
  chatMessages.value.push({ role: 'human', text })
  const reply = botReply(text)
  chatMessages.value.push({ role: 'ai', text: reply })
  chatInput.value = ''
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
