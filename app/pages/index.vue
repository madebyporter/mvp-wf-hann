<template>
  <div class="space-y-4">
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
          <NuxtLink to="/jobs" class="text-xs text-blue-700 hover:underline">View all jobs</NuxtLink>
        </div>
        <p class="text-xs text-slate-400 mt-1">Priority response</p>
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
        <NuxtLink to="/crm" class="block w-full text-left">
          <h2 class="font-semibold">Quote → Job Conversion</h2>
          <div class="mt-4 grid sm:grid-cols-3 gap-3 text-center">
            <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">{{ dashboardStats.quoteConversion.quotesSent }}</p><p class="text-sm text-slate-600">Quotes Sent</p></div>
            <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">{{ dashboardStats.quoteConversion.won }}</p><p class="text-sm text-slate-600">Won</p></div>
            <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">{{ dashboardStats.quoteConversion.conversion }}%</p><p class="text-sm text-slate-600">Conversion</p></div>
          </div>
        </NuxtLink>
      </div>

      <div v-if="currentView === 'dashboard'" class="rounded-xl border p-5">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Most recent opportunities</h2>
          <NuxtLink to="/crm" class="text-xs text-blue-700 hover:underline">View all</NuxtLink>
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import emergencySeed from '~/data/emergencyQueue.json'
import installSeed from '~/data/installJobs.json'
import dashboardStatsSeed from '~/data/dashboardStats.json'
import opportunitiesSeed from '~/data/opportunities.json'

type EmergencyJob = { ticket: string; issue: string; city: string; eta: string; priority: string; status: string }
type ProjectJob = { id: string; client: string; scope: string; location: string; stage: string; stageClass: string; currentWork?: string; nextStep?: string; notes?: string[] }
type DashboardStats = {
  quoteConversion: { quotesSent: number; won: number; conversion: number }
  homeServicePlans: { renewalsDue7d: number; scheduledVisits: number; atRiskAccounts: number }
  installCapacity: { largeInstallsActive: number; crewsAssigned: number; pendingPermits: number }
}
type Opportunity = { id: string; company: string; contact: string; stage: string; value: number; createdDate: string; updatedDate: string; source: string; notes?: string[] }

const emergencyQueue = ref<EmergencyJob[]>(JSON.parse(JSON.stringify(emergencySeed)))
const installJobs = ref<ProjectJob[]>(JSON.parse(JSON.stringify(installSeed)))
const dashboardStats = ref<DashboardStats>(JSON.parse(JSON.stringify(dashboardStatsSeed)))
const opportunities = ref<Opportunity[]>(JSON.parse(JSON.stringify(opportunitiesSeed)))

const currentView = ref<'dashboard' | 'jobs' | 'crm'>('dashboard')
const selectedOpportunity = ref<Opportunity | null>(null)
const selectedJob = ref<any>(null)

const route = useRoute()
const router = useRouter()

const recentOpportunities = computed(() => [...opportunities.value].sort((a, b) => b.updatedDate.localeCompare(a.updatedDate)).slice(0, 5))

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

function opportunityStageClassFor(stage: string) {
  if (/won/i.test(stage)) return 'bg-emerald-100 text-emerald-700'
  if (/proposal/i.test(stage)) return 'bg-blue-100 text-blue-700'
  if (/lost/i.test(stage)) return 'bg-rose-100 text-rose-700'
  return 'bg-amber-100 text-amber-700'
}

function recomputeQuoteStats() {
  const quotesSent = opportunities.value.length
  const won = opportunities.value.filter((o) => /won/i.test(o.stage)).length
  const conversion = quotesSent ? Math.round((won / quotesSent) * 100) : 0
  dashboardStats.value.quoteConversion = { quotesSent, won, conversion }
}

onMounted(() => {
  recomputeQuoteStats()
  const qv = String(route.query.view || 'dashboard')
  if (qv === 'jobs' || qv === 'crm' || qv === 'dashboard') currentView.value = qv
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
