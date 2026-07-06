import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Box,
  Skeleton,
  Chip,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  Paper,
  Avatar,
} from "@mui/material";
import {
  Close,
  Build,
  Inventory2,
  Assignment,
  Person,
  Schedule,
} from "@mui/icons-material";
import axiosInstance from "../utils/axiosInstance";
import { StyledTableCell, StyledTableRow } from "../components/Styled";
import { resolveImageUrl } from "../config";

export default function CuttingViewHistory({ open, onClose, selectedMemo }) {
  const [memoData, setMemoData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && selectedMemo) {
      fetchMemoDetails();
    }
  }, [open, selectedMemo]);

  const fetchMemoDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/delivery-memos/${selectedMemo.deliveryMemoId}`,
      );
      setMemoData(response.data?.data || response.data || null);
    } catch (error) {
      console.error("Failed to fetch memo details:", error);
      setMemoData(null);
    } finally {
      setLoading(false);
    }
  };

  const stageLabel = {
    CUTTING: "Cutting",
    CREATE_DELIVERY_MEMO: "Memo Created",
    PENDING: "Pending",
  };

  const stageChipStyle = {
    CUTTING: { backgroundColor: "#fff3e0", color: "#f57c00" },
    CREATE_DELIVERY_MEMO: { backgroundColor: "#e3f2fd", color: "#1976d2" },
    PENDING: { backgroundColor: "#f3f4f6", color: "#6b7280" },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">
          Cutting Memo —{" "}
          {selectedMemo?.fabricSKU && selectedMemo?.fabricTitle
            ? `${selectedMemo.fabricSKU} - ${selectedMemo.fabricTitle}`
            : "Details"}
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton height={60} sx={{ mb: 2 }} />
            <Skeleton height={40} sx={{ mb: 2 }} />
            <Skeleton height={40} />
          </Box>
        ) : memoData ? (
          <Box sx={{ p: 1 }}>
            {/* Stage & meta */}
           

            {memoData.createdBy && (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Person sx={{ fontSize: 18, color: "#6b7280" }} />
                <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
                  Created by: {memoData.createdBy}
                </Typography>
              </Box>
            )}

            {memoData.createdAt && (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
              >
                <Schedule sx={{ fontSize: 18, color: "#6b7280" }} />
                <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
                  {new Date(memoData.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>
            )}

            {/* Summary chips */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              Summary:
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
              <Chip
                icon={<Assignment sx={{ fontSize: 18 }} />}
                label={`Total Items: ${memoData.itemCount || 0}`}
                sx={{
                  backgroundColor: "#e3f2fd",
                  color: "#1976d2",
                  fontSize: "14px",
                  fontWeight: 500,
                  p: 2,
                }}
              />
              <Chip
                icon={<Inventory2 sx={{ fontSize: 18 }} />}
                label={`Total Fabric: ${(memoData.items || []).reduce((sum, item) => sum + (parseFloat(item.totalDhapFold) || 0), 0).toFixed(2)}m`}
                sx={{
                  backgroundColor: "#f3e8ff",
                  color: "#7c3aed",
                  fontSize: "14px",
                  fontWeight: 500,
                  p: 2,
                }}
              />
            </Box>

            {/* Items table */}
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
              Fabric Items:
            </Typography>
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: "none",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                mb: 3,
              }}
            >
              <Table size="small">
                <TableHead>
                  <StyledTableRow sx={{ backgroundColor: "#f9fafb" }}>
                    <StyledTableCell>#</StyledTableCell>
                    <StyledTableCell>Fabric SKU</StyledTableCell>
                    <StyledTableCell>Title</StyledTableCell>
                    <StyledTableCell>Color</StyledTableCell>
                    <StyledTableCell>Dhap</StyledTableCell>
                    <StyledTableCell>Fold</StyledTableCell>
                    <StyledTableCell>Total (m)</StyledTableCell>
                    <StyledTableCell>Shirt SKU</StyledTableCell>
                    <StyledTableCell>Shirt Qty</StyledTableCell>
                  </StyledTableRow>
                </TableHead>
                <TableBody>
                  {(memoData.items || []).map((item, index) => (
                    <StyledTableRow key={item._id}>
                      <StyledTableCell sx={{ color: "#6b7280" }}>
                        {index + 1}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#667eea",
                          }}
                        >
                          {item.fabricSKU}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {item.imageUrl && (
                            <Avatar
                              src={resolveImageUrl(item.imageUrl)}
                              variant="rounded"
                              sx={{ width: 24, height: 24 }}
                            />
                          )}
                          <Typography sx={{ fontSize: "13px" }}>
                            {item.fabricTitle || "—"}
                          </Typography>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography sx={{ fontSize: "13px" }}>
                          {item.fabricColor || "—"}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography sx={{ fontSize: "13px" }}>
                          {item.dhap}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography sx={{ fontSize: "13px" }}>
                          {item.fold}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>
                          {item.totalDhapFold}m
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography sx={{ fontSize: "13px" }}>
                          {item.shirtSKUs?.join(', ') || "—"}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography sx={{ fontSize: "13px" }}>
                          {item.shirtQuantity ?? "—"}
                        </Typography>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Stage History */}
            {memoData.stageHistory?.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                  Stage History:
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {[...memoData.stageHistory]
                    .sort(
                      (a, b) => new Date(b.enteredAt) - new Date(a.enteredAt),
                    )
                    .map((h, i) => (
                      <Box
                        key={h._id || i}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: 1.5,
                          borderRadius: "6px",
                          bgcolor: i === 0 ? "#fff3e0" : "#f9fafb",
                          border: "1px solid",
                          borderColor: i === 0 ? "#f59e0b44" : "#e5e7eb",
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{ fontSize: "13px", fontWeight: 600 }}
                          >
                            {stageLabel[h.stage] || h.stage}
                          </Typography>
                          {h.performedBy && (
                            <Typography
                              sx={{ fontSize: "12px", color: "#6b7280" }}
                            >
                              By: {h.performedBy}
                            </Typography>
                          )}
                        </Box>
                        <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
                          {h.enteredAt
                            ? new Date(h.enteredAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </Typography>
                      </Box>
                    ))}
                </Box>
              </>
            )}
          </Box>
        ) : (
          <Typography sx={{ p: 2, textAlign: "center", color: "#6b7280" }}>
            Memo details not found.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
