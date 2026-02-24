<template>
  <div class="flex flex-col gap-4">
    <NuxtLink to="/crm" class="text-sm text-blue-700 hover:underline">← Back to CRM</NuxtLink>

    <div v-if="deal" class="rounded-xl border p-5">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">Opportunity — {{ deal.id }}</h2>
        <span class="text-xs px-2 py-1 rounded" :class="stageClass(deal.dealStage)">{{ deal.dealStage }}</span>
      </div>
      <div class="mt-4 grid gap-4 md:grid-cols-2 text-sm">
        <div><p class="text-slate-500">Company</p><p class="font-medium">{{ clientName }}</p></div>
        <div><p class="text-slate-500">Deal title</p><p class="font-medium">{{ deal.dealTitle }}</p></div>
        <div><p class="text-slate-500">Source</p><p class="font-medium">{{ deal.source ?? '—' }}</p></div>
        <div><p class="text-slate-500">Created</p><p class="font-medium">{{ deal.createdDate }}</p></div>
        <div><p class="text-slate-500">Last update</p><p class="font-medium">{{ deal.updatedDate }}</p></div>
        <div><p class="text-slate-500">Value</p><p class="font-medium">${{ (deal.dealAmount ?? 0).toLocaleString() }}</p></div>
        <div><p class="text-slate-500">Service plan</p><p class="font-medium">{{ deal.servicePlanTier }}</p></div>
        <div v-if="deal.renewalDueInDays != null"><p class="text-slate-500">Renewal due</p><p class="font-medium">{{ deal.renewalDueInDays }} days</p></div>
      </div>
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
const route = useRoute()
const { state } = useDemoState()
const id = String(route.params.id)

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
</script>
