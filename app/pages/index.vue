<template>
  <div class="space-y-6">
    <template v-if="selectedJob">
      <button type="button" class="text-sm text-blue-700 hover:underline" @click="selectedJob = null">← Back</button>
      <div class="rounded-xl border border-black bg-white p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">{{ detailTitle }}</h2>
          <span v-if="selectedJob.priority" class="text-xs px-2 py-1 rounded" :class="selectedJob.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ selectedJob.priority }}</span>
          <span v-else class="text-xs px-2 py-1 rounded" :class="selectedJob.stageClass">{{ selectedJob.stage }}</span>
        </div>
        <div class="mt-4 grid md:grid-cols-2 gap-6 text-sm">
          <div class="space-y-2">
            <p><span class="text-slate-500">Location</span><br><strong class="text-slate-900">{{ selectedJob.city || selectedJob.location }}</strong></p>
            <p v-if="selectedJob.issue"><span class="text-slate-500">Issue</span><br><strong class="text-slate-900">{{ selectedJob.issue }}</strong></p>
            <p v-if="selectedJob.scope"><span class="text-slate-500">Scope</span><br><strong class="text-slate-900">{{ selectedJob.scope }}</strong></p>
          </div>
          <div class="space-y-2">
            <p v-if="selectedJob.eta"><span class="text-slate-500">ETA target</span><br><strong class="text-slate-900">{{ selectedJob.eta }}</strong></p>
            <p v-if="selectedJob.status"><span class="text-slate-500">Dispatch status</span><br><strong class="text-slate-900">{{ selectedJob.status }}</strong></p>
            <p v-if="selectedJob.stage"><span class="text-slate-500">Project stage</span><br><strong class="text-slate-900">{{ selectedJob.stage }}</strong></p>
          </div>
        </div>
      </div>
      <div v-if="selectedJob.id && selectedJob.notes?.length" class="rounded-xl border border-black bg-white p-6">
        <h3 class="font-semibold text-slate-900">Project notes timeline</h3>
        <ul class="mt-3 space-y-2 text-sm text-slate-700">
          <li v-for="(note, idx) in selectedJob.notes" :key="idx" class="flex gap-2">
            <span class="text-slate-400">•</span>
            <span>{{ note }}</span>
          </li>
        </ul>
      </div>
    </template>

    <template v-else>
      <!-- Jobs module: one container with black stroke, "Jobs" title, each entry with black stroke -->
      <div class="rounded-xl border border-black bg-white p-6">
        <h2 class="text-lg font-semibold text-slate-900">Jobs</h2>
        <div class="flex items-center justify-between gap-3 mt-4">
          <h3 class="font-semibold text-slate-900">Emergency Queue (24/7)</h3>
          <NuxtLink to="/jobs" class="text-sm text-blue-700 hover:underline">View all jobs</NuxtLink>
        </div>
        <p class="mt-1 text-xs text-slate-500">Priority response</p>
        <div class="mt-4 space-y-3">
          <button v-for="item in emergencyQueue" :key="item.ticket" type="button" class="w-full text-left rounded-lg border border-black/20 bg-white p-3 flex justify-between items-center hover:bg-slate-50 transition-colors" @click="openEmergency(item.ticket)">
            <div>
              <p class="font-medium text-slate-900">{{ item.ticket }} — {{ item.issue }}</p>
              <p class="text-sm text-slate-600">{{ item.city }} · ETA target {{ item.eta }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs px-2 py-1 rounded" :class="item.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ item.priority }}</span>
              <span class="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{{ item.status }}</span>
            </div>
          </button>
        </div>

        <h3 class="mt-8 font-semibold text-slate-900">Commercial / Non-Emergency Install Pipeline</h3>
        <p class="mt-1 text-xs text-slate-500">Scheduled projects</p>
        <div class="mt-4 space-y-3">
          <button v-for="job in installJobs" :key="job.id" type="button" class="w-full text-left rounded-lg border border-black/20 bg-white p-3 flex justify-between items-center hover:bg-slate-50 transition-colors" @click="openProject(job.id)">
            <div>
              <p class="font-medium text-slate-900">{{ job.id }} — {{ job.client }}</p>
              <p class="text-sm text-slate-600">{{ job.scope }} · {{ job.location }}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded shrink-0" :class="job.stageClass">{{ job.stage }}</span>
          </button>
        </div>
      </div>

      <!-- CRM section: one wrapper (1px solid black), stats + recent 5 deals inside, no strokes on subsections -->
      <div v-if="currentView === 'dashboard'" class="rounded-xl border border-black bg-white p-6">
        <h2 class="text-lg font-semibold text-slate-900">CRM</h2>
        <p class="mt-1 text-sm text-slate-500">Quote → Job Conversion</p>
        <div class="mt-4 grid sm:grid-cols-3 gap-3">
          <div class="rounded-lg bg-slate-100 p-4 text-center"><p class="text-2xl font-bold text-slate-900">{{ dashboardStats.quoteConversion.quotesSent }}</p><p class="text-sm text-slate-600">Quotes Sent</p></div>
          <div class="rounded-lg bg-slate-100 p-4 text-center"><p class="text-2xl font-bold text-slate-900">{{ dashboardStats.quoteConversion.won }}</p><p class="text-sm text-slate-600">Won</p></div>
          <div class="rounded-lg bg-slate-100 p-4 text-center"><p class="text-2xl font-bold text-slate-900">{{ dashboardStats.quoteConversion.conversion }}%</p><p class="text-sm text-slate-600">Conversion</p></div>
        </div>
        <div class="mt-8 flex items-center justify-between">
          <h3 class="font-semibold text-slate-900">Most recent opportunities</h3>
          <NuxtLink to="/crm" class="text-sm text-blue-700 hover:underline">View all</NuxtLink>
        </div>
        <div class="mt-4 space-y-3">
          <NuxtLink v-for="opp in recentOpportunities" :key="opp.id" :to="`/crm/${opp.id}`" class="w-full text-left rounded-lg bg-white p-3 flex justify-between items-center hover:bg-slate-50 transition-colors border border-black/20">
            <div>
              <p class="font-medium text-slate-900">{{ opp.id }} — {{ opp.company }}</p>
              <p class="text-sm text-slate-600">{{ opp.updatedDate }} · USD {{ opp.value.toLocaleString() }}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded shrink-0" :class="opportunityStageClassFor(opp.stage)">{{ opp.stage }}</span>
          </NuxtLink>
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

const currentView = ref<'dashboard' | 'jobs'>('dashboard')
const selectedJob = ref<any>(null)

const route = useRoute()
const router = useRouter()

const recentOpportunities = computed(() => [...opportunities.value].sort((a, b) => b.updatedDate.localeCompare(a.updatedDate)).slice(0, 5))

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

function openView(view: 'dashboard' | 'jobs') {
  currentView.value = view
  selectedJob.value = null
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
  syncViewFromRoute()
})

// When route path is /, reset to full dashboard so Jobs + CRM show (e.g. back from /crm/123)
watch(() => route.path, (path) => {
  if (path === '/') syncViewFromRoute()
})

watch(() => route.query.view, () => syncViewFromRoute())

function syncViewFromRoute() {
  if (route.path !== '/') return
  const view = String(route.query.view || 'dashboard')
  // Only dashboard and jobs are valid on index; crm lives at /crm
  if (view === 'jobs' || view === 'dashboard') {
    currentView.value = view
    selectedJob.value = null
  } else {
    currentView.value = 'dashboard'
    selectedJob.value = null
  }
}
</script>
