<template>
  <div class="h-dvh max-h-dvh flex flex-col overflow-hidden bg-white text-slate-900">
    <header class="border-b shrink-0">
      <div class="w-full px-6 py-4 flex items-center justify-between gap-4">
        <div class="brand">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">W.F. Hann & Sons MVP</p>
          <h1 class="text-xl font-semibold">Service Plan + Emergency + Install Ops Hub</h1>
        </div>
        <div class="nav flex gap-4 items-center">
          <NuxtLink to="/?view=dashboard" class="text-sm font-medium" :class="navClass('/')">dashboard</NuxtLink>
          <NuxtLink to="/jobs" class="text-sm font-medium" :class="navClass('/jobs')">jobs</NuxtLink>
          <NuxtLink to="/crm" class="text-sm font-medium" :class="navClass('/crm')">crm</NuxtLink>
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-white font-medium hover:opacity-90 transition-opacity"
            style="background:#112337"
            @click="showCreateEmergencyModal = true"
          >
            dispatch emergency
          </button>
        </div>
      </div>
    </header>

    <main class="main flex-1 min-h-0 overflow-hidden">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </main>

    <!-- Create new emergency modal -->
    <Teleport to="body">
      <div
        v-if="showCreateEmergencyModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="showCreateEmergencyModal = false"
      >
        <div class="rounded-xl border bg-white p-6 w-full max-w-md shadow-xl space-y-4">
          <h3 class="font-semibold text-lg">Create new emergency</h3>
          <form class="space-y-3" @submit.prevent="submitNewEmergency">
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Issue *</label>
              <input
                v-model="newEmergencyForm.issue"
                type="text"
                required
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="e.g. No heat, Burst pipe"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">City / location *</label>
              <input
                v-model="newEmergencyForm.city"
                type="text"
                required
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="e.g. Lakewood, Parma"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Priority</label>
              <select v-model="newEmergencyForm.priority" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="High">High</option>
                <option value="Med">Med</option>
              </select>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                @click="showCreateEmergencyModal = false"
              >
                Cancel
              </button>
              <button type="submit" class="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm">
                Create emergency
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { createEmergencyJobMutation } = useDemoState()
const { showToast } = useToast()

const showCreateEmergencyModal = ref(false)
const newEmergencyForm = ref({
  issue: '',
  city: '',
  priority: 'High' as 'High' | 'Med'
})

function navClass(path: string) {
  const active = route.path === path || (path === '/' && route.path === '/')
  return active
    ? 'text-slate-900 underline underline-offset-4'
    : 'text-slate-500 hover:text-slate-700'
}

function submitNewEmergency() {
  createEmergencyJobMutation(
    {
      issue: newEmergencyForm.value.issue,
      city: newEmergencyForm.value.city,
      priority: newEmergencyForm.value.priority
    },
    { showToast }
  )
  showCreateEmergencyModal.value = false
  newEmergencyForm.value = { issue: '', city: '', priority: 'High' }
}
</script>
