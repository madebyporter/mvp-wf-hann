<template>
  <div class="flex flex-col gap-4">
    <NuxtLink to="/jobs" class="text-sm text-blue-700 hover:underline">← Back to jobs</NuxtLink>

    <div v-if="job" class="rounded-xl border p-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold">Emergency Job Detail — {{ job.ticket }}</h2>
        <span class="text-xs px-2 py-1 rounded" :class="job.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ job.priority }}</span>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-2 text-sm">
        <div><p class="text-slate-500">Issue</p><p class="font-medium">{{ job.issue }}</p></div>
        <div><p class="text-slate-500">Location</p><p class="font-medium">{{ job.city }}</p></div>
        <div><p class="text-slate-500">ETA target</p><p class="font-medium">{{ job.eta }}</p></div>
        <div><p class="text-slate-500">Assigned crew</p><p class="font-medium">{{ crewName }}</p></div>
        <div><p class="text-slate-500">Dispatch status</p><p class="font-medium">{{ job.status }}</p></div>
      </div>
    </div>

    <div v-if="job" class="rounded-xl border p-5">
      <h3 class="font-semibold">Recommended next actions</h3>
      <ul class="mt-3 list-disc pl-5 space-y-1 text-sm text-slate-700">
        <li>Send automated ETA update to customer + office coordinator.</li>
        <li>Pre-stage likely parts based on issue profile to reduce second truck rolls.</li>
        <li>Attach photos and technician notes to closeout packet for QA.</li>
      </ul>
    </div>

    <p v-else class="text-slate-500">Job not found.</p>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { state } = useDemoState()

const id = String(route.params.id)
const job = computed(() => state.value.jobs.emergency.find((j) => j.ticket === id) ?? null)
const crewName = computed(() => {
  const j = job.value
  if (!j?.crewId) return 'Unassigned'
  const crew = state.value.crews.find((c) => c.id === j.crewId)
  return crew?.name ?? j.crewId
})
</script>
