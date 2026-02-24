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

      <div v-if="!editing && job.notes?.length" class="mt-4 rounded-xl border p-5">
        <h3 class="font-semibold">Job notes</h3>
        <ul class="mt-3 space-y-2 text-sm text-slate-700">
          <li v-for="(note, idx) in job.notes" :key="idx" class="flex gap-2"><span class="text-slate-400">•</span><span>{{ note }}</span></li>
        </ul>
      </div>

      <form v-if="editing" class="mt-4 grid gap-4 md:grid-cols-2 text-sm" @submit.prevent="saveJob">
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
        <div class="md:col-span-2">
          <label class="block text-slate-500 mb-1">Job notes</label>
          <ul v-if="form.notes.length" class="mb-2 space-y-1 text-sm text-slate-700">
            <li v-for="(note, idx) in form.notes" :key="idx" class="flex items-center gap-2">
              <span class="text-slate-400">•</span>
              <span class="flex-1 min-w-0">{{ note }}</span>
              <button type="button" class="text-slate-400 hover:text-rose-600 shrink-0" @click="removeNote(idx)">Remove</button>
            </li>
          </ul>
          <div class="flex gap-2">
            <input
              v-model="newNote"
              type="text"
              class="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
              placeholder="Add a note..."
              @keydown.enter.prevent="addNote"
            />
            <button type="button" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="addNote">
              Add note
            </button>
          </div>
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
const newNote = ref('')
const form = ref({ issue: '', city: '', priority: 'High', status: 'Awaiting crew', eta: '', crewId: '', notes: [] as string[] })

function startEdit() {
  const j = job.value
  if (!j) return
  form.value = {
    issue: j.issue,
    city: j.city,
    priority: j.priority,
    status: j.status,
    eta: j.eta ?? '',
    crewId: j.crewId ?? '',
    notes: [...(j.notes ?? [])]
  }
  newNote.value = ''
  editing.value = true
}

function addNote() {
  const t = newNote.value.trim()
  if (!t) return
  form.value.notes = [...form.value.notes, t]
  newNote.value = ''
}

function removeNote(idx: number) {
  form.value.notes = form.value.notes.filter((_, i) => i !== idx)
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
      crewId: form.value.crewId || undefined,
      notes: form.value.notes
    },
    { showToast }
  )
  editing.value = false
}
</script>
