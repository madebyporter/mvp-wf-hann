<template>
  <div class="parent h-full max-h-dvh flex flex-col min-h-0 overflow-hidden">
    <div class="main flex-1 min-h-0 grid gap-0 xl:grid-cols-[320px_minmax(0,1fr)_280px] xl:divide-x xl:divide-black overflow-hidden">
      <!-- AI chat rail -->
      <aside class="chat-window h-full min-h-0 overflow-y-auto p-4 space-y-4">
        <div class="rounded-xl border p-4 bg-slate-50">
          <p class="text-xs uppercase tracking-wide text-slate-500">AI Dispatch Copilot</p>
          <p class="mt-1 text-sm text-slate-700">Answers status questions + applies quick workflow updates</p>
        </div>

        <div v-for="(msg, i) in chatMessages" :key="i" class="max-w-[280px]">
          <div
            class="rounded-xl px-4 py-3 text-sm border"
            :class="msg.role === 'human' ? 'ml-auto bg-white border-slate-300 text-slate-800' : 'mr-auto bg-slate-100 border-slate-200 text-slate-700'"
          >
            <p class="text-[11px] uppercase tracking-wide mb-1" :class="msg.role === 'human' ? 'text-slate-500' : 'text-blue-700'">
              {{ msg.role === 'human' ? 'Dispatcher' : 'AI Ops' }}
            </p>
            {{ msg.text }}
          </div>
        </div>

        <div class="rounded-xl border p-4 bg-blue-50 border-blue-200">
          <p class="text-xs uppercase tracking-wide text-blue-700 font-semibold">AI actions applied</p>
          <ul class="mt-2 space-y-2 text-sm text-slate-700">
            <li v-for="(action, i) in actionLog" :key="i" class="rounded border border-blue-100 bg-white px-3 py-2">{{ action }}</li>
          </ul>
        </div>
      </aside>

      <!-- Middle jobqueue, swaps list/detail in-place -->
      <section class="jobqueue h-full min-h-0 overflow-y-auto p-4 space-y-4">
        <template v-if="!selectedJob">
          <div class="rounded-xl border p-5">
            <div class="flex items-center justify-between gap-3">
              <h2 class="font-semibold">Emergency Queue (24/7)</h2>
              <span class="text-xs px-2 py-1 rounded bg-rose-100 text-rose-700">Priority response</span>
            </div>
            <div class="mt-4 space-y-2">
              <button
                v-for="item in emergencyQueue"
                :key="item.ticket"
                type="button"
                class="w-full text-left rounded-lg border p-3 flex justify-between items-center hover:bg-slate-50"
                @click="openEmergency(item.ticket)"
              >
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
              <button
                v-for="job in installJobs"
                :key="job.id"
                type="button"
                class="w-full text-left rounded-lg border p-3 flex justify-between items-center hover:bg-slate-50"
                @click="openProject(job.id)"
              >
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

          <div class="rounded-xl border p-5">
            <h3 class="font-semibold">Recommended next actions</h3>
            <ul class="mt-3 list-disc pl-5 text-sm text-slate-700 space-y-1">
              <li v-if="selectedJob.ticket">Send ETA update to customer and office coordinator.</li>
              <li v-if="selectedJob.ticket">Pre-stage likely parts based on issue profile.</li>
              <li v-if="selectedJob.id">Confirm permit and inspection timeline with PM.</li>
              <li v-if="selectedJob.id">Lock crew allocation for installation window.</li>
            </ul>
          </div>
        </template>
      </section>

      <!-- Right stat rail -->
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

        <div class="rounded-xl p-5 text-white" style="background:#204CE5">
          <h3 class="font-semibold">Legacy Workflow Alert</h3>
          <p class="mt-2 text-sm">12 jobs still awaiting manual office handoff. Auto-routing can remove this bottleneck.</p>
        </div>
      </aside>
    </div>

    <footer class="footer border-t p-4 shrink-0 bg-white">
      <div class="chat-input rounded-xl border bg-slate-100 px-3 py-2 flex items-center gap-2">
        <span class="text-slate-700 font-medium mr-auto">AI Chat input</span>
        <button class="text-xs rounded-md border bg-white px-2 py-1 hover:bg-slate-50" @click="runDemo('status')">Status EM-2042</button>
        <button class="text-xs rounded-md border bg-white px-2 py-1 hover:bg-slate-50" @click="runDemo('reroute')">Reassign EM-2042</button>
        <button class="rounded-full bg-slate-900 text-white px-3 py-1.5 text-sm">➤</button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type EmergencyJob = {
  ticket: string
  issue: string
  city: string
  eta: string
  priority: string
  status: string
}

