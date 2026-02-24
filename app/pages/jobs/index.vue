<template>
  <div class="jobs-page">
    <div class="flex flex-col gap-4">
    <NuxtLink to="/" class="text-sm text-blue-700 hover:underline">← Back to dashboard</NuxtLink>

    <div class="rounded-xl border p-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold">Emergency Queue (24/7)</h2>
        <span class="text-xs text-slate-400">All {{ emergencyQueue.length }} jobs</span>
      </div>
      <div class="mt-4 space-y-2">
        <div
          v-for="item in emergencyQueue"
          :key="item.ticket"
          class="w-full text-left rounded-lg border border-black/20 p-3 flex justify-between items-center hover:bg-slate-50 group"
        >
          <NuxtLink :to="`/jobs/emergency/${item.ticket}`" class="flex-1 min-w-0">
            <p class="font-medium">{{ item.ticket }} — {{ item.issue }}</p>
            <p class="text-sm text-slate-600">{{ item.city }} · ETA target {{ item.eta }}</p>
          </NuxtLink>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs px-2 py-1 rounded" :class="item.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ item.priority }}</span>
            <span class="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">{{ item.status }}</span>
            <button
              type="button"
              class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              @click.stop="openDispatchModal(item)"
            >
              Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-xl border p-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold">Commercial / Non-Emergency Install Pipeline</h2>
        <span class="text-xs text-slate-400">All {{ installJobs.length }} projects</span>
      </div>
      <div class="mt-4 space-y-2">
        <NuxtLink v-for="job in installJobs" :key="job.id" :to="`/jobs/projects/${job.id}`" class="w-full text-left rounded-lg border border-black/20 p-3 flex justify-between items-center hover:bg-slate-50">
          <div>
            <p class="font-medium">{{ job.id }} — {{ job.client }}</p>
            <p class="text-sm text-slate-600">{{ job.scope }} · {{ job.location }}</p>
          </div>
          <span class="text-xs px-2 py-1 rounded shrink-0" :class="job.stageClass">{{ job.stage }}</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Dispatch modal -->
    </div>
    <Teleport to="body">
      <div
        v-if="dispatchModalJob"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="closeDispatchModal"
      >
        <div class="rounded-xl border bg-white p-6 w-full max-w-md shadow-xl space-y-4">
          <h3 class="font-semibold text-lg">Dispatch — {{ dispatchModalJob.ticket }}</h3>
          <form class="space-y-3" @submit.prevent="submitDispatch">
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Assign crew</label>
              <select v-model="dispatchForm.assignCrew" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">— Select crew —</option>
                <option v-for="c in crews" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select v-model="dispatchForm.status" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="Awaiting crew">Awaiting crew</option>
                <option value="En route">En route</option>
                <option value="On site">On site</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">ETA (minutes)</label>
              <input v-model.number="dispatchForm.etaTargetMinutes" type="number" min="0" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. 60" />
            </div>
            <div class="flex items-center gap-2">
              <input id="notify-customer" v-model="dispatchForm.notifyCustomer" type="checkbox" class="rounded border-slate-300" />
              <label for="notify-customer" class="text-sm">Notify customer</label>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Note (optional)</label>
              <textarea v-model="dispatchForm.note" rows="2" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Optional note" />
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50" @click="closeDispatchModal">
                Cancel
              </button>
              <button type="submit" class="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm">
                Dispatch
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { EmergencyJob } from '~/types/demo'

const { state, dispatchEmergencyMutation } = useDemoState()
const { showToast } = useToast()

const emergencyQueue = computed(() => state.value.jobs.emergency)
const installJobs = computed(() => state.value.jobs.install)
const crews = computed(() => state.value.crews)

const dispatchModalJob = ref<EmergencyJob | null>(null)
const dispatchForm = ref({
  assignCrew: '',
  status: 'En route',
  etaTargetMinutes: undefined as number | undefined,
  notifyCustomer: false,
  note: ''
})

function openDispatchModal(job: EmergencyJob) {
  dispatchModalJob.value = job
  dispatchForm.value = {
    assignCrew: job.crewId ?? '',
    status: job.status,
    etaTargetMinutes: job.etaTargetMinutes,
    notifyCustomer: false,
    note: ''
  }
}

function closeDispatchModal() {
  dispatchModalJob.value = null
}

function submitDispatch() {
  if (!dispatchModalJob.value) return
  dispatchEmergencyMutation(
    {
      jobId: dispatchModalJob.value.ticket,
      assignCrew: dispatchForm.value.assignCrew || undefined,
      status: dispatchForm.value.status,
      etaTargetMinutes: dispatchForm.value.etaTargetMinutes,
      notifyCustomer: dispatchForm.value.notifyCustomer,
      note: dispatchForm.value.note || undefined
    },
    { showToast }
  )
  closeDispatchModal()
}
</script>
