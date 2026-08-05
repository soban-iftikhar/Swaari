import { Toaster } from "react-hot-toast";

/**
 * Global toast container configured with the solid design tokens.
 * Wrap the app with this so any component can call `toast.success()` / `toast.error()`.
 */
export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--color-paper)",
          color: "var(--color-charcoal)",
          border: "1px solid var(--color-line)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
          fontFamily: "var(--font-sans)",
          fontSize: "0.9rem",
          boxShadow: "var(--shadow-pop)",
        },
        success: {
          iconTheme: {
            primary: "var(--color-emerald)",
            secondary: "var(--color-paper)",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--color-danger)",
            secondary: "var(--color-paper)",
          },
          duration: 5000,
        },
      }}
    />
  );
}
