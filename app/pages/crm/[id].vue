<template>
  <div class="flex flex-col gap-4">
    <NuxtLink to="/crm" class="text-sm text-blue-700 hover:underline">← Back to CRM</NuxtLink>

    <div v-if="deal" class="rounded-xl border p-5">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <h2 class="font-semibold">Opportunity — {{ deal.id }}</h2>
        <div class="flex items-center gap-2">
          <span v-if="!editing" class="text-xs px-2 py-1 rounded" :class="stageClass(deal.dealStage)">{{ deal.dealStage }}</span>
          <button
            v-if="!editing"
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="startEdit"
          >
            Edit
          </button>
          <template v-else>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              @click="cancelEdit"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              @click="saveDeal"
            >
              Save
            </button>
          </template>
          <button
            v-if="!editing && deal.dealStage === 'Won' && !deal.projectJobId"
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="convertToJob"
          >
            Convert to job
          </button>
          <NuxtLink
            v-else-if="!editing && deal.projectJobId"
            :to="`/jobs/projects/${deal.projectJobId}`"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View job {{ deal.projectJobId }}
          </NuxtLink>
        </div>
      </div>

      <div v-if="!editing" class="mt-4 grid gap-4 md:grid-cols-2 text-sm">
        <div><p class="text-slate-500">Company</p><p class="font-medium">{{ clientName }}</p></div>
        <div><p class="text-slate-500">Deal title</p><p class="font-medium">{{ deal.dealTitle }}</p></div>
        <div><p class="text-slate-500">Source</p><p class="font-medium">{{ deal.source ?? '—' }}</p></div>
        <div><p class="text-slate-500">Created</p><p class="font-medium">{{ deal.createdDate }}</p></div>
        <div><p class="text-slate-500">Last update</p><p class="font-medium">{{ deal.updatedDate }}</p></div>
        <div><p class="text-slate-500">Value</p><p class="font-medium">${{ (deal.dealAmount ?? 0).toLocaleString() }}</p></div>
        <div><p class="text-slate-500">Service plan</p><p class="font-medium">{{ deal.servicePlanTier }}</p></div>
        <div v-if="deal.renewalDueInDays != null"><p class="text-slate-500">Renewal due</p><p class="font-medium">{{ deal.renewalDueInDays }} days</p></div>
      </div>

      <form v-else class="mt-4 grid gap-4 md:grid-cols-2 text-sm" @submit.prevent="saveDeal">
        <div class="md:col-span-2"><p class="text-slate-500">Company</p><p class="font-medium">{{ clientName }}</p></div>
        <div>
          <label class="block text-slate-500 mb-1">Deal title</label>
          <input v-model="form.dealTitle" type="text" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Stage</label>
          <select v-model="form.dealStage" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm">
            <option v-for="s in dealStages" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Value ($)</label>
          <input v-model.number="form.dealAmount" type="number" min="0" step="1" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Service plan</label>
          <select v-model="form.servicePlanTier" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm">
            <option v-for="t in serviceTiers" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Renewal due (days)</label>
          <input v-model.number="form.renewalDueInDays" type="number" min="0" placeholder="—" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Source</label>
          <input v-model="form.source" type="text" placeholder="—" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
      </form>
    </div>

    <div v-if="deal?.notes?.length" class="rounded-xl border p-5">
      <h3 class="font-semibold">Opportunity timeline</h3>
      <ul class="mt-3 space-y-2 text-sm text-slate-700">
        <li v-for="(note, idx) in deal.notes" :key="idx" class="flex gap-2"><span class="text-slate-400">•</span><span>{{ note }}</span></li>
      </ul>
    </div>

    <p v-else-if="!deal" class="text-slate-500">Opportunity not found.</p>
  </div>
</template>

<script setup lang="ts">
import type { DealStage, ServicePlanTier } from '~/types/demo'

const route = useRoute()
const { state, convertDealToJobMutation, updateDealMutation } = useDemoState()
const { showToast } = useToast()
const id = String(route.params.id)

const dealStages: DealStage[] = ['Lead', 'Proposal Sent', 'Won', 'Lost']
const serviceTiers: ServicePlanTier[] = ['None', 'Basic', 'Gold', 'Platinum']

const editing = ref(false)
const form = ref<{
  dealTitle: string
  dealAmount: number | undefined
  dealStage: DealStage
  servicePlanTier: ServicePlanTier
  renewalDueInDays: number | undefined
  source: string
}>({
  dealTitle: '',
  dealAmount: undefined,
  dealStage: 'Lead',
  servicePlanTier: 'None',
  renewalDueInDays: undefined,
  source: ''
})

const deal = computed(() => state.value.deals.find((d) => d.id === id) ?? null)
const clientName = computed(() => {
  const d = deal.value
  if (!d) return ''
  const c = state.value.clients.find((x) => x.id === d.clientId)
  return c?.name ?? d.clientId
})

function stageClass(stage: string) {
  if (/won/i.test(stage)) return 'bg-emerald-100 text-emerald-700'
  if (/proposal/i.test(stage)) return 'bg-blue-100 text-blue-700'
  if (/lost/i.test(stage)) return 'bg-rose-100 text-rose-700'
  return 'bg-amber-100 text-amber-700'
}

function startEdit() {
  const d = deal.value
  if (!d) return
  form.value = {
    dealTitle: d.dealTitle,
    dealAmount: d.dealAmount,
    dealStage: d.dealStage,
    servicePlanTier: d.servicePlanTier,
    renewalDueInDays: d.renewalDueInDays,
    source: d.source ?? ''
  }
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

function saveDeal() {
  const d = deal.value
  if (!d) return
  updateDealMutation(
    {
      dealId: d.id,
      dealTitle: form.value.dealTitle,
      dealAmount: form.value.dealAmount,
      dealStage: form.value.dealStage,
      servicePlanTier: form.value.servicePlanTier,
      renewalDueInDays: form.value.renewalDueInDays ?? undefined,
      source: form.value.source.trim() || undefined
    },
    { showToast }
  )
  editing.value = false
}

function convertToJob() {
  if (!deal.value) return
  convertDealToJobMutation({ dealId: deal.value.id }, { showToast })
}
</script>
