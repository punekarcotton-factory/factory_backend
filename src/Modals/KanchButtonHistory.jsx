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
} from "@mui/material";
import {
  Visibility,
  Phone,
  Assignment,
  CheckCircle,
  Schedule,
} from "@mui/icons-material";
import axiosInstance from "../utils/axiosInstance";
import NoResponsePage from "../pages/NoResponsePage";
import KanchButtonViewHistory from "./KanchButtonViewHistory";
import { StyledTableCell, StyledTableRow } from "../components/Styled";

export default function KanchButtonHistory() {
  const [kanchButtonData, setKanchButtonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [workerHistory, setWorkerHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const fetchKanchButtonStatistics = async () => {
      try {
        setLoading(true);
        console.log("Fetching kanch button statistics...");
        const response = await axiosInstance.get("/kanch-button/statistics");
        console.log("API Response:", response.data);
        setKanchButtonData(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch kanch button statistics:", error);
        console.error("Error details:", error.response?.data);
        setKanchButtonData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchKanchButtonStatistics();
  }, []);

  const handleViewDetails = async (worker) => {
    setSelectedWorker(worker);
    setOpenDialog(true);
    setHistoryLoading(true);

    try {
      setWorkerHistory(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch worker history:", error);
      setWorkerHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedWorker(null);
    setWorkerHistory([]);
  };

  console.log("kanchButtonData state:", kanchButtonData, "Loading:", loading);

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
                <StyledTableCell>Worker Name</StyledTableCell>
                <StyledTableCell>Contact Details</StyledTableCell>
                <StyledTableCell>Task Statistics</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </StyledTableRow>
            </TableHead>
            {/* <TableBody>
              {[1, 2, 3, 4].map((i) => (
                <StyledTableRow key={i}>
                  <StyledTableCell>
                    <Skeleton width={20} />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Skeleton width={150} />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Skeleton width={120} />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Skeleton width={300} />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Skeleton width={40} />
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody> */}
          </Table>
        </TableContainer>
      </Box>
    );
  }

  if (!kanchButtonData.length) {
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
                <StyledTableCell>Worker Name</StyledTableCell>
                <StyledTableCell>Contact Details</StyledTableCell>
                <StyledTableCell>Task Statistics</StyledTableCell>
                <StyledTableCell>Created At</StyledTableCell>
                <StyledTableCell>Actions</StyledTableCell>
              </StyledTableRow>
            </TableHead>
            <TableBody>
              {kanchButtonData.map((worker, index) => (
                <StyledTableRow key={worker.employeeId || worker._id}>
                  <StyledTableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                    {index + 1}
                  </StyledTableCell>

                  <StyledTableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          fontSize: "14px",
                          color: "#111827",
                        }}
                      >
                        {worker.name || worker.workerName || "N/A"}
                      </Typography>
                      {worker.isActive === false && (
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
                      <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
                        {worker.phoneNumber || worker.phone || "N/A"}
                      </Typography>
                    </Box>
                  </StyledTableCell>

                  <StyledTableCell>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip
                        icon={<Assignment sx={{ fontSize: 16 }} />}
                        label={`Total: ${
                          worker.taskStats?.totalTasks || worker.totalTasks || 0
                        }`}
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
                        label={`Done: ${
                          worker.taskStats?.completedTasks ||
                          worker.completedTasks ||
                          0
                        }`}
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
                          worker.taskStats?.assignedTasks ||
                          worker.pendingTasks ||
                          0
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
                    <Typography sx={{ fontSize: "14px", color: "#6b7280" }}>
                      {worker.createdAt
                        ? new Date(worker.createdAt).toLocaleDateString()
                        : "N/A"}
                    </Typography>
                  </StyledTableCell>

                  <StyledTableCell>
                    <IconButton
                      onClick={() => handleViewDetails(worker)}
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

      <KanchButtonViewHistory
        open={openDialog}
        onClose={handleCloseDialog}
        selectedWorker={selectedWorker}
      />
    </>
  );
}
