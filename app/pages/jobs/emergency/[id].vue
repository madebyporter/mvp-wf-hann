<template>
  <div class="flex flex-col gap-4">
    <NuxtLink to="/jobs" class="text-sm text-blue-700 hover:underline">← Back to jobs</NuxtLink>

    <div v-if="job" class="rounded-xl border p-5">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <h2 class="text-lg font-semibold">Emergency Job Detail — {{ job.ticket }}</h2>
        <div class="flex items-center gap-2">
          <span v-if="!editing" class="text-xs px-2 py-1 rounded" :class="job.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ job.priority }}</span>
          <button
            v-if="!editing"
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="startEdit"
          >
            Edit
          </button>
          <template v-else>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              @click="cancelEdit"
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              @click="saveJob"
            >
              Save
            </button>
          </template>
        </div>
      </div>

      <div v-if="!editing" class="mt-4 grid gap-4 md:grid-cols-2 text-sm">
        <div><p class="text-slate-500">Issue</p><p class="font-medium">{{ job.issue }}</p></div>
        <div><p class="text-slate-500">Location</p><p class="font-medium">{{ job.city }}</p></div>
        <div><p class="text-slate-500">ETA target</p><p class="font-medium">{{ job.eta }}</p></div>
        <div><p class="text-slate-500">Assigned crew</p><p class="font-medium">{{ crewName }}</p></div>
        <div><p class="text-slate-500">Dispatch status</p><p class="font-medium">{{ job.status }}</p></div>
      </div>

      <form v-else class="mt-4 grid gap-4 md:grid-cols-2 text-sm" @submit.prevent="saveJob">
        <div>
          <label class="block text-slate-500 mb-1">Issue</label>
          <input v-model="form.issue" type="text" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Location (city)</label>
          <input v-model="form.city" type="text" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Priority</label>
          <select v-model="form.priority" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm">
            <option value="High">High</option>
            <option value="Med">Med</option>
          </select>
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Status</label>
          <select v-model="form.status" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm">
            <option v-for="s in emergencyStatuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div>
          <label class="block text-slate-500 mb-1">ETA</label>
          <input v-model="form.eta" type="text" placeholder="e.g. 45 min" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Assigned crew</label>
          <select v-model="form.crewId" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">Unassigned</option>
            <option v-for="c in state.crews" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </form>
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
const { state, updateEmergencyJobMutation } = useDemoState()
const { showToast } = useToast()

const emergencyStatuses = ['Awaiting crew', 'En route', 'On site', 'Completed']

const id = String(route.params.id)
const job = computed(() => state.value.jobs.emergency.find((j) => j.ticket === id) ?? null)
const crewName = computed(() => {
  const j = job.value
  if (!j?.crewId) return 'Unassigned'
  const crew = state.value.crews.find((c) => c.id === j.crewId)
  return crew?.name ?? j.crewId
})

const editing = ref(false)
const form = ref({ issue: '', city: '', priority: 'High', status: 'Awaiting crew', eta: '', crewId: '' })

function startEdit() {
  const j = job.value
  if (!j) return
  form.value = {
    issue: j.issue,
    city: j.city,
    priority: j.priority,
    status: j.status,
    eta: j.eta ?? '',
    crewId: j.crewId ?? ''
  }
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

function saveJob() {
  const j = job.value
  if (!j) return
  updateEmergencyJobMutation(
    {
      jobId: j.ticket,
      issue: form.value.issue,
      city: form.value.city,
      priority: form.value.priority,
      status: form.value.status,
      eta: form.value.eta || undefined,
      crewId: form.value.crewId || undefined
    },
    { showToast }
  )
  editing.value = false
}
</script>
