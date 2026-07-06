import React, { useState, useMemo } from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Close, FilterList, Check } from "@mui/icons-material";

const PRESTITCHER_ACTIVE_STAGES = [
  "ASSIGNED",
  "IN_PROGRESS",
  "PRESTITCHER_ASSIGNED",
];

const isOpenMemo = (memo) => {
  if (memo.isDone !== undefined) return !memo.isDone;
  if (!memo.stage) return true;
  return PRESTITCHER_ACTIVE_STAGES.some((s) =>
    memo.stage.toUpperCase().includes(s),
  );
};

const getAssignedOptions = (memo) => {
  if (!memo.assignments?.length) return [];
  const seen = new Set();
  const result = [];
  for (const assignment of memo.assignments) {
    for (const opt of assignment.assignedOptions || []) {
      if (opt.option && !seen.has(opt.option)) {
        seen.add(opt.option);
        result.push(opt);
      }
    }
  }
  return result;
};

const FILTER_OPTIONS = [
  { value: "all", label: "All Memos" },
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
];

const PreStitcherOpenPassesModal = ({
  modalOpen,
  handleCloseModal,
  selectedPrestitcher,
  openPasses = [],
  passesLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [anchorEl, setAnchorEl] = useState(null);

  const { openMemos, doneMemos } = useMemo(
    () => ({
      openMemos: openPasses.filter((m) => isOpenMemo(m)),
      doneMemos: openPasses.filter((m) => !isOpenMemo(m)),
    }),
    [openPasses],
  );

  const filteredPasses = useMemo(() => {
    let base = openPasses;
    if (stageFilter === "open") base = openMemos;
    else if (stageFilter === "done") base = doneMemos;

    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(
      (memo) =>
        memo.deliveryMemoId?.toLowerCase().includes(q) ||
        memo.items?.some(
          (item) =>
            item.fabricTitle?.toLowerCase().includes(q) ||
            item.fabricSKU?.toLowerCase().includes(q) ||
            item.shirtSKUs?.some(sku => sku.toLowerCase().includes(q)),
        ),
    );
  }, [openPasses, openMemos, doneMemos, stageFilter, searchQuery]);

  const activeFilterLabel = FILTER_OPTIONS.find(
    (f) => f.value === stageFilter,
  )?.label;

  return (
    <Modal
      open={modalOpen}
      onClose={handleCloseModal}
      aria-labelledby="open-passes-modal"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 1200,
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 2,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={600}>
              All Memos — {selectedPrestitcher?.firstName}{" "}
              {selectedPrestitcher?.lastName}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseModal}>
            <Close />
          </IconButton>
        </Box>

        {/* Summary Chips */}
        <Box sx={{ px: 2, pt: 2, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Chip
            label={`Total: ${openPasses.length}`}
            sx={{ fontWeight: 600, bgcolor: "#f3f4f6", color: "#374151" }}
          />
          <Chip
            label={`Open: ${openMemos.length}`}
            sx={{ fontWeight: 600, bgcolor: "#fff3e0", color: "#f57c00" }}
          />
          <Chip
            label={`Done: ${doneMemos.length}`}
            sx={{ fontWeight: 600, bgcolor: "#e8f5e9", color: "#2e7d32" }}
          />
        </Box>

        {/* Search + Filter Button */}
        <Box sx={{ p: 2, display: "flex", gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search memos, fabrics, or SKUs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              minWidth: 110,
              borderColor: stageFilter !== "all" ? "primary.main" : undefined,
              color: stageFilter !== "all" ? "primary.main" : undefined,
              fontWeight: stageFilter !== "all" ? 600 : 400,
            }}
          >
            {stageFilter !== "all" ? activeFilterLabel : "Filter"}
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {FILTER_OPTIONS.map((opt) => (
              <MenuItem
                key={opt.value}
                selected={stageFilter === opt.value}
                onClick={() => {
                  setStageFilter(opt.value);
                  setAnchorEl(null);
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {stageFilter === opt.value && (
                    <Check fontSize="small" color="primary" />
                  )}
                </ListItemIcon>
                <ListItemText>{opt.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </Box>

        {/* Results count */}
        <Box sx={{ px: 2, pb: 1 }}></Box>

        {/* Table */}
        <Box sx={{ px: 2, pb: 2 }}>
          {passesLoading ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography>Loading...</Typography>
            </Box>
          ) : openPasses.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">No memos found</Typography>
            </Box>
          ) : filteredPasses.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                No memos match your search / filter
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.100" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Memo SKU</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Stage</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Total Dhap Fold
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Items</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Fabric Details
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Shirt Details
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Options</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Notes History</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Created Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPasses.map((memo) => {
                    const isDone = !isOpenMemo(memo);
                    const assignedOptions = getAssignedOptions(memo);
                    return (
                      <TableRow key={memo._id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {memo.items
                                ?.map((item) => item.fabricSKU)
                                .join(", ") || "No SKU"}
                            </Typography>
                            {memo.stageHistory?.find(h => h.stage === 'TASK_REASSIGNED') && (
                              <Typography sx={{ fontSize: '10px', color: '#f59e0b', fontWeight: 600, mt: 0.5, fontStyle: 'italic' }}>
                                Reassigned from: {memo.stageHistory.find(h => h.stage === 'TASK_REASSIGNED').metadata?.reassignedFromName}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              memo.stage?.replace(/_/g, " ") || "In Progress"
                            }
                            size="small"
                            sx={{
                              bgcolor: memo.stage
                                ?.toUpperCase()
                                .includes("ASSIGNED")
                                ? "#e3f2fd"
                                : "#fff3e0",
                              color: memo.stage
                                ?.toUpperCase()
                                .includes("ASSIGNED")
                                ? "#1976d2"
                                : "#f57c00",
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isDone ? "Done" : "Open"}
                            size="small"
                            sx={{
                              bgcolor: isDone ? "#e8f5e9" : "#fff3e0",
                              color: isDone ? "#2e7d32" : "#f57c00",
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>{memo.totalDhapFold || "N/A"}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${memo.items?.length || 0} item(s)`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {memo.items?.length > 0 ? (
                            <Box>
                              {memo.items.map((item, idx) => (
                                <Typography
                                  key={idx}
                                  variant="body2"
                                  sx={{ mb: 0.5 }}
                                >
                                  {item.fabricTitle} - {item.fabricColor} 
                                  
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          {memo.items?.length > 0 ? (
                            <Box>
                              {memo.items.map((item, idx) => (
                                <Typography
                                  key={idx}
                                  variant="body2"
                                  sx={{ mb: 0.5 }}
                                >
                                  {item.shirtSKUs?.join(', ') || "No SKU"} - Qty: {item.shirtQuantity}
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          {assignedOptions.length > 0 ? (
                            <Box
                              sx={{
                                display: "flex",
                                gap: 0.5,
                                flexWrap: "wrap",
                              }}
                            >
                              {assignedOptions.map((opt) => (
                                <Chip
                                  key={opt.option}
                                  label={`${opt.option.charAt(0).toUpperCase() + opt.option.slice(1)} `}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: "11px" }}
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No options
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {memo.assignments?.some(a => a.partialCompletions?.length > 0 || a.notes) ? (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                              {memo.assignments.map((assignment, aIdx) => (
                                <Box key={aIdx}>
                                  {/* Assignment level note if any */}
                                  {assignment.notes && (
                                    <Box sx={{ mb: 0.5, p: 1, bgcolor: "#f9fafb", borderRadius: "4px", border: "1px solid #e5e7eb" }}>
                                      <Typography sx={{ fontSize: "11px", fontWeight: 700, color: "#374151" }}>Initial Note:</Typography>
                                      <Typography sx={{ fontSize: "11px", color: "#4b5563" }}>{assignment.notes}</Typography>
                                    </Box>
                                  )}
                                  {/* Partial completion notes */}
                                  {assignment.partialCompletions?.map((pc, pcIdx) => (
                                    pc.notes && (
                                      <Box key={pcIdx} sx={{ mb: 0.5, p: 1, bgcolor: "#f0fdf4", borderRadius: "4px", border: "1px solid #dcfce7" }}>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                                          <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#166534" }}>Partial Update:</Typography>
                                          <Typography sx={{ fontSize: "9px", color: "#6b7280" }}>
                                            {new Date(pc.createdAt).toLocaleDateString()}
                                          </Typography>
                                        </Box>
                                        <Typography sx={{ fontSize: "11px", color: "#15803d" }}>{pc.notes}</Typography>
                                      </Box>
                                    )
                                  ))}
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No notes</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {memo.createdAt
                            ? new Date(memo.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default PreStitcherOpenPassesModal;
