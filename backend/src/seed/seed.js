require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Thread = require('../models/Thread');
const Comment = require('../models/Comment');
const Message = require('../models/Message');
const ProfileUpdate = require('../models/ProfileUpdate');

async function run() {
  await connectDB();
  await Promise.all([User.deleteMany({}), Thread.deleteMany({}), Comment.deleteMany({}), Message.deleteMany({}), ProfileUpdate.deleteMany({})]);
  const ownerHash = await bcrypt.hash('owner123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('user123', 10);

  const [owner, admin, user] = await User.create([
    { username: 'SiteOwner', email: 'owner@watchtradingforums.com', passwordHash: ownerHash, role: 'owner', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner', motto: 'Owner of Watch Trading Forums', badges: [{ id: 'badge-1', type: 'member_1y', awardedAt: new Date().toISOString() }] },
    { username: 'Admin1', email: 'admin1@watchtradingforums.com', passwordHash: adminHash, role: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin1', motto: 'Forum Administrator' },
    { username: 'WatchCollector', email: 'user@example.com', passwordHash: userHash, role: 'user', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1', motto: 'Vintage watch enthusiast' },
  ]);

  await Thread.create([
    { title: 'Welcome to Watch Trading Forums!', content: 'Welcome everyone to our new community! This is now backed by a real server and database.', authorId: owner._id, authorName: owner.username, authorAvatar: owner.avatar, authorRole: owner.role, authorMotto: owner.motto, sectionId: 'sec-intro', sectionName: 'New Member Introductions', isPinned: true, viewCount: 1250, createdAt: new Date(Date.now() - 30*24*60*60*1000), updatedAt: new Date(Date.now() - 30*24*60*60*1000) },
    { title: 'Rolex Submariner for sale - London', content: 'Selling my 2019 Rolex Submariner. Full set with box and papers. Excellent condition.', authorId: user._id, authorName: user.username, authorAvatar: user.avatar, authorRole: user.role, authorMotto: user.motto, sectionId: 'sec-uk-london', sectionName: 'London', images: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800'], viewCount: 342 },
  ]);

  console.log('Seed complete');
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
