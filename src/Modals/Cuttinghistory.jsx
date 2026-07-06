import { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  Paper,
  Typography,
  Chip,
  IconButton,
  Avatar,
} from "@mui/material";
import { Visibility, Inventory2, Assignment } from "@mui/icons-material";
import axiosInstance from "../utils/axiosInstance";
import NoResponsePage from "../pages/NoResponsePage";
import { StyledTableCell, StyledTableRow } from "../components/Styled";
import CuttingViewHistory from "./CuttingViewHistory";
import { resolveImageUrl } from "../config";

export default function CuttingHistory() {
  const [cuttingData, setCuttingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchCuttingMemos = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(
          "/delivery-memos/cutting/summary",
        );
        setCuttingData(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch cutting memos:", error);
        setCuttingData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCuttingMemos();
  }, []);

  const handleViewDetails = (memo) => {
    setSelectedMemo(memo);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMemo(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <TableContainer
          component={Paper}
          sx={{ boxShadow: "none", border: "1px solid #e5e7eb" }}
        >
          <Table>
            <TableHead>
              <StyledTableRow sx={{ backgroundColor: "#f9fafb" }}>
                <StyledTableCell>#</StyledTableCell>
                <StyledTableCell>Memo Title</StyledTableCell>
                <StyledTableCell>Fabrics</StyledTableCell>
                {/* <StyledTableCell>Stage</StyledTableCell> */}
                <StyledTableCell>Statistics</StyledTableCell>
                <StyledTableCell>Created At</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </StyledTableRow>
            </TableHead>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  if (!cuttingData.length) {
    return (
      <Box sx={{ p: 3 }}>
        <NoResponsePage />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: 3 }}>
        <TableContainer
          component={Paper}
          sx={{
            boxShadow: "none",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        >
          <Table>
            <TableHead>
              <StyledTableRow sx={{ backgroundColor: "#f9fafb" }}>
                <StyledTableCell>#</StyledTableCell>
                <StyledTableCell>Memo Title</StyledTableCell>
                <StyledTableCell>Fabrics</StyledTableCell>
                {/* <StyledTableCell>Stage</StyledTableCell> */}
                <StyledTableCell>Statistics</StyledTableCell>
                <StyledTableCell>Created At</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </StyledTableRow>
            </TableHead>
            <TableBody>
              {cuttingData.map((memo, index) => (
                <StyledTableRow key={memo.deliveryMemoId}>
                  {/* # */}
                  <StyledTableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                    {index + 1}
                  </StyledTableCell>

                  {/* Memo ID */}
                  <StyledTableCell>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: "14px",
                        color: "#111827",
                        fontFamily: "monospace",
                      }}
                    >
                      {memo.items
                        ?.map((item) => item.fabricTitle)
                        .filter(Boolean)
                        .join(", ") || "N/A"}
                    </Typography>
                  </StyledTableCell>

                  {/* Fabrics */}
                  <StyledTableCell>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        flexWrap: "wrap",
                        maxWidth: 220,
                      }}
                    >
                      {(memo.items || []).slice(0, 3).map((item) => (
                        <Box
                          key={item._id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Typography
                            sx={{ fontSize: "12px", color: "#374151" }}
                          >
                            {item.fabricSKU}
                          </Typography>
                        </Box>
                      ))}
                      {(memo.items || []).length > 3 && (
                        <Typography sx={{ fontSize: "12px", color: "#6b7280" }}>
                          +{memo.items.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  </StyledTableCell>

                  {/* Stage */}
                  {/* <StyledTableCell>
                    <Chip
                      label={
                        memo.stage === "CUTTING"
                          ? "Cutting"
                          : memo.stage === "CREATE_DELIVERY_MEMO"
                          ? "Memo Created"
                          : memo.stage || "Pending"
                      }
                      size="small"
                      sx={{
                        backgroundColor:
                          memo.stage === "CUTTING" ? "#fff3e0" : "#e3f2fd",
                        color:
                          memo.stage === "CUTTING" ? "#f57c00" : "#1976d2",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    />
                  </StyledTableCell> */}

                  {/* Statistics */}
                  <StyledTableCell>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip
                        icon={<Assignment sx={{ fontSize: 16 }} />}
                        label={`Items: ${memo.itemCount || 0}`}
                        size="small"
                        sx={{
                          backgroundColor: "#e3f2fd",
                          color: "#1976d2",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      />
                    </Box>
                  </StyledTableCell>

                  <StyledTableCell>
                    <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
                      {memo.stageHistory?.length
                        ? new Date(
                            memo.stageHistory[memo.stageHistory.length - 1]
                              .enteredAt,
                          ).toLocaleString()
                        : "N/A"}
                    </Typography>
                  </StyledTableCell>

                  {/* Actions */}
                  <StyledTableCell>
                    <IconButton
                      onClick={() => handleViewDetails(memo)}
                      sx={{
                        color: "#1976d2",
                        "&:hover": { backgroundColor: "#e3f2fd" },
                      }}
                    >
                      <Visibility sx={{ fontSize: 18 }} />
                    </IconButton>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <CuttingViewHistory
        open={openDialog}
        onClose={handleCloseDialog}
        selectedMemo={selectedMemo}
      />
    </>
  );
}
