<template>
  <div class="min-h-screen bg-white text-slate-900">
    <header class="border-b">
      <div class="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">W.F. Hann & Sons MVP</p>
          <h1 class="text-xl font-semibold">Service Plan + Emergency Ops Hub</h1>
        </div>
        <button class="rounded-lg px-4 py-2 text-white font-medium" style="background:#112337">Dispatch Emergency</button>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-6 py-8 grid gap-6 lg:grid-cols-3">
      <section class="lg:col-span-2 space-y-4">
        <div class="rounded-xl border p-5">
          <h2 class="font-semibold">Emergency Queue (24/7)</h2>
          <div class="mt-4 space-y-2">
            <div v-for="item in queue" :key="item.ticket" class="rounded-lg border p-3 flex justify-between items-center">
              <div>
                <p class="font-medium">{{ item.ticket }} — {{ item.issue }}</p>
                <p class="text-sm text-slate-600">{{ item.city }} · ETA target {{ item.eta }}</p>
              </div>
              <span class="text-xs px-2 py-1 rounded" :class="item.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ item.priority }}</span>
            </div>
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
        <div class="rounded-xl p-5 text-white" style="background:#204CE5">
          <h3 class="font-semibold">Legacy Workflow Alert</h3>
          <p class="mt-2 text-sm">12 jobs still awaiting manual office handoff. Auto-routing can remove this bottleneck.</p>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
const queue = [
  { ticket: 'EM-2041', issue: 'No heat', city: 'Parma', eta: '45 min', priority: 'High' },
  { ticket: 'EM-2042', issue: 'Burst pipe', city: 'Lakewood', eta: '60 min', priority: 'High' },
  { ticket: 'EM-2043', issue: 'Boiler reset', city: 'Strongsville', eta: '90 min', priority: 'Med' }
]
</script>
