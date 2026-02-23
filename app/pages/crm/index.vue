<template>
  <div class="flex flex-col gap-4">
    <NuxtLink to="/" class="text-sm text-blue-700 hover:underline">← Back to dashboard</NuxtLink>

    <div class="rounded-xl border p-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold">All opportunities</h2>
        <span class="text-xs text-slate-400">{{ opportunities.length }} quotes sent</span>
      </div>
      <div class="mt-4 space-y-2">
        <NuxtLink v-for="opp in opportunities" :key="opp.id" :to="`/crm/${opp.id}`" class="w-full text-left rounded-lg border p-3 flex justify-between items-center hover:bg-slate-50">
          <div>
            <p class="font-medium">{{ opp.id }} — {{ opp.company }}</p>
            <p class="text-sm text-slate-600">{{ opp.updatedDate }} · USD {{ opp.value.toLocaleString() }}</p>
          </div>
          <span class="text-xs px-2 py-1 rounded shrink-0" :class="stageClass(opp.stage)">{{ opp.stage }}</span>
        </NuxtLink>
      </div>
    </div>
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

const opportunities = ref<Opportunity[]>(Array.isArray(opportunitiesSeed) ? opportunitiesSeed : [])

function stageClass(stage: string) {
  if (/won/i.test(stage)) return 'bg-emerald-100 text-emerald-700'
  if (/proposal/i.test(stage)) return 'bg-blue-100 text-blue-700'
  if (/lost/i.test(stage)) return 'bg-rose-100 text-rose-700'
  return 'bg-amber-100 text-amber-700'
}
</script>
