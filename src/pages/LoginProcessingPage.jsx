import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../Slice/authSlice";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const LoginProcessingPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user, token } = useSelector((state) => state.auth);

  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inputError, setInputError] = useState("");

  useEffect(() => {
    if (user && token) navigate("/dashboard", { replace: true });
  }, [user, token, navigate]);

  const handleLogin = (e) => {
    e.preventDefault();

    const value = identifier.trim();
    if (!value) {
      setInputError("Please enter email or phone");
      return;
    }

    const isEmail = value.includes("@");

    if (isEmail) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(value)) {
        setInputError("Please enter a valid email");
        return;
      }
    }

    if (!password) {
      setInputError("Please enter password");
      return;
    }

    setInputError("");

    dispatch(loginUser({ 
      identifier: value,  
      password 
    }));
  };

  const textFieldStyle = {
    "& .MuiInputBase-root": { fontSize: "14px", backgroundColor: "#ffffff" },
    "& .MuiInputLabel-root": { fontSize: "14px", color: "#6b7280" },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "#e5e7eb" },
      "&:hover fieldset": { borderColor: "#9ca3af" },
      "&.Mui-focused fieldset": { borderColor: "#667eea", borderWidth: "1.5px" },
    },
  };

  if (user && token) return null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          padding: { xs: 3, sm: 4 },
          borderRadius: "8px",
          width: "100%",
          maxWidth: "400px",
          mx: 2,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "#111827", mb: 0.5, fontSize: "22px" }}>
            Sign in
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", fontSize: "14px" }}>
            Enter your credentials to access your account
          </Typography>
        </Box>

        {(error || inputError) && (
          <Alert severity="error" sx={{ mb: 2.5, fontSize: "13px", borderRadius: "6px" }}>
            {inputError || error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleLogin}>
          <Box sx={{ mb: 2 }}>
            <Typography component="label" sx={{ fontSize: "13px", fontWeight: 500, color: "#374151", mb: 0.75, display: "block" }}>
              Email or Phone
            </Typography>
            <TextField
              fullWidth
              placeholder="name@company.com or 1234567890"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              size="small"
              sx={textFieldStyle}
            />
          </Box>

          <Box sx={{ mb: 2.5 }}>
            <Typography component="label" sx={{ fontSize: "13px", fontWeight: 500, color: "#374151", mb: 0.75, display: "block" }}>
              Password
            </Typography>
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="small"
              sx={textFieldStyle}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: "#6b7280" }}>
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 600,
              py: 1.25,
              backgroundColor: "#667eea",
              color: "#ffffff",
              boxShadow: "none",
              "&:hover": { backgroundColor: "#5568d3", boxShadow: "none" },
              "&:disabled": { backgroundColor: "#e5e7eb", color: "#9ca3af" },
            }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginProcessingPage;