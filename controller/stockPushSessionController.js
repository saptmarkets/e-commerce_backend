const StockPushSession = require('../models/StockPushSession');

exports.listSessions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      StockPushSession.find({}).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      StockPushSession.countDocuments({}),
    ]);
    res.json({ success: true, data: items, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const total = await StockPushSession.countDocuments({});
    const inProgress = await StockPushSession.countDocuments({ status: 'in_progress' });
    const completed = await StockPushSession.countDocuments({ status: 'completed' });
    const partial = await StockPushSession.countDocuments({ status: 'partial' });
    const failed = await StockPushSession.countDocuments({ status: 'failed' });
    res.json({ success: true, data: { total, inProgress, completed, partial, failed } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const adminId = req.user?._id || req.admin?._id;
    const payload = req.body || {};
    const session = await StockPushSession.create({
      name: payload.name || 'Manual Stock Push',
      description: payload.description || '',
      initiatedBy: adminId,
      status: 'in_progress',
      sessionId: payload.sessionId || `SPS_${Date.now()}`,
      settings: payload.settings || {},
    });
    res.status(201).json({ success: true, data: session });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.syncSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await StockPushSession.findById(id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    // Placeholder – real sync handled by odooSyncController pushBackStock
    res.json({ success: true, data: session });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    await StockPushSession.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}; 