<template>
  <div class="space-y-4">
    <NuxtLink to="/" class="text-sm text-blue-700 hover:underline">← Back to dashboard</NuxtLink>

    <div class="rounded-xl border p-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold">Install Project Detail — {{ project.id }}</h2>
        <span class="text-xs px-2 py-1 rounded" :class="project.stageClass">{{ project.stage }}</span>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-2 text-sm">
        <div><p class="text-slate-500">Client</p><p class="font-medium">{{ project.client }}</p></div>
        <div><p class="text-slate-500">Location</p><p class="font-medium">{{ project.location }}</p></div>
        <div><p class="text-slate-500">Scope</p><p class="font-medium">{{ project.scope }}</p></div>
        <div><p class="text-slate-500">Contract value</p><p class="font-medium">{{ project.value }}</p></div>
        <div><p class="text-slate-500">Estimated start</p><p class="font-medium">{{ project.startDate }}</p></div>
        <div><p class="text-slate-500">Project manager</p><p class="font-medium">{{ project.pm }}</p></div>
      </div>
    </div>

    <div class="rounded-xl border p-5">
      <h3 class="font-semibold">Milestone tracker</h3>
      <ul class="mt-3 space-y-2 text-sm">
        <li v-for="m in project.milestones" :key="m.label" class="flex items-center justify-between rounded border px-3 py-2">
          <span>{{ m.label }}</span>
          <span class="text-xs px-2 py-1 rounded" :class="m.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'">{{ m.done ? 'Done' : 'Pending' }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const projectsMap: Record<string, any> = {
  'PRJ-4101': {
    id: 'PRJ-4101',
    client: 'Westlake Medical Campus',
    location: 'Westlake',
    scope: 'Rooftop unit replacement + controls retrofit',
    value: '$184,000',
    startDate: 'Mar 4',
    pm: 'Dana R.',
    stage: 'In Progress',
    stageClass: 'bg-blue-100 text-blue-700',
    milestones: [
      { label: 'Engineering review', done: true },
      { label: 'Equipment delivery', done: true },
      { label: 'Install window', done: false },
      { label: 'Commissioning', done: false }
    ]
  },
  'PRJ-4102': {
    id: 'PRJ-4102',
    client: 'Parma Logistics Center',
    location: 'Parma',
    scope: 'Boiler room modernization + balancing',
    value: '$236,000',
    startDate: 'Mar 18',
    pm: 'Marco T.',
    stage: 'Awaiting Permit',
    stageClass: 'bg-amber-100 text-amber-700',
    milestones: [
      { label: 'Site walk complete', done: true },
      { label: 'Permit approval', done: false },
      { label: 'Crew scheduling', done: false },
      { label: 'Start-up test', done: false }
    ]
  },
  'PRJ-4103': {
    id: 'PRJ-4103',
    client: 'Lakewood School District',
    location: 'Lakewood',
    scope: 'Chiller controls upgrade + commissioning',
    value: '$142,000',
    startDate: 'Apr 2',
    pm: 'Chris B.',
    stage: 'Scheduled',
    stageClass: 'bg-emerald-100 text-emerald-700',
    milestones: [
      { label: 'Procurement', done: true },
      { label: 'Controls panel build', done: false },
      { label: 'Install window', done: false },
      { label: 'Commissioning', done: false }
    ]
  }
}

const id = String(route.params.id)
const project = projectsMap[id] ?? {
  id,
  client: 'Unknown client',
  location: 'TBD',
  scope: 'Non-emergency install',
  value: 'TBD',
  startDate: 'TBD',
  pm: 'Unassigned',
  stage: 'Planned',
  stageClass: 'bg-slate-100 text-slate-700',
  milestones: [
    { label: 'Scope confirmation', done: false },
    { label: 'Scheduling', done: false }
  ]
}
</script>
