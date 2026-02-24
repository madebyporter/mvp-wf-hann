import type { DealStage, DemoState, ServicePlanTier } from '~/types/demo'
import demoStateSeed from '~/data/demoStateSeed.json'
import {
  appendSystemMessages,
  createDeal,
  createEmergencyJob,
  createProjectJob,
  dispatchEmergencyJob,
  queueNotification,
  recomputeQuoteConversion,
  upsertClient
} from '~/lib/mutations'

const STORAGE_KEY = 'hvac-demo-state'

function loadState(): DemoState {
  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as DemoState
        if (parsed?.deals && parsed?.jobs?.emergency && parsed?.chatMessages) {
          return parsed
        }
      }
    } catch (_) {
      // ignore
    }
  }
  return JSON.parse(JSON.stringify(demoStateSeed)) as DemoState
}

export function useDemoState() {
  const state = useState<DemoState>(STORAGE_KEY, () => loadState())

  function persist() {
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
      } catch (_) {
        // ignore
      }
    }
  }

  function applySystemMessages(messages: string[], showToast?: (msg: string) => void) {
    if (!messages.length) return
    state.value = appendSystemMessages(state.value, messages)
    persist()
    if (import.meta.client && showToast) {
      messages.forEach((msg) => showToast(msg))
    }
  }

  function createDealMutation(
    args: {
      clientName: string
      phone?: string
      email?: string
      address?: string
      dealTitle: string
      dealAmount?: number
      dealStage: DealStage
      servicePlanTier: ServicePlanTier
      renewalDueInDays?: number
    },
    options?: { showToast?: (msg: string) => void }
  ) {
    const { state: next, systemMessages } = createDeal(state.value, args)
    const withStats = recomputeQuoteConversion(next)
    state.value = appendSystemMessages(withStats, systemMessages)
    persist()
    if (options?.showToast && systemMessages.length) {
      systemMessages.forEach((m) => options.showToast!(m))
    }
    return { systemMessages }
  }

  function dispatchEmergencyMutation(
    args: {
      jobId: string
      assignCrew?: string
      status?: string
      etaTargetMinutes?: number
      notifyCustomer?: boolean
      note?: string
    },
    options?: { showToast?: (msg: string) => void }
  ) {
    const { state: next, systemMessages } = dispatchEmergencyJob(state.value, args)
    state.value = appendSystemMessages(next, systemMessages)
    persist()
    if (options?.showToast && systemMessages.length) {
      systemMessages.forEach((m) => options.showToast!(m))
    }
    return { systemMessages }
  }

  function createEmergencyJobMutation(
    args: { issue: string; city: string; priority?: string },
    options?: { showToast?: (msg: string) => void }
  ) {
    const { state: next, systemMessages } = createEmergencyJob(state.value, args)
    state.value = appendSystemMessages(next, systemMessages)
    persist()
    if (options?.showToast && systemMessages.length) {
      systemMessages.forEach((m) => options.showToast!(m))
    }
    return { systemMessages }
  }

  function createProjectJobMutation(
    args: { client: string; scope: string; location: string; stage?: string },
    options?: { showToast?: (msg: string) => void }
  ) {
    const { state: next, systemMessages } = createProjectJob(state.value, args)
    state.value = appendSystemMessages(next, systemMessages)
    persist()
    if (options?.showToast && systemMessages.length) {
      systemMessages.forEach((m) => options.showToast!(m))
    }
    return { systemMessages }
  }

  function appendSystemMessagesOnly(messages: string[], showToast?: (msg: string) => void) {
    applySystemMessages(messages, showToast)
  }

  function setStateFromServer(updated: DemoState) {
    state.value = JSON.parse(JSON.stringify(updated))
    persist()
  }

  return {
    state,
    persist,
    createDealMutation,
    createEmergencyJobMutation,
    createProjectJobMutation,
    dispatchEmergencyMutation,
    appendSystemMessagesOnly,
    setStateFromServer,
    applySystemMessages
  }
}
