<template>
  <div class="min-h-screen bg-white text-slate-900">
    <header class="border-b">
      <div class="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">W.F. Hann & Sons MVP</p>
          <h1 class="text-xl font-semibold">Service Plan + Emergency + Install Ops Hub</h1>
        </div>
        <div class="flex gap-2">
          <NuxtLink to="/" class="rounded-lg px-4 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50">Dashboard</NuxtLink>
          <button class="rounded-lg px-4 py-2 text-white font-medium" style="background:#112337">Dispatch Emergency</button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-6 py-8">
      <NuxtPage />
    </main>
  </div>
</template>
