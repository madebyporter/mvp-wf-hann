<template>
  <div class="h-dvh max-h-dvh flex flex-col overflow-hidden bg-white text-slate-900">
    <header class="border-b shrink-0">
      <div class="w-full px-6 py-4 flex items-center justify-between gap-4">
        <div class="brand">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">W.F. Hann & Sons MVP</p>
          <h1 class="text-xl font-semibold">Service Plan + Emergency + Install Ops Hub</h1>
        </div>
        <div class="nav flex gap-2 items-center">
          <NuxtLink to="/?view=dashboard" class="rounded-lg px-4 py-2 text-sm font-medium border" :class="navClass('dashboard')">Dashboard</NuxtLink>
          <NuxtLink to="/?view=jobs" class="rounded-lg px-4 py-2 text-sm font-medium border" :class="navClass('jobs')">Jobs</NuxtLink>
          <NuxtLink to="/?view=crm" class="rounded-lg px-4 py-2 text-sm font-medium border" :class="navClass('crm')">CRM</NuxtLink>
          <button class="rounded-lg px-4 py-2 text-white font-medium" style="background:#112337">Dispatch Emergency</button>
        </div>
      </div>
    </header>

    <main class="main flex-1 min-h-0 overflow-hidden">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

function navClass(view: 'dashboard' | 'jobs' | 'crm') {
  const active = (route.query.view as string) || 'dashboard'
  return active === view
    ? 'border-slate-900 bg-slate-900 text-white'
    : 'border-slate-300 hover:bg-slate-50'
}
</script>
