import { Box, Typography, Paper } from "@mui/material";
import { Assignment } from "@mui/icons-material";

const NoResponsePage = () => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "600px",
        background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          padding: { xs: 3, sm: 4 },
          borderRadius: "12px",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "rgba(102, 126, 234, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            border: "2px solid rgba(102, 126, 234, 0.2)",
          }}
        >
          <Assignment
            sx={{
              fontSize: 40,
              color: "#667eea",
            }}
          />
        </Box>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: "#667eea",
            mb: 1,
            fontSize: "24px",
          }}
        >
          No Responses Yet
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#6b7280",
            fontSize: "14px",
            lineHeight: 1.6,
            maxWidth: "300px",
            margin: "0 auto",
          }}
        >
          Your response collection is currently empty. Responses will appear here once available.
        </Typography>
      </Paper>
    </Box>
  );
};

export default NoResponsePage;