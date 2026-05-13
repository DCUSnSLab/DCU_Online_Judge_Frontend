import { useSnackbarStore } from '~/stores/snackbar'

/**
 * Drop-in replacement for the iView `$Message` global from the legacy app.
 * Usage:
 *   const notice = useNotice()
 *   notice.success('저장되었습니다')
 *   notice.error('서버 오류')
 */
export function useNotice() {
  return useSnackbarStore()
}
