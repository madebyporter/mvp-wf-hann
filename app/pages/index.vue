<template>
  <div class="space-y-6">
    <div class="rounded-xl border border-black bg-white p-6">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <h2 class="text-lg font-semibold text-slate-900">Jobs</h2>
          <div class="flex items-center gap-2">
            <NuxtLink to="/jobs" class="text-sm text-blue-700 hover:underline">View all jobs</NuxtLink>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              @click="showNewJobModal = true"
            >
              New job
            </button>
          </div>
        </div>
        <div class="flex items-center justify-between gap-3 mt-4">
          <h3 class="font-semibold text-slate-900">Emergency Queue (24/7)</h3>
        </div>
        <p class="mt-1 text-xs text-slate-500">Priority response</p>
        <div class="mt-4 space-y-3">
          <NuxtLink
            v-for="item in emergencyQueue"
            :key="item.ticket"
            :to="`/jobs/emergency/${item.ticket}`"
            class="w-full text-left rounded-lg border border-black/20 bg-white p-3 flex justify-between items-center hover:bg-slate-50 transition-colors"
          >
            <div>
              <p class="font-medium text-slate-900">{{ item.ticket }} — {{ item.issue }}</p>
              <p class="text-sm text-slate-600">{{ item.city }} · ETA target {{ item.eta }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs px-2 py-1 rounded" :class="item.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ item.priority }}</span>
              <span class="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{{ item.status }}</span>
            </div>
          </NuxtLink>
        </div>

        <h3 class="mt-8 font-semibold text-slate-900">Commercial / Non-Emergency Install Pipeline</h3>
        <p class="mt-1 text-xs text-slate-500">Scheduled projects</p>
        <div class="mt-4 space-y-3">
          <NuxtLink
            v-for="job in installJobs"
            :key="job.id"
            :to="`/jobs/projects/${job.id}`"
            class="w-full text-left rounded-lg border border-black/20 bg-white p-3 flex justify-between items-center hover:bg-slate-50 transition-colors"
          >
            <div>
              <p class="font-medium text-slate-900">{{ job.id }} — {{ job.client }}</p>
              <p class="text-sm text-slate-600">{{ job.scope }} · {{ job.location }}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded shrink-0" :class="job.stageClass">{{ job.stage }}</span>
          </NuxtLink>
        </div>
      </div>

      <div v-if="currentView === 'dashboard'" class="rounded-xl border border-black bg-white p-6">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">CRM</h2>
            <p class="mt-1 text-sm text-slate-500">Quote → Job Conversion</p>
          </div>
          <div class="flex items-center gap-2">
            <NuxtLink to="/crm" class="text-sm text-blue-700 hover:underline">View all deals</NuxtLink>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              @click="showNewDealModal = true"
            >
              New deal
            </button>
          </div>
        </div>
        <div class="mt-4 grid sm:grid-cols-3 gap-3">
          <div class="rounded-lg bg-slate-100 p-4 text-center"><p class="text-2xl font-bold text-slate-900">{{ dashboardStats.quoteConversion.quotesSent }}</p><p class="text-sm text-slate-600">Quotes Sent</p></div>
          <div class="rounded-lg bg-slate-100 p-4 text-center"><p class="text-2xl font-bold text-slate-900">{{ dashboardStats.quoteConversion.won }}</p><p class="text-sm text-slate-600">Won</p></div>
          <div class="rounded-lg bg-slate-100 p-4 text-center"><p class="text-2xl font-bold text-slate-900">{{ dashboardStats.quoteConversion.conversion }}%</p><p class="text-sm text-slate-600">Conversion</p></div>
        </div>
        <div class="mt-8">
          <h3 class="font-semibold text-slate-900">Most recent opportunities</h3>
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

    <!-- New Job modal (dashboard) -->
    <Teleport to="body">
      <div
        v-if="showNewJobModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="showNewJobModal = false"
      >
        <div class="rounded-xl border bg-white p-6 w-full max-w-md shadow-xl space-y-4">
          <h3 class="font-semibold text-lg">New job (commercial / install)</h3>
          <form class="space-y-3" @submit.prevent="submitNewJob">
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Client *</label>
              <input v-model="newJobForm.client" type="text" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. Westlake Medical Campus" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Scope *</label>
              <input v-model="newJobForm.scope" type="text" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. Rooftop unit replacement + controls" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Location *</label>
              <input v-model="newJobForm.location" type="text" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. Westlake, Parma" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Stage</label>
              <select v-model="newJobForm.stage" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="Planned">Planned</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Awaiting Permit">Awaiting Permit</option>
                <option value="On Hold">On Hold</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50" @click="showNewJobModal = false">
                Cancel
              </button>
              <button type="submit" class="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm">
                Create job
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- New Deal modal (dashboard) -->
    <Teleport to="body">
      <div
        v-if="showNewDealModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="showNewDealModal = false"
      >
        <div class="rounded-xl border bg-white p-6 w-full max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
          <h3 class="font-semibold text-lg">New deal</h3>
          <form class="space-y-3" @submit.prevent="submitNewDeal">
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Client name *</label>
              <input v-model="newDealForm.clientName" type="text" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. Lakewood School District" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                <input v-model="newDealForm.phone" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input v-model="newDealForm.email" type="email" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Address</label>
              <input v-model="newDealForm.address" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Deal title *</label>
              <input v-model="newDealForm.dealTitle" type="text" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. HVAC upgrade 2026" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Deal amount (USD)</label>
              <input v-model.number="newDealForm.dealAmount" type="number" step="0.01" min="0" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Deal stage</label>
              <select v-model="newDealForm.dealStage" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="Lead">Lead</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Service plan tier</label>
              <select v-model="newDealForm.servicePlanTier" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="None">None</option>
                <option value="Basic">Basic</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Renewal due (days)</label>
              <input v-model.number="newDealForm.renewalDueInDays" type="number" min="0" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="optional" />
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50" @click="showNewDealModal = false">
                Cancel
              </button>
              <button type="submit" class="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm">
                Create deal
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { DealStage, ServicePlanTier } from '~/types/demo'
import { computed, ref, watch } from 'vue'

