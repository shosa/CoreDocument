'use client';

import { useState, ReactNode } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Badge,
  Divider,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Description as DocumentIcon,
  Star as FavoritesIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Business as BusinessIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import UserAvatar from '@/components/UserAvatar';
import GlobalSearch from '@/components/GlobalSearch';
import MainFooterLogo from '@/components/MainFooterLogo';
import { useAuthStore } from '@/store/authStore';

const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 70;

interface NavigationItem {
  label: string;
  href: string;
  icon: ReactNode;
  roles?: string[];
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <DashboardIcon />,
  },
  {
    label: 'Documenti',
    href: '/documents',
    icon: <DocumentIcon />,
  },
  {
    label: 'Fornitori',
    href: '/suppliers',
    icon: <BusinessIcon />,
  },
  {
    label: 'Ricerca',
    href: '/search',
    icon: <SearchIcon />,
  },
  {
    label: 'Tools',
    href: '/tools',
    icon: <BuildIcon />,
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasRole } = useAuthStore();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleItemClick = (href: string) => {
    router.push(href);
    setMobileOpen(false);
  };

  const handleExpandClick = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const filterNavItems = (items: NavigationItem[]): NavigationItem[] => {
    return items.filter((item) => {
      if (item.roles && item.roles.length > 0) {
        return hasRole(item.roles as any);
      }
      return true;
    });
  };

  const renderNavItem = (item: NavigationItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.label);
    const isActive = isItemActive(item.href);

    return (
      <Box key={item.label}>
        <ListItemButton
          onClick={() => {
            if (hasChildren) {
              handleExpandClick(item.label);
            } else {
              handleItemClick(item.href);
            }
          }}
          selected={isActive && !hasChildren}
          sx={{
            py: 1.25,
            px: 2,
            mb: 0.5,
            mx: 1,
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'grey.800',
            },
            '&.Mui-selected': {
              bgcolor: 'common.white',
              color: 'common.black',
              '&:hover': {
                bgcolor: 'common.white',
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'common.black' : 'inherit' }}>
            {item.icon}
          </ListItemIcon>
          {!sidebarCollapsed && (
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'common.black' : 'inherit',
              }}
            />
          )}
          {hasChildren && (isExpanded ? <ExpandLess sx={{ color: isActive ? 'common.black' : 'inherit' }} /> : <ExpandMore sx={{ color: isActive ? 'common.black' : 'inherit' }} />)}
        </ListItemButton>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map((child) => (
                <ListItemButton
                  key={child.label}
                  onClick={() => handleItemClick(child.href)}
                  selected={isItemActive(child.href)}
                  sx={{
                    py: 1,
                    pl: 7,
                    pr: 2,
                    mb: 0.5,
                    mx: 1,
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'grey.800',
                    },
                    '&.Mui-selected': {
                      bgcolor: 'common.white',
                      color: 'common.black',
                      '&:hover': {
                        bgcolor: 'common.white',
                      },
                    },
                  }}
                >
                  {!sidebarCollapsed && (
                    <ListItemText
                      primary={child.label}
                      primaryTypographyProps={{
                        fontSize: '0.813rem',
                        fontWeight: isItemActive(child.href) ? 600 : 400,
                        color: isItemActive(child.href) ? 'common.black' : 'inherit',
                      }}
                    />
                  )}
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box>
        <Logo collapsed={sidebarCollapsed} />
      </Box>
      <Divider sx={{ borderColor: 'grey.800' }} />
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
        <List>{filterNavItems(navigationItems).map(renderNavItem)}</List>
      </Box>
      <Divider sx={{ borderColor: 'grey.800' }} />
      {user && (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'grey.800',
            },
          }}
          onClick={handleUserMenuOpen}
        >
          <UserAvatar user={user} size={40} />
          {!sidebarCollapsed && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" noWrap>
                {user.role}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }} className="dashboard-layout-container">
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${sidebarCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}px)` },
          ml: { md: `${sidebarCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}px` },
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            onClick={handleSidebarToggle}
            sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}
          >
            {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', px: 2 }}>
            <GlobalSearch />
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: sidebarCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH },
          flexShrink: { md: 0 },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              boxShadow: '4px 0px 8px rgba(0, 0, 0, 0.1)',
              bgcolor: 'primary.main',
              color: 'common.white',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: sidebarCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
              boxShadow: '4px 0px 8px rgba(0, 0, 0, 0.1)',
              bgcolor: 'primary.main',
              color: 'common.white',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${sidebarCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}px)` },
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <Box sx={{ flexGrow: 1, p: 3 }}>{children}</Box>

      </Box>

      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
