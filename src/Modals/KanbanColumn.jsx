import React from "react";
import { Box, Button, Card, Typography, Chip, Tooltip } from "@mui/material";
import { CreateButton } from "../components/Styled";
import { getMemoTitle } from "../utils/deliveryMemo";

const KanbanColumn = ({
  title,
  memos,
  status,
  color,
  onOpenDialog,
  onMarkComplete,
  onAssignKanchButton,
}) => {
  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        backgroundColor: "#f9fafb",
        borderRadius: "12px",
        p: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 2,
          pb: 2,
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "16px",
            color: "#111827",
          }}
        >
          {title}
        </Typography>
        <Chip
          label={memos.length}
          size="small"
          sx={{
            backgroundColor: color,
            color: "white",
            fontWeight: 600,
            minWidth: "32px",
          }}
        />
      </Box>

      {/* Cards Container */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {memos.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              color: "#9ca3af",
            }}
          >
            <Typography sx={{ fontSize: "14px" }}>
              No memos in this stage
            </Typography>
          </Box>
        ) : (
          memos.map((memo) => (
            <Card
              key={memo._id}
              sx={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                backgroundColor: "#ffffff",
                transition: "all 0.2s",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box sx={{ p: 2.5 }}>
                {/* Memo Header Info */}
                <Tooltip title={getMemoTitle(memo)} arrow placement="top">
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "16px",
                      mb: 0.5,
                      color: "#111827",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      cursor: "help",
                    }}
                  >
                    {getMemoTitle(memo)}
                  </Typography>
                </Tooltip>
                <Typography sx={{ fontWeight: 600, fontSize: "14px", mb: 1, color: "#6b7280" }}>
                  Memo ID: {memo.deliveryMemoId}
                </Typography>

                <Typography sx={{ fontSize: "12px", color: "#6b7280", mb: 1 }}>
                  Items: {memo.itemCount}
                </Typography>

                <Typography sx={{ fontSize: "12px", color: "#6b7280", mb: 2 }}>
                  Total Dhap Fold: {memo.totalDhapFold}
                </Typography>

                {/* Tailor Details */}
                {memo.tailorDetails && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      backgroundColor: "#eff6ff",
                      borderRadius: "8px",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#1e40af",
                        mb: 0.5,
                      }}
                    >
                      Assigned Tailor
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#374151" }}>
                      Name: {memo.tailorDetails.name}
                    </Typography>
                    <Typography sx={{ fontSize: "12px", color: "#374151" }}>
                      Phone: {memo.tailorDetails.phoneNumber}
                    </Typography>
                  </Box>
                )}

                {/* Items List */}
                {memo.items?.map((item) => (
                  <Box
                    key={item._id}
                    sx={{
                      mb: 2,
                      p: 1.5,
                      borderRadius: "8px",
                      backgroundColor: "#f9fafb",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                      <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                        Title:
                      </Typography>
                      <Typography sx={{ fontSize: "13px" }}>
                        {item.fabricTitle}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                      <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                        Color:
                      </Typography>
                      <Typography sx={{ fontSize: "13px" }}>
                        {item.fabricColor}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
                      <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                        Dhap:
                      </Typography>
                      <Typography sx={{ fontSize: "13px" }}>
                        {item.dhap}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
                        Fold:
                      </Typography>
                      <Typography sx={{ fontSize: "13px" }}>
                        {item.fold}
                      </Typography>
                    </Box>
                  </Box>
                ))}

                {/* Action Buttons */}
                {status === "notAssigned" && (
                  <CreateButton
                    variant="contained"
                    onClick={() => onOpenDialog(memo._id)}
                  >
                    Assign Tailor
                  </CreateButton>
                )}

                {status === "assigned" && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => onMarkComplete(memo._id)}
                    sx={{
                      mt: 1,
                      textTransform: "none",
                      borderRadius: "8px",
                      backgroundColor: "#10b981",
                      "&:hover": {
                        backgroundColor: "#059669",
                      },
                    }}
                  >
                    Mark Complete
                  </Button>
                )}

                {status === "completed" && (
                  <>
                    <Chip
                      label="Completed"
                      size="small"
                      sx={{
                        mt: 1,
                        backgroundColor: "#d1fae5",
                        color: "#065f46",
                        fontWeight: 600,
                      }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => onAssignKanchButton(memo._id)}
                      sx={{
                        mt: 1,
                        ml: 1,
                        textTransform: "none",
                        borderRadius: "8px",
                        backgroundColor: "#10b981",
                        "&:hover": {
                          backgroundColor: "#059669",
                        },
                      }}
                    >
                      Assign Kanch Button
                    </Button>
                  </>
                )}
              </Box>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
};

export default KanbanColumn;
