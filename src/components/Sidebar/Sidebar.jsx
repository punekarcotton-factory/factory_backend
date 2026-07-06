import styled from "@emotion/styled";
import { ChevronLeft, ChevronRight, Menu, Close, ExpandMore, ExpandLess } from "@mui/icons-material";
import {
  Box,
  Drawer as MuiDrawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
  useMediaQuery,
  useTheme,
  Collapse,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const openedWidth = "260px";
const closedWidth = "80px";

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ open }) => ({
  width: open ? openedWidth : closedWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  "& .MuiDrawer-paper": {
    width: open ? openedWidth : closedWidth,
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    overflowX: "hidden",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    boxShadow:
      "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  },
}));

const Sidebar = ({ items, currentPath }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [open, setOpen] = useState(!isMobile && !isTablet);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setOpen(!isMobile && !isTablet);
  }, [isMobile, isTablet]);

  // Auto-expand menu if current path matches submenu item
  useEffect(() => {
    items.forEach((item, index) => {
      if (item.submenu && currentPath.startsWith(item.route)) {
        setExpandedMenus(prev => ({ ...prev, [index]: true }));
      }
    });
  }, [currentPath, items]);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setOpen(!open);
    }
  };

  const toggleSubmenu = (index) => {
    setExpandedMenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const onClickSidebar = (item, hasSubmenu, index) => {
    if (hasSubmenu) {
      if (open || isMobile) {
        toggleSubmenu(index);
      } else {
        // If sidebar is collapsed, expand it and the submenu
        setOpen(true);
        setExpandedMenus(prev => ({ ...prev, [index]: true }));
      }
    } else {
      navigate(item.route);
      if (isMobile) {
        setMobileOpen(false);
      }
    }
  };

  const onClickSubmenuItem = (subItem) => {
    navigate(subItem.route);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: open || isMobile ? "space-between" : "center",
          padding: open || isMobile ? "16px 16px" : "20px 0",
          minHeight: { xs: "70px", sm: "80px" },
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        {(open || isMobile) ? (
          <>
            <Box
              onClick={() => {
                navigate("/dashboard");
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: "8px", sm: "12px" },
                cursor: "pointer",
                transition: "opacity 0.2s",
                "&:hover": { opacity: 0.8 },
              }}
            >
              <Box
                sx={{
                  width: { xs: "50px", sm: "60px" },
                  height: { xs: "50px", sm: "60px" },
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                }}
              >
                <img
                  src="/punekar-logo.png"
                  alt="Logo"
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "contain",
                  }}
                />
              </Box>

              <Box
                sx={{
                  fontSize: { xs: "16px", sm: "18px" },
                  fontWeight: 700,
                  color: "#111827",
                  letterSpacing: "-0.3px",
                }}
              >
                Factory
              </Box>
            </Box>

            <IconButton
              onClick={handleDrawerToggle}
              size="small"
              sx={{
                color: "#6b7280",
                "&:hover": {
                  backgroundColor: "#f3f4f6",
                  color: "#111827",
                },
              }}
            >
              {isMobile ? <Close fontSize="small" /> : <ChevronLeft fontSize="small" />}
            </IconButton>
          </>
        ) : (
          <Tooltip title="Expand" placement="right">
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Box
                onClick={() => navigate("/dashboard")}
                sx={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                  "&:hover": { opacity: 0.8 },
                }}
              >
                <img
                  src="/punekar-logo.png"
                  alt="Logo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </Box>

              <IconButton
                onClick={handleDrawerToggle}
                size="small"
                sx={{
                  color: "#6b7280",
                  "&:hover": {
                    backgroundColor: "#f3f4f6",
                    color: "#111827",
                  },
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* Navigation */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: { xs: "12px 8px", sm: "16px 12px" },
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#e5e7eb",
            borderRadius: "3px",
            "&:hover": {
              backgroundColor: "#d1d5db",
            },
          },
        }}
      >
        <List sx={{ padding: 0 }}>
          {items.map((item, index) => {
            const isActive = currentPath.startsWith(item.route);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenus[index];

            return (
              <Box key={`sidebar-item-${index}`}>
                <ListItem disablePadding sx={{ marginBottom: "4px" }}>
                  <ListItemButton
                    onClick={() => onClickSidebar(item, hasSubmenu, index)}
                    sx={{
                      minHeight: { xs: "40px", sm: "44px" },
                      borderRadius: "10px",
                      padding: (open || isMobile) ? "10px 16px" : "10px 8px",
                      justifyContent: (open || isMobile) ? "flex-start" : "center",
                      backgroundColor: isActive ? "#f3f4f6" : "transparent",
                      position: "relative",
                      "&:hover": {
                        backgroundColor: isActive ? "#e5e7eb" : "#f9fafb",
                      },
                      "&::before": isActive
                        ? {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "4px",
                            height: "60%",
                            backgroundColor: "#667eea",
                            borderRadius: "0 4px 4px 0",
                          }
                        : {},
                    }}
                  >
                    <Tooltip
                      title={!(open || isMobile) ? item.name : ""}
                      placement="right"
                      arrow
                    >
                      <Box
                        sx={{
                          minWidth: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: { xs: "18px", sm: "20px" },
                          mr: (open || isMobile) ? 2 : 0,
                          color: isActive ? "#667eea" : "#6b7280",
                        }}
                      >
                        <item.icon />
                      </Box>
                    </Tooltip>
                    {(open || isMobile) && (
                      <>
                        <ListItemText
                          primary={item.name}
                          sx={{
                            margin: 0,
                            "& .MuiListItemText-primary": {
                              fontSize: { xs: "13px", sm: "14px" },
                              fontWeight: isActive ? 600 : 500,
                              color: isActive ? "#111827" : "#6b7280",
                              letterSpacing: "-0.1px",
                            },
                          }}
                        />
                        {hasSubmenu && (
                          <Box sx={{ color: isActive ? "#667eea" : "#6b7280" }}>
                            {isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                          </Box>
                        )}
                      </>
                    )}
                  </ListItemButton>
                </ListItem>

                {/* Submenu */}
                {hasSubmenu && (open || isMobile) && (
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.submenu.map((subItem, subIndex) => {
                        const isSubActive = location.pathname === subItem.route;
                        
                        return (
                          <ListItem
                            key={`submenu-${index}-${subIndex}`}
                            disablePadding
                            sx={{ marginBottom: "2px" }}
                          >
                            <ListItemButton
                              onClick={() => onClickSubmenuItem(subItem)}
                              sx={{
                                minHeight: "36px",
                                borderRadius: "8px",
                                padding: "8px 16px 8px 56px",
                                backgroundColor: isSubActive ? "#f3f4f6" : "transparent",
                                "&:hover": {
                                  backgroundColor: isSubActive ? "#e5e7eb" : "#f9fafb",
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  minWidth: "20px",
                                  width: 24,
                                  height: 24,
                                  borderRadius: "50%",
                                  backgroundColor: isSubActive ? "#667eea" : "#e5e7eb",
                                  color: isSubActive ? "#ffffff" : "#6b7280",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  mr: 1.5,
                                  flexShrink: 0,
                                }}
                              >
                                {subItem.stageId}
                              </Box>
                              <ListItemText
                                primary={subItem.name}
                                sx={{
                                  margin: 0,
                                  "& .MuiListItemText-primary": {
                                    fontSize: "13px",
                                    fontWeight: isSubActive ? 600 : 500,
                                    color: isSubActive ? "#111827" : "#6b7280",
                                    letterSpacing: "-0.1px",
                                  },
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>
      </Box>
    </>
  );

  if (isMobile) {
    return (
      <>
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: { xs: 12, sm: 16 },
            left: { xs: 12, sm: 16 },
            zIndex: 1300,
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            width: { xs: 40, sm: 44 },
            height: { xs: 40, sm: 44 },
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          <Menu fontSize="small" />
        </IconButton>
        
        <MuiDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: { xs: '280px', sm: openedWidth },
              backgroundColor: '#ffffff',
              borderRight: '1px solid #e5e7eb',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
          }}
        >
          {drawerContent}
        </MuiDrawer>

        {mobileOpen && (
          <Box
            onClick={() => setMobileOpen(false)}
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1200,
            }}
          />
        )}
      </>
    );
  }

  return (
    <Drawer variant="permanent" open={open}>
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;