<template>
  <div class="flex flex-col gap-4">
    <NuxtLink to="/crm" class="text-sm text-blue-700 hover:underline">← Back to CRM</NuxtLink>

    <div v-if="opportunity" class="rounded-xl border p-5">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">Opportunity — {{ opportunity.id }}</h2>
        <span class="text-xs px-2 py-1 rounded" :class="stageClass(opportunity.stage)">{{ opportunity.stage }}</span>
      </div>
      <div class="mt-4 grid gap-4 md:grid-cols-2 text-sm">
        <div><p class="text-slate-500">Company</p><p class="font-medium">{{ opportunity.company }}</p></div>
        <div><p class="text-slate-500">Contact</p><p class="font-medium">{{ opportunity.contact }}</p></div>
        <div><p class="text-slate-500">Source</p><p class="font-medium">{{ opportunity.source }}</p></div>
        <div><p class="text-slate-500">Created</p><p class="font-medium">{{ opportunity.createdDate }}</p></div>
        <div><p class="text-slate-500">Last update</p><p class="font-medium">{{ opportunity.updatedDate }}</p></div>
        <div><p class="text-slate-500">Value</p><p class="font-medium">${{ opportunity.value.toLocaleString() }}</p></div>
      </div>
    </div>

    <div v-if="opportunity?.notes?.length" class="rounded-xl border p-5">
      <h3 class="font-semibold">Opportunity timeline</h3>
      <ul class="mt-3 space-y-2 text-sm text-slate-700">
        <li v-for="(note, idx) in opportunity.notes" :key="idx" class="flex gap-2"><span class="text-slate-400">•</span><span>{{ note }}</span></li>
      </ul>
    </div>

    <p v-else-if="!opportunity" class="text-slate-500">Opportunity not found.</p>
  </div>
</template>

<script setup lang="ts">
import opportunitiesSeed from '~/data/opportunities.json'

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

const route = useRoute()
const id = String(route.params.id)
const all = Array.isArray(opportunitiesSeed) ? opportunitiesSeed : []
const opportunity = computed(() => all.find((o: Opportunity) => o.id === id) ?? null)

function stageClass(stage: string) {
  if (/won/i.test(stage)) return 'bg-emerald-100 text-emerald-700'
  if (/proposal/i.test(stage)) return 'bg-blue-100 text-blue-700'
  if (/lost/i.test(stage)) return 'bg-rose-100 text-rose-700'
  return 'bg-amber-100 text-amber-700'
}
</script>
