<template>
  <div class="flex flex-col gap-4">
    <NuxtLink to="/jobs" class="text-sm text-blue-700 hover:underline">← Back to jobs</NuxtLink>

    <div v-if="project" class="rounded-xl border p-5">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <h2 class="text-lg font-semibold">Install Project Detail — {{ project.id }}</h2>
        <div class="flex items-center gap-2">
          <span v-if="!editing" class="text-xs px-2 py-1 rounded" :class="project.stageClass">{{ project.stage }}</span>
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
        <div><p class="text-slate-500">Client</p><p class="font-medium">{{ project.client }}</p></div>
        <div><p class="text-slate-500">Location</p><p class="font-medium">{{ project.location }}</p></div>
        <div><p class="text-slate-500">Scope</p><p class="font-medium">{{ project.scope }}</p></div>
        <div v-if="project.currentWork"><p class="text-slate-500">Current work</p><p class="font-medium">{{ project.currentWork }}</p></div>
        <div v-if="project.nextStep"><p class="text-slate-500">Next step</p><p class="font-medium">{{ project.nextStep }}</p></div>
        <div v-if="project.notes?.length" class="md:col-span-2">
          <p class="text-slate-500 mb-1">Project notes</p>
          <ul class="space-y-1 text-slate-700">
            <li v-for="(note, idx) in project.notes" :key="idx" class="flex gap-2">
              <span class="text-slate-400">•</span>
              <span>{{ note }}</span>
            </li>
          </ul>
        </div>
      </div>

      <form v-else class="mt-4 grid gap-4 md:grid-cols-2 text-sm" @submit.prevent="saveJob">
        <div>
          <label class="block text-slate-500 mb-1">Client</label>
          <input v-model="form.client" type="text" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Location</label>
          <input v-model="form.location" type="text" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-slate-500 mb-1">Scope</label>
          <input v-model="form.scope" type="text" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Stage</label>
          <select v-model="form.stage" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm">
            <option v-for="s in projectStages" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Current work</label>
          <input v-model="form.currentWork" type="text" placeholder="—" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label class="block text-slate-500 mb-1">Next step</label>
          <input v-model="form.nextStep" type="text" placeholder="—" class="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
        </div>
        <div class="md:col-span-2">
          <label class="block text-slate-500 mb-1">Project notes</label>
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
        <div class="md:col-span-2 flex justify-end pt-2">
          <button
            type="button"
            class="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
            @click="confirmDeleteProject"
          >
            Delete
          </button>
        </div>
      </form>
    </div>

    <p v-else-if="!project" class="text-slate-500">Project not found.</p>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { state, updateProjectJobMutation, deleteProjectJobMutation } = useDemoState()
const { showToast } = useToast()

const projectStages = [
  'Planned',
  'Scheduled',
  'In Progress',
  'Awaiting Permit',
  'Permit Follow-up Sent',
  'On Hold',
  'Complete',
  'Cancelled'
]

const id = String(route.params.id)
const project = computed(() => state.value.jobs.install.find((j) => j.id === id) ?? null)

const editing = ref(false)
const newNote = ref('')
const form = ref({
  client: '',
  scope: '',
  location: '',
  stage: 'Planned',
  currentWork: '',
  nextStep: '',
  notes: [] as string[]
})

function startEdit() {
  const p = project.value
  if (!p) return
  form.value = {
    client: p.client,
    scope: p.scope,
    location: p.location,
    stage: p.stage,
    currentWork: p.currentWork ?? '',
    nextStep: p.nextStep ?? '',
    notes: [...(p.notes ?? [])]
  }
  newNote.value = ''
  editing.value = true
}

function addNote() {
  const t = newNote.value?.trim()
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
  const p = project.value
  if (!p) return
  updateProjectJobMutation(
    {
      jobId: p.id,
      client: form.value.client,
      scope: form.value.scope,
      location: form.value.location,
      stage: form.value.stage,
      currentWork: form.value.currentWork || undefined,
      nextStep: form.value.nextStep || undefined,
      notes: form.value.notes
    },
    { showToast }
  )
  editing.value = false
}

function confirmDeleteProject() {
  const p = project.value
  if (!p) return
  if (!confirm(`Delete project ${p.id}? This cannot be undone.`)) return
  deleteProjectJobMutation({ jobId: p.id }, { showToast })
  router.push('/jobs')
}
</script>
