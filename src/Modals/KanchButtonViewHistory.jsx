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
  Divider,
} from "@mui/material";
import { Close, Phone, Assignment, CheckCircle, Schedule, Notes } from "@mui/icons-material";
import axiosInstance from "../utils/axiosInstance";

export default function KanchButtonViewHistory({ open, onClose, selectedWorker }) {
  const [workerData, setWorkerData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && selectedWorker) {
      fetchWorkerDetails();
    }
  }, [open, selectedWorker]);

  const fetchWorkerDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/kanch-button/statistics");
      const allWorkers = response.data?.data || [];
      const worker = allWorkers.find(w =>
        (w.employeeId && w.employeeId === selectedWorker.employeeId) ||
        (w._id && w._id === selectedWorker._id)
      );
      setWorkerData(worker || null);
    } catch (error) {
      console.error("Failed to fetch worker details:", error);
      setWorkerData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">
          {selectedWorker?.name || selectedWorker?.workerName} - Details
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
        ) : workerData ? (
          <Box sx={{ p: 2 }}>
            {/* Worker Info */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
              {workerData.name || workerData.workerName}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <Phone sx={{ fontSize: 18, color: "#6b7280" }} />
              <Typography sx={{ fontSize: "16px" }}>
                {workerData.phoneNumber || workerData.phone || 'N/A'}
              </Typography>
            </Box>

            {/* Task Statistics */}
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              Task Statistics:
            </Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip
                icon={<Assignment sx={{ fontSize: 18 }} />}
                label={`Total Tasks: ${workerData.taskStats?.totalTasks || workerData.totalTasks || 0}`}
                sx={{ backgroundColor: "#e3f2fd", color: "#1976d2", fontSize: "14px", fontWeight: 500, p: 2 }}
              />
              <Chip
                icon={<CheckCircle sx={{ fontSize: 18 }} />}
                label={`Completed: ${workerData.taskStats?.completedTasks || workerData.completedTasks || 0}`}
                sx={{ backgroundColor: "#e8f5e8", color: "#2e7d32", fontSize: "14px", fontWeight: 500, p: 2 }}
              />
              <Chip
                icon={<Schedule sx={{ fontSize: 18 }} />}
                label={`Pending: ${workerData.taskStats?.assignedTasks || workerData.pendingTasks || 0}`}
                sx={{ backgroundColor: "#fff3e0", color: "#f57c00", fontSize: "14px", fontWeight: 500, p: 2 }}
              />
            </Box>

            {workerData.createdAt && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Created: {new Date(workerData.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            )}

            {/* All Notes Section — deduplicated inside workerData block */}
            {(() => {
              const allNotes = [...(workerData.notes || [])]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .filter((note, index, self) =>
                  index === self.findIndex(n => n.text === note.text)
                );

              return (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                    <Notes sx={{ color: "#6b7280" }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      All Notes ({allNotes.length})
                    </Typography>
                  </Box>

                  {!allNotes.length ? (
                    <Typography sx={{ color: "#9ca3af", fontSize: "14px" }}>
                      No notes recorded for this worker.
                    </Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {allNotes.map((note, index) => (
                        <Box key={index} sx={{
                          p: 2,
                          backgroundColor: "#f9fafb",
                          borderRadius: 2,
                          border: "1px solid #e5e7eb",
                          borderLeft: "4px solid #1976d2"
                        }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Chip
                              label={note.label}
                              size="small"
                              sx={{ backgroundColor: "#e3f2fd", color: "#1976d2", fontSize: "11px" }}
                            />
                            <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                              {note.date ? new Date(note.date).toLocaleString() : ""}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: "#374151", mt: 1 }}>
                            {note.text}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#d1d5db" }}>
                            Memo: {note.memoId}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
              );
            })()}
          </Box>
        ) : (
          <Typography sx={{ p: 2, textAlign: "center", color: "#6b7280" }}>
            Worker details not found.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}