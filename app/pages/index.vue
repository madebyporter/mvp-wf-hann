<template>
  <div class="grid gap-6 lg:grid-cols-3">
    <section class="lg:col-span-2 space-y-4">
      <div class="rounded-xl border p-5">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold">Emergency Queue (24/7)</h2>
          <span class="text-xs px-2 py-1 rounded bg-rose-100 text-rose-700">Priority response</span>
        </div>
        <div class="mt-4 space-y-2">
          <NuxtLink
            v-for="item in emergencyQueue"
            :key="item.ticket"
            :to="`/jobs/emergency/${item.ticket}`"
            class="rounded-lg border p-3 flex justify-between items-center hover:bg-slate-50"
          >
            <div>
              <p class="font-medium">{{ item.ticket }} — {{ item.issue }}</p>
              <p class="text-sm text-slate-600">{{ item.city }} · ETA target {{ item.eta }}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded" :class="item.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ item.priority }}</span>
          </NuxtLink>
        </div>
      </div>

      <div class="rounded-xl border p-5">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold">Commercial / Non-Emergency Install Pipeline</h2>
          <span class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">Scheduled projects</span>
        </div>
        <div class="mt-4 space-y-2">
          <NuxtLink
            v-for="job in installJobs"
            :key="job.id"
            :to="`/jobs/projects/${job.id}`"
            class="rounded-lg border p-3 flex justify-between items-center hover:bg-slate-50"
          >
            <div>
              <p class="font-medium">{{ job.id }} — {{ job.client }}</p>
              <p class="text-sm text-slate-600">{{ job.scope }} · {{ job.location }}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded" :class="job.stageClass">{{ job.stage }}</span>
          </NuxtLink>
        </div>
      </div>

      <div class="rounded-xl border p-5">
        <h2 class="font-semibold">Quote → Job Conversion</h2>
        <div class="mt-4 grid sm:grid-cols-3 gap-3 text-center">
          <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">31</p><p class="text-sm text-slate-600">Quotes Sent</p></div>
          <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">19</p><p class="text-sm text-slate-600">Won</p></div>
          <div class="rounded-lg bg-slate-50 p-4"><p class="text-2xl font-bold">61%</p><p class="text-sm text-slate-600">Conversion</p></div>
        </div>
      </div>
    </section>

    <aside class="space-y-4">
      <div class="rounded-xl border p-5">
        <h2 class="font-semibold">Home Service Plans</h2>
        <ul class="mt-3 space-y-2 text-sm">
          <li class="flex justify-between"><span>Renewals due (7d)</span><strong>46</strong></li>
          <li class="flex justify-between"><span>Scheduled visits</span><strong>28</strong></li>
          <li class="flex justify-between"><span>At-risk accounts</span><strong>9</strong></li>
        </ul>
      </div>

      <div class="rounded-xl border p-5">
        <h2 class="font-semibold">Install Capacity Snapshot</h2>
        <ul class="mt-3 space-y-2 text-sm">
          <li class="flex justify-between"><span>Large installs active</span><strong>7</strong></li>
          <li class="flex justify-between"><span>Crews assigned</span><strong>11</strong></li>
          <li class="flex justify-between"><span>Pending permits</span><strong>3</strong></li>
        </ul>
      </div>

      <div class="rounded-xl p-5 text-white" style="background:#204CE5">
        <h3 class="font-semibold">Legacy Workflow Alert</h3>
        <p class="mt-2 text-sm">12 jobs still awaiting manual office handoff. Auto-routing can remove this bottleneck.</p>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
const emergencyQueue = [
  { ticket: 'EM-2041', issue: 'No heat', city: 'Parma', eta: '45 min', priority: 'High' },
  { ticket: 'EM-2042', issue: 'Burst pipe', city: 'Lakewood', eta: '60 min', priority: 'High' },
  { ticket: 'EM-2043', issue: 'Boiler reset', city: 'Strongsville', eta: '90 min', priority: 'Med' }
]

const installJobs = [
  {
    id: 'PRJ-4101',
    client: 'Westlake Medical Campus',
    scope: 'Rooftop unit replacement + controls retrofit',
    location: 'Westlake',
    stage: 'In Progress',
    stageClass: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'PRJ-4102',
    client: 'Parma Logistics Center',
    scope: 'Boiler room modernization + balancing',
    location: 'Parma',
    stage: 'Awaiting Permit',
    stageClass: 'bg-amber-100 text-amber-700'
  },
  {
    id: 'PRJ-4103',
    client: 'Lakewood School District',
    scope: 'Chiller controls upgrade + commissioning',
    location: 'Lakewood',
    stage: 'Scheduled',
    stageClass: 'bg-emerald-100 text-emerald-700'
  }
]
</script>