type ProjectJob = {
  id: string
  client: string
  scope: string
  location: string
  stage: string
  stageClass: string
}

const emergencyQueue = ref<EmergencyJob[]>([
  { ticket: 'EM-2041', issue: 'No heat', city: 'Parma', eta: '45 min', priority: 'High', status: 'En route' },
  { ticket: 'EM-2042', issue: 'Burst pipe', city: 'Lakewood', eta: '60 min', priority: 'High', status: 'Awaiting crew' },
  { ticket: 'EM-2043', issue: 'Boiler reset', city: 'Strongsville', eta: '90 min', priority: 'Med', status: 'Parts check' }
])

const installJobs = ref<ProjectJob[]>([
  {
    id: 'PRJ-4101',
    client: 'Westlake Medical Campus',
    scope: 'Rooftop unit replacement + controls retrofit',
    location: 'Westlake',
    stage: 'In Progress',
    stageClass: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'PRJ-4102',
    client: 'Parma Logistics Center',
    scope: 'Boiler room modernization + balancing',
    location: 'Parma',
    stage: 'Awaiting Permit',
    stageClass: 'bg-amber-100 text-amber-700'
  },
  {
    id: 'PRJ-4103',
    client: 'Lakewood School District',
    scope: 'Chiller controls upgrade + commissioning',
    location: 'Lakewood',
    stage: 'Scheduled',
    stageClass: 'bg-emerald-100 text-emerald-700'
  }
])

const selectedJob = ref<any>(null)

const detailTitle = computed(() => {
  if (!selectedJob.value) return ''
  return selectedJob.value.ticket
    ? `Emergency Job Detail — ${selectedJob.value.ticket}`
    : `Project Detail — ${selectedJob.value.id}`
})

function openEmergency(ticket: string) {
  selectedJob.value = emergencyQueue.value.find((job) => job.ticket === ticket) || null
}

function openProject(id: string) {
  selectedJob.value = installJobs.value.find((job) => job.id === id) || null
}

const chatMessages = ref([
  { role: 'human', text: 'What is the status of EM-2042 right now?' },
  { role: 'ai', text: 'EM-2042 is awaiting crew assignment. ETA target is 60 min in Lakewood.' },
  { role: 'human', text: 'Reassign EM-2042 to Crew A2 and notify office.' },
  { role: 'ai', text: 'Done. EM-2042 now shows En route with Crew A2. Office + customer updates queued.' }
])

const actionLog = ref([
  'Status query answered for EM-2042',
  'EM-2042 reassigned to Crew A2',
  'Customer + office notifications drafted'
])

function runDemo(mode: 'status' | 'reroute' | 'permit') {
  if (mode === 'status') {
    chatMessages.value.push({ role: 'human', text: 'Status of EM-2042?' })
    chatMessages.value.push({ role: 'ai', text: `EM-2042 is currently ${emergencyQueue.value[1].status}. ETA target remains 60 min.` })
    actionLog.value.unshift('AI returned live status for EM-2042')
    return
  }

  if (mode === 'reroute') {
    emergencyQueue.value[1].status = 'En route'
    chatMessages.value.push({ role: 'human', text: 'Reassign EM-2042 to Crew A2.' })
    chatMessages.value.push({ role: 'ai', text: 'Reassignment complete. Crew A2 dispatched and ETA confirmation sent.' })
    actionLog.value.unshift('AI updated EM-2042 status to En route and dispatched Crew A2')
    return
  }

  installJobs.value[1].stage = 'Permit Follow-up Sent'
  installJobs.value[1].stageClass = 'bg-purple-100 text-purple-700'
  chatMessages.value.push({ role: 'human', text: 'Send permit follow-up for PRJ-4102 and update record.' })
  chatMessages.value.push({ role: 'ai', text: 'Done. PRJ-4102 marked Permit Follow-up Sent and PM notified.' })
  actionLog.value.unshift('AI updated PRJ-4102 stage and logged permit follow-up')
}
</script>
