<template>
  <div class="parent h-full max-h-dvh flex flex-col min-h-0 overflow-hidden">
    <div class="main flex-1 min-h-0 grid gap-0 xl:grid-cols-[320px_minmax(0,1fr)_280px] xl:divide-x xl:divide-black overflow-hidden">
      <aside ref="chatWindowEl" class="chat-window h-full min-h-0 overflow-y-auto p-4 space-y-4">
        <div class="rounded-xl border p-4 bg-slate-50">
          <p class="text-xs uppercase tracking-wide text-slate-500">AI Dispatch Copilot</p>
          <p class="mt-1 text-sm text-slate-700">Create deals, dispatch emergency jobs</p>
        </div>
        <div
          v-for="(msg, i) in chatMessages"
          :key="i"
          class="flex"
          :class="
            msg.role === 'human'
              ? 'justify-start'
              : msg.role === 'system'
                ? 'justify-center'
                : 'justify-end'
          "
        >
          <div
            class="max-w-[85%] rounded-xl px-4 py-3 text-sm border"
            :class="
              msg.role === 'human'
                ? 'bg-white border-slate-300 text-slate-800'
                : msg.role === 'system'
                  ? 'bg-amber-50 border-amber-200 text-amber-900 text-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
           "
          >
            <p
              class="text-[11px] uppercase tracking-wide mb-1"
              :class="
                msg.role === 'human'
                  ? 'text-slate-500'
                  : msg.role === 'system'
                    ? 'text-amber-600'
                    : 'text-blue-700'
              "
            >
              {{ msg.role === 'human' ? 'Dispatcher' : msg.role === 'system' ? 'System' : 'AI Ops' }}
            </p>
            {{ msg.text }}
          </div>
        </div>
        <div v-if="isAiTyping" class="flex justify-end">
          <div class="w-[80%] rounded-xl px-4 py-3 text-sm border bg-slate-100 border-slate-200 text-slate-700">
            <p class="text-[11px] uppercase tracking-wide mb-1 text-blue-700">AI Ops</p>
            <div class="flex items-center gap-1">
              <span class="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
              <span class="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.1s]" />
              <span class="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
            </div>
          </div>
        </div>
      </aside>

      <section class="jobqueue h-full min-h-0 overflow-y-auto p-4 space-y-4">
        <NuxtPage />
      </section>

      <aside class="analytics h-full min-h-0 overflow-y-auto p-4 space-y-4">
        <div class="rounded-xl border p-5">
          <h2 class="font-semibold">Home Service Plans</h2>
          <ul class="mt-3 space-y-2 text-sm">
            <li class="flex justify-between"><span>Renewals due (7d)</span><strong>{{ dashboardStats.homeServicePlans.renewalsDue7d }}</strong></li>
            <li class="flex justify-between"><span>Scheduled visits</span><strong>{{ dashboardStats.homeServicePlans.scheduledVisits }}</strong></li>
            <li class="flex justify-between"><span>At-risk accounts</span><strong>{{ dashboardStats.homeServicePlans.atRiskAccounts }}</strong></li>
          </ul>
        </div>
        <div class="rounded-xl border p-5">
          <h2 class="font-semibold">Install Capacity Snapshot</h2>
          <ul class="mt-3 space-y-2 text-sm">
            <li class="flex justify-between"><span>Large installs active</span><strong>{{ dashboardStats.installCapacity.largeInstallsActive }}</strong></li>
            <li class="flex justify-between"><span>Crews assigned</span><strong>{{ dashboardStats.installCapacity.crewsAssigned }}</strong></li>
            <li class="flex justify-between"><span>Pending permits</span><strong>{{ dashboardStats.installCapacity.pendingPermits }}</strong></li>
          </ul>
        </div>
      </aside>
    </div>

    <!-- Toast -->
    <div
      v-if="toastMessage"
      class="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] rounded-lg bg-slate-800 text-white px-4 py-2 text-sm shadow-lg max-w-[90vw]"
    >
      {{ toastMessage }}
    </div>

    <footer class="footer border-t p-4 shrink-0 bg-white">
      <form class="chat-input rounded-xl border bg-slate-100 px-3 py-2 flex items-center gap-2" @submit.prevent="sendChat">
        <div class="mr-auto w-full relative">
          <input
            ref="chatInputEl"
            v-model="chatInput"
            class="w-full bg-transparent outline-none text-sm text-slate-800 relative z-10"
            placeholder="e.g. Create a deal for Lakewood School District, proposal sent, 48,500, Gold plan..."
            @keydown.tab.prevent="acceptSuggestion"
          >
          <div v-if="suggestionTail" class="absolute inset-y-0 left-0 flex items-center text-sm text-slate-400 pointer-events-none">
            <span class="invisible">{{ chatInput }}</span><span>{{ suggestionTail }}</span>
          </div>
        </div>
        <button type="button" class="text-xs rounded-md border bg-white px-2 py-1 hover:bg-slate-50 whitespace-nowrap" @click="quickAsk('Status of EM-2042')">Status EM-2042</button>
        <button type="button" class="text-xs rounded-md border bg-white px-2 py-1 hover:bg-slate-50 whitespace-nowrap" @click="quickAsk('Dispatch EM-2042 to Crew A2, set En route, ETA 60, notify customer.')">Dispatch EM-2042</button>
        <button type="submit" class="rounded-full bg-slate-900 text-white px-3 py-1.5 text-sm">➤</button>
      </form>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const { state, setStateFromServer, persist } = useDemoState()
