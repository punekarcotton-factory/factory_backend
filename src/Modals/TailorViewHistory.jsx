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
} from "@mui/material";
import { Close, Phone, Assignment, CheckCircle, Schedule } from "@mui/icons-material";
import axiosInstance from "../utils/axiosInstance";

export default function TailorViewHistory({ open, onClose, selectedTailor }) {
  const [tailorData, setTailorData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && selectedTailor) {
      fetchTailorDetails();
      fetchAssignments();
    }
  }, [open, selectedTailor]);

  const fetchTailorDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/assign-tailor/tailors/statistics");
      const allTailors = response.data?.data || [];
      const tailor = allTailors.find(t => 
        (t.employeeId && t.employeeId === selectedTailor.employeeId) || 
        (t._id && t._id === selectedTailor._id)
      );
      setTailorData(tailor || null);
    } catch (error) {
      console.error("Failed to fetch tailor details:", error);
      setTailorData(null);
    } finally {
      if (!selectedTailor?._id) setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    const tailorId = selectedTailor?._id || selectedTailor?.id;
    if (!tailorId) return;
    
    try {
      const response = await axiosInstance.get(`/assign-tailor/tailors/${tailorId}/assignments`);
      setAssignments(response.data?.data || []);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6">
          {selectedTailor?.name || selectedTailor?.tailorName} - Details
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
        ) : tailorData ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
              {tailorData.name || tailorData.tailorName}
            </Typography>
            
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <Phone sx={{ fontSize: 18, color: "#6b7280" }} />
              <Typography sx={{ fontSize: "16px" }}>
                {tailorData.phoneNumber || tailorData.phone || 'N/A'}
              </Typography>
            </Box>

            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              Task Statistics:
            </Typography>
            
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Chip
                icon={<Assignment sx={{ fontSize: 18 }} />}
                label={`Total Tasks: ${tailorData.taskStats?.totalTasks || tailorData.totalTasks || 0}`}
                sx={{
                  backgroundColor: "#e3f2fd",
                  color: "#1976d2",
                  fontSize: "14px",
                  fontWeight: 500,
                  p: 2
                }}
              />
              <Chip
                icon={<CheckCircle sx={{ fontSize: 18 }} />}
                label={`Completed: ${tailorData.taskStats?.completedTasks || tailorData.completedTasks || 0}`}
                sx={{
                  backgroundColor: "#e8f5e8",
                  color: "#2e7d32",
                  fontSize: "14px",
                  fontWeight: 500,
                  p: 2
                }}
              />
              <Chip
                icon={<Schedule sx={{ fontSize: 18 }} />}
                label={`Pending: ${tailorData.taskStats?.assignedTasks || tailorData.pendingTasks || 0}`}
                sx={{
                  backgroundColor: "#fff3e0",
                  color: "#f57c00",
                  fontSize: "14px",
                  fontWeight: 500,
                  p: 2
                }}
              />
            </Box>

            {tailorData.createdAt && (
              <Box sx={{ mt: 3, mb: 3 }}>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Created: {new Date(tailorData.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            )}

            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: "#111827", borderBottom: "2px solid #e5e7eb", pb: 1 }}>
              Assigned Memos & Notes History:
            </Typography>

            {assignments.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {assignments.map((assignment, idx) => (
                  <Box key={idx} sx={{ p: 2, borderRadius: "12px", border: "1px solid #e5e7eb", bgcolor: "#f9fafb" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, color: "#1e40af" }}>
                        Memo: {assignment.deliveryMemo?.items?.map(i => i.fabricSKU).join(", ") || "N/A"}
                      </Typography>
                      <Chip 
                        label={assignment.status?.replace(/_/g, " ")} 
                        size="small"
                        sx={{ 
                          fontWeight: 700, 
                          fontSize: "10px",
                          bgcolor: assignment.status === "COMPLETED" ? "#dcfce7" : "#dbeafe",
                          color: assignment.status === "COMPLETED" ? "#166534" : "#1e40af"
                        }}
                      />
                    </Box>

                    {/* Initial Memo Note */}
                    {assignment.notes && (
                      <Box sx={{ mb: 1.5, p: 1, bgcolor: "#fff7ed", borderRadius: "6px", border: "1px solid #ffedd5" }}>
                        <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#9a3412", mb: 0.5 }}>Memo Note:</Typography>
                        <Typography sx={{ fontSize: "12px", color: "#7c2d12" }}>{assignment.notes}</Typography>
                      </Box>
                    )}

                    {/* Progress Entries / Historical Updates */}
                    {assignment.progressEntries?.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", mb: 1 }}>
                          Updates Timeline:
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {assignment.progressEntries.map((entry, eIdx) => (
                            entry.notes && (
                              <Box key={eIdx} sx={{ pl: 1, borderLeft: "2px solid #e5e7eb" }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                                  <Typography sx={{ fontSize: "11px", fontWeight: 600, color: "#374151" }}>
                                    Remark:
                                  </Typography>
                                  <Typography sx={{ fontSize: "9px", color: "#9ca3af" }}>
                                    {new Date(entry.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontSize: "12px", color: "#4b5563" }}>
                                  "{entry.notes}"
                                </Typography>
                              </Box>
                            )
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    <Typography sx={{ fontSize: "10px", color: "#9ca3af", mt: 1.5, textAlign: "right" }}>
                      Assigned: {new Date(assignment.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography sx={{ textAlign: "center", color: "#9ca3af", py: 4 }}>
                No assignment history found.
              </Typography>
            )}
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