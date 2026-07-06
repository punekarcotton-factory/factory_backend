export const { VITE_APP_SERVER_URL } = import.meta.env;

export const EnvConfig = {
  NODE_ENV: import.meta.env.NODE_ENV,
};

export const resolveImageUrl = (url) => {
  if (!url) return url;
  if (url.startsWith("/")) {
    // Relative path → prepend backend base URL
    return `${VITE_APP_SERVER_URL}${url}`;
  }
  return url;
};
