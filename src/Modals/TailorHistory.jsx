import { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  IconButton,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import {
  Visibility,
  Phone,
  Assignment,
  CheckCircle,
  Schedule,
  Close,
  LocationOn,
} from "@mui/icons-material";
import axiosInstance from "../utils/axiosInstance";
import NoResponsePage from "../pages/NoResponsePage";
import TailorViewHistory from "./TailorViewHistory";
import { StyledTableCell, StyledTableRow } from "../components/Styled";

export default function TailorHistory() {
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTailor, setSelectedTailor] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchTailorStatistics = async () => {
      try {
        setLoading(true);
        console.log("Fetching tailor statistics...");
        const response = await axiosInstance.get(
          "/assign-tailor/tailors/statistics"
        );
        console.log("API Response:", response.data);
        setTailors(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch tailor statistics:", error);
        console.error("Error details:", error.response?.data);
        setTailors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTailorStatistics();
  }, []);

  const handleViewDetails = async (tailor) => {
    setSelectedTailor(tailor);
    setOpenDialog(true);
    setHistoryLoading(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTailor(null);
    setTailorHistory([]);
  };

  console.log("Tailors state:", tailors, "Loading:", loading);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <TableContainer
          component={Paper}
          sx={{ boxShadow: "none", border: "1px solid #e5e7eb" }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f9fafb" }}>
                <StyledTableCell>#</StyledTableCell>
                <StyledTableCell>Tailor Name</StyledTableCell>
                <StyledTableCell>Contact Details</StyledTableCell>
                <StyledTableCell>Task Statistics</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            {/* <TableBody>
              {[1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  <StyledTableCell><Skeleton width={20} /></StyledTableCell>
                  <StyledTableCell><Skeleton width={150} /></StyledTableCell>
                  <StyledTableCell><Skeleton width={120} /></StyledTableCell>
                  <StyledTableCell><Skeleton width={300} /></StyledTableCell>
                  <StyledTableCell><Skeleton width={40} /></StyledTableCell>
                  <StyledTableCell><Skeleton width={40} /></StyledTableCell>
                </TableRow>
              ))}
            </TableBody> */}
          </Table>
        </TableContainer>
      </Box>
    );
  }

  if (!tailors.length) {
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
                <StyledTableCell>Tailor Name</StyledTableCell>
                <StyledTableCell>Contact Details</StyledTableCell>
                <StyledTableCell>Task Statistics</StyledTableCell>
                <StyledTableCell>Created At</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </StyledTableRow>
            </TableHead>
            <TableBody>
              {tailors.map((tailor, index) => (
                <StyledTableRow
                  key={tailor.employeeId || tailor._id}
                  sx={{
                    "&:hover": {
                      backgroundColor: "#f9fafb",
                    },
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <StyledTableCell>{index + 1}</StyledTableCell>
                  <StyledTableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontWeight: 500, color: "#111827" }}>
                        {tailor.name}
                      </Typography>
                      {tailor.isActive === false && (
                        <Chip
                          label="Deactivated"
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "10px",
                            bgcolor: "#fee2e2",
                            color: "#ef4444",
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Phone sx={{ fontSize: 16, color: "#6b7280" }} />
                      <Typography sx={{ color: "#6b7280" }}>
                        {tailor.phoneNumber}
                      </Typography>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip
                        icon={<Assignment sx={{ fontSize: 16 }} />}
                        label={`Total: ${tailor.taskStats?.totalTasks || 0}`}
                        size="small"
                        sx={{
                          backgroundColor: "#e3f2fd",
                          color: "#1976d2",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      />
                      <Chip
                        icon={<CheckCircle sx={{ fontSize: 16 }} />}
                        label={`Done: ${tailor.taskStats?.completedTasks || 0}`}
                        size="small"
                        sx={{
                          backgroundColor: "#e8f5e8",
                          color: "#2e7d32",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      />
                      <Chip
                        icon={<Schedule sx={{ fontSize: 16 }} />}
                        label={`Pending: ${
                          tailor.taskStats?.assignedTasks || 0
                        }`}
                        size="small"
                        sx={{
                          backgroundColor: "#fff3e0",
                          color: "#f57c00",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      />
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Typography sx={{ color: "#6b7280" }}>
                        {tailor.createdAt
                          ? new Date(tailor.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "N/A"}
                      </Typography>
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell>
                    <IconButton
                      onClick={() => handleViewDetails(tailor)}
                      sx={{
                        color: "#1976d2",
                        "&:hover": {
                          backgroundColor: "#e3f2fd",
                        },
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
      <TailorViewHistory
        open={openDialog}
        onClose={handleCloseDialog}
        selectedTailor={selectedTailor}
      />
    </>
  );
}
