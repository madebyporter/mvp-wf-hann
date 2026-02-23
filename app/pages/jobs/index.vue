<template>
  <div class="flex flex-col gap-4">
    <NuxtLink to="/" class="text-sm text-blue-700 hover:underline">← Back to dashboard</NuxtLink>

    <div class="rounded-xl border p-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold">Emergency Queue (24/7)</h2>
        <span class="text-xs text-slate-400">All {{ emergencyQueue.length }} jobs</span>
      </div>
      <div class="mt-4 space-y-2">
        <NuxtLink v-for="item in emergencyQueue" :key="item.ticket" :to="`/jobs/emergency/${item.ticket}`" class="w-full text-left rounded-lg border border-black/20 p-3 flex justify-between items-center hover:bg-slate-50">
          <div>
            <p class="font-medium">{{ item.ticket }} — {{ item.issue }}</p>
            <p class="text-sm text-slate-600">{{ item.city }} · ETA target {{ item.eta }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-1 rounded" :class="item.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ item.priority }}</span>
            <span class="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{{ item.status }}</span>
          </div>
        </NuxtLink>
      </div>
    </div>

    <div class="rounded-xl border p-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold">Commercial / Non-Emergency Install Pipeline</h2>
        <span class="text-xs text-slate-400">All {{ installJobs.length }} projects</span>
      </div>
      <div class="mt-4 space-y-2">
        <NuxtLink v-for="job in installJobs" :key="job.id" :to="`/jobs/projects/${job.id}`" class="w-full text-left rounded-lg border border-black/20 p-3 flex justify-between items-center hover:bg-slate-50">
          <div>
            <p class="font-medium">{{ job.id }} — {{ job.client }}</p>
            <p class="text-sm text-slate-600">{{ job.scope }} · {{ job.location }}</p>
          </div>
          <span class="text-xs px-2 py-1 rounded shrink-0" :class="job.stageClass">{{ job.stage }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import emergencySeed from '~/data/emergencyQueue.json'
import installSeed from '~/data/installJobs.json'

const emergencyQueue = ref(Array.isArray(emergencySeed) ? emergencySeed : [])
const installJobs = ref(Array.isArray(installSeed) ? installSeed : [])
</script>
