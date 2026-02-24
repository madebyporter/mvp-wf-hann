<template>
  <div class="crm-page">
    <div class="flex flex-col gap-4">
    <NuxtLink to="/" class="text-sm text-blue-700 hover:underline">← Back to dashboard</NuxtLink>

    <div class="rounded-xl border p-5">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <h2 class="font-semibold">All opportunities</h2>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400">{{ deals.length }} quotes sent</span>
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="showNewDealModal = true"
          >
            New Deal
          </button>
        </div>
      </div>
      <div class="mt-4 space-y-2">
        <NuxtLink
          v-for="deal in deals"
          :key="deal.id"
          :to="`/crm/${deal.id}`"
          class="w-full text-left rounded-lg border border-black/20 p-3 flex justify-between items-center hover:bg-slate-50"
        >
          <div>
            <p class="font-medium">{{ deal.id }} — {{ dealTitle(deal) }}</p>
            <p class="text-sm text-slate-600">{{ deal.updatedDate }} · USD {{ (deal.dealAmount ?? 0).toLocaleString() }}</p>
          </div>
          <span class="text-xs px-2 py-1 rounded shrink-0" :class="stageClass(deal.dealStage)">{{ deal.dealStage }}</span>
        </NuxtLink>
      </div>
    </div>

    <!-- New Deal modal -->
    </div>
    <Teleport to="body">
      <div
        v-if="showNewDealModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="showNewDealModal = false"
      >
        <div class="rounded-xl border bg-white p-6 w-full max-w-md shadow-xl space-y-4">
          <h3 class="font-semibold text-lg">New Deal</h3>
          <form class="space-y-3" @submit.prevent="submitNewDeal">
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Client name *</label>
              <input v-model="form.clientName" type="text" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. Lakewood School District" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                <input v-model="form.phone" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input v-model="form.email" type="email" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Address</label>
              <input v-model="form.address" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Deal title *</label>
              <input v-model="form.dealTitle" type="text" required class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. HVAC upgrade 2026" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Deal amount (USD)</label>
              <input v-model.number="form.dealAmount" type="number" step="0.01" min="0" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Deal stage</label>
              <select v-model="form.dealStage" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="Lead">Lead</option>
                <option value="Proposal Sent">Proposal Sent</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Service plan tier</label>
              <select v-model="form.servicePlanTier" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="None">None</option>
                <option value="Basic">Basic</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Renewal due (days)</label>
              <input v-model.number="form.renewalDueInDays" type="number" min="0" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="optional" />
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50" @click="showNewDealModal = false">
                Cancel
              </button>
              <button type="submit" class="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm">
                Create Deal
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Deal, DealStage, ServicePlanTier } from '~/types/demo'

const { state, createDealMutation } = useDemoState()
const { showToast } = useToast()

const showNewDealModal = ref(false)
const form = ref({
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

const deals = computed(() => state.value.deals)

function dealTitle(deal: Deal) {
  const client = state.value.clients.find((c) => c.id === deal.clientId)
  return deal.dealTitle || client?.name || deal.clientId
}

function stageClass(stage: string) {
  if (/won/i.test(stage)) return 'bg-emerald-100 text-emerald-700'
  if (/proposal/i.test(stage)) return 'bg-blue-100 text-blue-700'
  if (/lost/i.test(stage)) return 'bg-rose-100 text-rose-700'
  return 'bg-amber-100 text-amber-700'
}

function submitNewDeal() {
  createDealMutation(
    {
      clientName: form.value.clientName,
      phone: form.value.phone || undefined,
      email: form.value.email || undefined,
      address: form.value.address || undefined,
      dealTitle: form.value.dealTitle,
      dealAmount: form.value.dealAmount,
      dealStage: form.value.dealStage,
      servicePlanTier: form.value.servicePlanTier,
      renewalDueInDays: form.value.renewalDueInDays
    },
    { showToast }
  )
  showNewDealModal.value = false
  form.value = {
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
}
</script>
