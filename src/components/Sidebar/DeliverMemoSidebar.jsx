import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { DELIVERY_MEMO_STAGES_ARRAY } from "../../utils/deliveryMemo";

const DeliveryMemoSidebar = ({ activeStage, onStageChange }) => {
  return (
    <Box
      sx={{
        width: { xs: "100%", md: 280 },
        backgroundColor: "#ffffff",
        borderRight: { xs: "none", md: "1px solid #e5e7eb" },
        borderBottom: { xs: "1px solid #e5e7eb", md: "none" },
        top: 0,
      }}
    >
      {/* Scrollable List */}
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
        <List sx={{ p: 0 }}>
          {DELIVERY_MEMO_STAGES_ARRAY.map((stage) => (
            <ListItem key={stage.key} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={activeStage === stage.key}
                onClick={() => onStageChange(stage.key)}
                sx={{
                  minHeight: { xs: "40px", sm: "44px" },
                  borderRadius: "10px",
                  padding: "10px 16px",
                  backgroundColor:
                    activeStage === stage.key ? "#f3f4f6" : "transparent",
                  position: "relative",
                  "&:hover": {
                    backgroundColor:
                      activeStage === stage.key ? "#e5e7eb" : "#f9fafb",
                  },
                  "&::before":
                    activeStage === stage.key
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
                <Box
                  sx={{
                    minWidth: "24px",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor:
                      activeStage === stage.key ? "#667eea" : "#e5e7eb",
                    color: activeStage === stage.key ? "#ffffff" : "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 600,
                    mr: 2,
                    flexShrink: 0,
                  }}
                >
                  {stage.id}
                </Box>
                <ListItemText
                  primary={stage.label}
                  primaryTypographyProps={{
                    fontSize: { xs: "13px", sm: "14px" },
                    fontWeight: activeStage === stage.key ? 600 : 500,
                    color: activeStage === stage.key ? "#111827" : "#6b7280",
                    letterSpacing: "-0.1px",
                    lineHeight: 1.4,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default DeliveryMemoSidebar;
