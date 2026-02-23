<template>
  <div class="space-y-4">
    <NuxtLink to="/" class="text-sm text-blue-700 hover:underline">← Back to dashboard</NuxtLink>

    <div class="rounded-xl border p-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold">Emergency Job Detail — {{ job.id }}</h2>
        <span class="text-xs px-2 py-1 rounded" :class="job.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ job.priority }}</span>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-2 text-sm">
        <div><p class="text-slate-500">Issue</p><p class="font-medium">{{ job.issue }}</p></div>
        <div><p class="text-slate-500">Customer</p><p class="font-medium">{{ job.customer }}</p></div>
        <div><p class="text-slate-500">Location</p><p class="font-medium">{{ job.location }}</p></div>
        <div><p class="text-slate-500">ETA target</p><p class="font-medium">{{ job.eta }}</p></div>
        <div><p class="text-slate-500">Assigned crew</p><p class="font-medium">{{ job.crew }}</p></div>
        <div><p class="text-slate-500">Dispatch status</p><p class="font-medium">{{ job.status }}</p></div>
      </div>
    </div>

    <div class="rounded-xl border p-5">
      <h3 class="font-semibold">Recommended next actions</h3>
      <ul class="mt-3 list-disc pl-5 space-y-1 text-sm text-slate-700">
        <li>Send automated ETA update to customer + office coordinator.</li>
        <li>Pre-stage likely parts based on issue profile to reduce second truck rolls.</li>
        <li>Attach photos and technician notes to closeout packet for QA.</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const emergencyMap: Record<string, any> = {
  'EM-2041': {
    id: 'EM-2041',
    issue: 'No heat',
    customer: 'M. Cooper',
    location: 'Parma',
    eta: '45 min',
    crew: 'Crew A3',
    status: 'En route',
    priority: 'High'
  },
  'EM-2042': {
    id: 'EM-2042',
    issue: 'Burst pipe',
    customer: 'Lakeside Retail Plaza',
    location: 'Lakewood',
    eta: '60 min',
    crew: 'Crew B1',
    status: 'Stabilization in progress',
    priority: 'High'
  },
  'EM-2043': {
    id: 'EM-2043',
    issue: 'Boiler reset',
    customer: 'Apex Dental Group',
    location: 'Strongsville',
    eta: '90 min',
    crew: 'Crew C2',
    status: 'Awaiting parts check',
    priority: 'Med'
  }
}

const id = String(route.params.id)
const job = emergencyMap[id] ?? {
  id,
  issue: 'Emergency call',
  customer: 'Unknown customer',
  location: 'TBD',
  eta: 'TBD',
  crew: 'Unassigned',
  status: 'Needs dispatch',
  priority: 'Med'
}
</script>