const { toastMessage, showToast } = useToast()

const chatMessages = computed(() => state.value.chatMessages)
const dashboardStats = computed(() => state.value.dashboardStats)

const chatInput = ref('')
const chatInputEl = ref<HTMLInputElement | null>(null)
const chatWindowEl = ref<HTMLElement | null>(null)
const isAiTyping = ref(false)

const allCodes = computed(() => [
  ...state.value.jobs.emergency.map((j) => j.ticket),
  ...state.value.jobs.install.map((j) => j.id),
  ...state.value.deals.map((d) => d.id)
])

const suggestedCode = computed(() => {
  const value = chatInput.value
  const upper = value.toUpperCase()
  const partial = upper.match(/(?:\b|^)(EM|PRJ|OPP)(?:-|\s)?([A-Z0-9]*)$/)
  if (partial) {
    const prefix = partial[1] === 'EM' ? 'EM-' : partial[1] === 'PRJ' ? 'PRJ-' : 'OPP-'
    const typed = partial[2] || ''
    const match = allCodes.value.find((code) => code.startsWith(`${prefix}${typed}`))
    return match || ''
  }
  return ''
})

const suggestionTail = computed(() => {
  const code = suggestedCode.value
  if (!code) return ''
  const value = chatInput.value
  const upper = value.toUpperCase()
  const partial = upper.match(/(?:\b|^)(EM|PRJ|OPP)(?:-|\s)?([A-Z0-9]*)$/)
  if (partial) {
    const typedRest = partial[2] || ''
    const normalizedTyped = `${partial[1]}-${typedRest}`
    if (!code.startsWith(normalizedTyped)) return ''
    return code.slice(normalizedTyped.length)
  }
  return ''
})

function acceptSuggestion() {
  if (!suggestedCode.value) return
  const value = chatInput.value
  const partial = value.match(/(?:\b|^)(EM|PRJ|OPP)(?:-|\s)?([A-Z0-9]*)$/i)
  if (partial && partial.index != null) {
    chatInput.value = `${value.slice(0, partial.index)}${suggestedCode.value}`
  }
  nextTick(() => chatInputEl.value?.focus())
}

async function sendChat() {
  const text = chatInput.value.trim()
  if (!text || isAiTyping.value) return

  const messages = [...state.value.chatMessages, { role: 'human' as const, text }]
  state.value = { ...state.value, chatMessages: messages }
  persist()
  chatInput.value = ''
  isAiTyping.value = true
  await scrollChatToBottom()

  try {
    const res = await $fetch<{
      assistantMessage: string
      updatedState: typeof state.value
      systemMessages: string[]
    }>('/api/agent', {
      method: 'POST',
      body: { messages, state: state.value }
    })
    setStateFromServer(res.updatedState)
    res.systemMessages.forEach((m) => showToast(m))
  } catch (e: unknown) {
    const err = e && typeof e === 'object' && 'data' in e
      ? (e as { data?: { message?: string }; message?: string }).data?.message || (e as Error).message
      : e instanceof Error ? e.message : String(e)
    setStateFromServer({
      ...state.value,
      chatMessages: [
        ...state.value.chatMessages,
        { role: 'ai' as const, text: `Error: ${err}` }
      ]
    })
  } finally {
    isAiTyping.value = false
    await scrollChatToBottom()
  }
}

function quickAsk(text: string) {
  chatInput.value = text
  sendChat()
}

async function scrollChatToBottom() {
  await nextTick()
  if (chatWindowEl.value) chatWindowEl.value.scrollTop = chatWindowEl.value.scrollHeight
}

watch(chatMessages, scrollChatToBottom, { deep: true })
onMounted(() => scrollChatToBottom())
</script>
