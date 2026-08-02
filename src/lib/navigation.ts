type NavigateFn = (to: string, opts?: { replace?: boolean }) => void

let navigate: NavigateFn | null = null

/**
 * Registered by <NavigationListener/> once the router mounts. Lets
 * code outside the component tree (axios interceptors) redirect
 * without importing the router — importing it would create a cycle
 * with pages that use the HTTP client.
 */
export function setNavigator(fn: NavigateFn) {
  navigate = fn
}

export function redirect(to: string) {
  if (navigate) {
    navigate(to, { replace: true })
  } else {
    window.location.assign(to)
  }
}
