import { Notification } from '../config/models.js';

// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const list = await Notification.find({ userId: req.user.id });
    res.json(list);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ message: 'Failed to retrieve notifications.' });
  }
};

// POST /api/notifications
export const createNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const notif = await Notification.create({
      userId: req.user.id,
      title,
      message,
      type: type || 'info',
      read: false
    });
    res.status(201).json(notif);
  } catch (error) {
    console.error('Create notification API error:', error);
    res.status(500).json({ message: 'Failed to create notification.' });
  }
};

// PUT /api/notifications/read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Failed to mark notifications as read.' });
  }
};

// PUT /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.updateOne({ _id: req.params.id }, { read: true });
    res.json({ message: 'Notification marked as read.', notification: notif });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read.' });
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    await Notification.deleteById(req.params.id);
    res.json({ message: 'Notification deleted successfully.' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Failed to delete notification.' });
  }
};
