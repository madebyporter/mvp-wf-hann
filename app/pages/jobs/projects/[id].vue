<template>
  <div class="flex flex-col gap-4">
    <NuxtLink to="/jobs" class="text-sm text-blue-700 hover:underline">← Back to jobs</NuxtLink>

    <div v-if="project" class="rounded-xl border p-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold">Install Project Detail — {{ project.id }}</h2>
        <span class="text-xs px-2 py-1 rounded" :class="project.stageClass">{{ project.stage }}</span>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-2 text-sm">
        <div><p class="text-slate-500">Client</p><p class="font-medium">{{ project.client }}</p></div>
        <div><p class="text-slate-500">Location</p><p class="font-medium">{{ project.location }}</p></div>
        <div><p class="text-slate-500">Scope</p><p class="font-medium">{{ project.scope }}</p></div>
        <div v-if="project.currentWork"><p class="text-slate-500">Current work</p><p class="font-medium">{{ project.currentWork }}</p></div>
        <div v-if="project.nextStep"><p class="text-slate-500">Next step</p><p class="font-medium">{{ project.nextStep }}</p></div>
      </div>
    </div>

    <div v-if="project?.notes?.length" class="rounded-xl border p-5">
      <h3 class="font-semibold">Project notes</h3>
      <ul class="mt-3 space-y-2 text-sm text-slate-700">
        <li v-for="(note, idx) in project.notes" :key="idx" class="flex gap-2">
          <span class="text-slate-400">•</span>
          <span>{{ note }}</span>
        </li>
      </ul>
    </div>

    <p v-else-if="!project" class="text-slate-500">Project not found.</p>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { state } = useDemoState()

const id = String(route.params.id)
const project = computed(() => state.value.jobs.install.find((j) => j.id === id) ?? null)
</script>
