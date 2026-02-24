const TOAST_KEY = 'hvac-toast'

export function useToast() {
  const message = useState<string | null>(TOAST_KEY, () => null)
  let timeout: ReturnType<typeof setTimeout> | null = null

  function showToast(msg: string) {
    if (timeout) clearTimeout(timeout)
    message.value = msg
    timeout = setTimeout(() => {
      message.value = null
      timeout = null
    }, 4000)
  }

  return { toastMessage: message, showToast }
}
