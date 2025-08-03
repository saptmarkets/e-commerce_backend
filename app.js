// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/receipts', express.static(path.join(__dirname, 'public', 'receipts'))); 