const router = useRouter()
const { state, createDealMutation, createProjectJobMutation } = useDemoState()
const { showToast } = useToast()

const emergencyQueue = computed(() =>
  [...state.value.jobs.emergency].sort((a, b) =>
    (b.createdAt ?? b.ticket).localeCompare(a.createdAt ?? a.ticket)
  )
)
const installJobs = computed(() =>
  [...state.value.jobs.install].sort((a, b) =>
    (b.createdAt ?? b.id).localeCompare(a.createdAt ?? a.id)
  )
)
const dashboardStats = computed(() => state.value.dashboardStats)

const recentOpportunities = computed(() => {
  const deals = [...state.value.deals]
  const clients = state.value.clients
  return deals
    .sort((a, b) => b.updatedDate.localeCompare(a.updatedDate))
    .slice(0, 5)
    .map((d) => {
      const client = clients.find((c) => c.id === d.clientId)
      return {
        id: d.id,
        company: d.dealTitle || client?.name || d.clientId,
        stage: d.dealStage,
        value: d.dealAmount ?? 0,
        updatedDate: d.updatedDate
      }
    })
})

const currentView = ref<'dashboard' | 'jobs'>('dashboard')

const showNewJobModal = ref(false)
const showNewDealModal = ref(false)
const newJobForm = ref({
  client: '',
  scope: '',
  location: '',
  stage: 'Planned'
})
const newDealForm = ref({
  clientName: '',
  phone: '',
  email: '',
  address: '',
  dealTitle: '',
  dealAmount: undefined as number | undefined,
  dealStage: 'Lead' as DealStage,
  servicePlanTier: 'None' as ServicePlanTier,
  renewalDueInDays: undefined as number | undefined
})

const route = useRoute()

function opportunityStageClassFor(stage: string) {
  if (/won/i.test(stage)) return 'bg-emerald-100 text-emerald-700'
  if (/proposal/i.test(stage)) return 'bg-blue-100 text-blue-700'
  if (/lost/i.test(stage)) return 'bg-rose-100 text-rose-700'
  return 'bg-amber-100 text-amber-700'
}

function submitNewJob() {
  const { jobId } = createProjectJobMutation(
    {
      client: newJobForm.value.client,
      scope: newJobForm.value.scope,
      location: newJobForm.value.location,
      stage: newJobForm.value.stage
    },
    { showToast }
  )
  showNewJobModal.value = false
  newJobForm.value = { client: '', scope: '', location: '', stage: 'Planned' }
  if (jobId) router.push(`/jobs/projects/${jobId}`)
}

function submitNewDeal() {
  const { dealId } = createDealMutation(
    {
      clientName: newDealForm.value.clientName,
      phone: newDealForm.value.phone || undefined,
      email: newDealForm.value.email || undefined,
      address: newDealForm.value.address || undefined,
      dealTitle: newDealForm.value.dealTitle,
      dealAmount: newDealForm.value.dealAmount,
      dealStage: newDealForm.value.dealStage,
      servicePlanTier: newDealForm.value.servicePlanTier,
      renewalDueInDays: newDealForm.value.renewalDueInDays
    },
    { showToast }
  )
  showNewDealModal.value = false
  newDealForm.value = {
    clientName: '',
    phone: '',
    email: '',
    address: '',
    dealTitle: '',
    dealAmount: undefined,
    dealStage: 'Lead',
    servicePlanTier: 'None',
    renewalDueInDays: undefined
  }
  if (dealId) router.push(`/crm/${dealId}`)
}

function syncViewFromRoute() {
  if (route.path !== '/') return
  const view = String(route.query.view || 'dashboard')
  if (view === 'jobs' || view === 'dashboard') {
    currentView.value = view
  } else {
    currentView.value = 'dashboard'
  }
}

watch(() => route.path, (path) => {
  if (path === '/') syncViewFromRoute()
})
watch(() => route.query.view, syncViewFromRoute)
onMounted(syncViewFromRoute)
</script>
