let app;
try {
  app = (await import("../artifacts/api-server/dist/app.mjs")).default;
} catch (e) {
  app = (req, res) => {
    res.status(500).json({ 
      error: "Initialization error", 
      message: e.message, 
      stack: e.stack 
    });
  };
}
export default app;
