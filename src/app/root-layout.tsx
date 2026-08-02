import { Outlet } from 'react-router-dom'
import { NavigationListener } from '@/app/navigation-listener'

export function RootLayout() {
  return (
    <>
      <NavigationListener />
      <Outlet />
    </>
  )
}
