import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setNavigator } from '@/lib/navigation'

export function NavigationListener() {
  const navigate = useNavigate()

  useEffect(() => {
    setNavigator(navigate)
  }, [navigate])

  return null
}
