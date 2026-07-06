import React from "react";
import {
  Box,
  Card,
  Chip,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { Close, Timeline } from "@mui/icons-material";
import { DialogBox, DialogHeader } from "../components/Styled";
import NoResponsePage from "../pages/NoResponsePage";


const StageHistoryModal = ({ open, data, onClose }) => {
  
  const { memo, history } = data;
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.enteredAt) - new Date(b.enteredAt)
  );
  
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  if (!data) return <NoResponsePage/>;
  
  const renderStageData = (stage) => {
    switch (stage.stage) {
      case "CREATE_DELIVERY_MEMO":
        return (
          <Box
          sx={{
            backgroundColor: "#ffffff",
            p: 1.5,
            borderRadius: "8px",
            mt: 1.5,
            border: "1px solid #f3f4f6",
          }}
          >
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                mb: 1,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
              >
              Initial Items
            </Typography>
            {stage.metadata?.items?.map((item, idx) => (
              <Box key={idx} sx={{ py: 1, fontSize: "14px", color: "#111827" }}>
                <Typography component="span">• {item.fabricSKU}</Typography>
                <Typography component="span" sx={{ color: "#6b7280", ml: 1 }}>
                  Dhap: {item.dhap} | Fold: {item.fold} | Total: {item.totalDhapFold}
                </Typography>
              </Box>
            ))}
          </Box>
        );
        
        case "CUTTING":
          const cuttingItems = memo.items || [];
          return (
            <Box
            sx={{
              backgroundColor: "#ffffff",
              p: 1.5,
              borderRadius: "8px",
              mt: 1.5,
              border: "1px solid #f3f4f6",
            }}
            >
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                mb: 1,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
              >
              Shirt Details Added
            </Typography>
            {cuttingItems.map((item, idx) => (
              <Box key={idx} sx={{ py: 1, fontSize: "14px", color: "#111827" }}>
                <Typography sx={{ fontWeight: 500 }}>
                  Shirt SKUs: {item.shirtSKUs?.join(', ') || "N/A"}
                </Typography>
                <Typography sx={{ color: "#6b7280", fontSize: "13px" }}>
                  Quantity: {item.shirtQuantity || 0} | Fabric: {item.fabricSKU}
                </Typography>
              </Box>
            ))}
          </Box>
        );

      case "ASSIGN_PRE_STITCHER":
      case "PRE_STITCHER_ASSIGNED":
        const assignment = memo.preStitcherAssignments?.find(
          (a) => a.status === "ASSIGNED"
        );
        if (!assignment) return null;

        const selectedOptions = assignment.options
          ? Object.entries(assignment.options)
              .filter(
                ([key, val]) =>
                  val === true &&
                  key !== "_id" &&
                  key !== "assignmentId" &&
                  key !== "createdAt" &&
                  key !== "updatedAt"
              )
              .map(([key]) => key)
          : [];

        return (
          <Box
            sx={{
              backgroundColor: "#ffffff",
              p: 1.5,
              borderRadius: "8px",
              mt: 1.5,
              border: "1px solid #f3f4f6",
            }}
          >
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#374151",
                mb: 1,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Pre-Stitcher Assigned
            </Typography>
            <Box sx={{ py: 1, fontSize: "14px", color: "#111827" }}>
              <Typography sx={{ fontWeight: 500 }}>
                {assignment.preStitcher?.firstName}{" "}
                {assignment.preStitcher?.lastName}
              </Typography>
              <Typography sx={{ color: "#6b7280", fontSize: "12px", mt: 0.5 }}>
                ID: {assignment.preStitcher?._id?.slice(0, 12)}...
              </Typography>
            </Box>

            {selectedOptions.length > 0 && (
              <>
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#374151",
                    mt: 1.5,
                    mb: 1,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Selected Options
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {selectedOptions.map((opt) => (
                    <Chip
                      key={opt}
                      label={opt.replace(/([A-Z])/g, " $1").trim()}
                      size="small"
                      sx={{
                        backgroundColor: "#f3f4f6",
                        color: "#374151",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <DialogBox open={open} onClose={handleClose} maxWidth="md" fullWidth>
      {/* Header */}
      <DialogTitle sx={{ pb: 2, px: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <DialogHeader>Stage History Details</DialogHeader>
            <Typography sx={{ fontSize: "12px", color: "#6b7280", mt: 0.5 }}>
              Memo: {memo._id.slice(0, 12)}...
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{
              color: "#9ca3af",
              "&:hover": {
                backgroundColor: "#f3f4f6",
                color: "#6b7280",
              },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ px: 3, pb: 3 }}>
        <Box sx={{ maxHeight: 500, overflowY: "auto", pr: 1 }}>
          {sortedHistory.map((stage, idx) => (
            <Card
              key={idx}
              sx={{
                mb: 2.5,
                p: 2,
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                backgroundColor: "#fafafa",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Timeline sx={{ color: "#6b7280", fontSize: 20 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: "15px" }}>
                      {stage.stage.replace(/_/g, " ")}
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#6b7280", mt: 0.25 }}>
                      {formatDate(stage.enteredAt)}
                    </Typography>
                  </Box>
                </Box>
                {stage.metadata?.previousStage && (
                  <Chip
                    label={`From: ${stage.metadata.previousStage.replace(/_/g, " ")}`}
                    size="small"
                    sx={{
                      fontSize: "11px",
                      color: "#6b7280",
                      backgroundColor: "#f3f4f6",
                    }}
                  />
                )}
              </Box>

              {renderStageData(stage)}
            </Card>
          ))}
        </Box>
      </DialogContent>
    </DialogBox>
  );
};

export default StageHistoryModal;