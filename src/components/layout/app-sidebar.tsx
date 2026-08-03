import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import {
  type NavGroup,
  type NavItem,
  NAV_SECTIONS,
  type NavSection,
  SETTINGS_NAV_SECTION,
  filterNavSections,
} from '@/config/nav'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { useCurrentRole } from '@/store/auth-store'

function NavGroupItem({ item, pathname }: { item: NavGroup; pathname: string }) {
  const isChildActive = item.children.some((child) => child.url === pathname)

  return (
    <Collapsible defaultOpen={isChildActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isChildActive}>
            <item.icon />
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children.map((child) => (
              <SidebarMenuSubItem key={child.url}>
                <SidebarMenuSubButton asChild isActive={pathname === child.url}>
                  <Link to={child.url}>{child.title}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function NavMenuItem({ item, pathname }: { item: NavItem; pathname: string }) {
  if (item.type === 'group') {
    return <NavGroupItem item={item} pathname={pathname} />
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={pathname === item.url}>
        <Link to={item.url}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function NavSectionGroup({ section, pathname }: { section: NavSection; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {section.items.map((item) => (
            <NavMenuItem key={item.type === 'link' ? item.url : item.title} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const location = useLocation()
  const role = useCurrentRole()

  const mainSections = filterNavSections(NAV_SECTIONS, role)
  const settingsSections = filterNavSections([SETTINGS_NAV_SECTION], role)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:px-0">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
            GT
          </div>
          <span className="font-semibold group-data-[collapsible=icon]:hidden">Gold Track</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {mainSections.map((section) => (
          <NavSectionGroup key={section.label} section={section} pathname={location.pathname} />
        ))}
      </SidebarContent>
      {settingsSections.length > 0 && (
        <SidebarFooter>
          {settingsSections.map((section) => (
            <NavSectionGroup key={section.label} section={section} pathname={location.pathname} />
          ))}
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
